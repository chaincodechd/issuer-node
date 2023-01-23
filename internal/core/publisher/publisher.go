package publisher

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/google/uuid"
	"github.com/iden3/go-circuits"
	core "github.com/iden3/go-iden3-core"
	"github.com/iden3/go-iden3-crypto/poseidon"
	"github.com/iden3/go-merkletree-sql/v2"
	"github.com/jackc/pgx/v4"
	"github.com/polygonid/sh-id-platform/internal/db"

	"github.com/polygonid/sh-id-platform/internal/core/domain"
	"github.com/polygonid/sh-id-platform/internal/core/ports"
	"github.com/polygonid/sh-id-platform/internal/kms"
	"github.com/polygonid/sh-id-platform/internal/log"
)

const (
	promLabelStatus    = "status"
	promLabelStatusOk  = "ok"
	promLabelStatusErr = "error"
)

type publisher struct {
	storage            *db.Storage
	identityService    ports.IndentityService
	claimService       ports.ClaimsService
	mtService          ports.MtService
	kms                kms.KMSType
	transactionService ports.TransactionService
}

// New - Constructor
func New(storage *db.Storage, identityService ports.IndentityService, claimService ports.ClaimsService, mtService ports.MtService, kms kms.KMSType, transactionService ports.TransactionService) *publisher {
	return &publisher{
		identityService:    identityService,
		claimService:       claimService,
		storage:            storage,
		mtService:          mtService,
		kms:                kms,
		transactionService: transactionService,
	}
}

func (p *publisher) PublishState() {
	ctx := context.Background()

	// TODO: make snapshot
	// make snapshot if rds was init

	// 1. Get all issuers that have claims not included in any state
	issuers, err := p.identityService.GetUnprocessedIssuersIDs(ctx)
	if err != nil {
		log.Error(ctx, "error fetching unprocessed issuers ids", err)
		return
	}

	// 2. Get all states that were not transacted by some reason
	states, err := p.identityService.GetNonTransactedStates(ctx)
	if err != nil {
		log.Error(ctx, "error fetching non transacted states", err)
		return
	}

	// 3. Publish non -transacted states
	for i := range states {
		err = p.publishProof(ctx, states[i])
		if err != nil {
			log.Error(ctx, "Error during publishing proof", err, states[i].Identifier)
			continue
		}
	}

	// we shouldn't process IDs which had unpublished states.

	toCalculateAndPublish := []*core.DID{}
	for _, id := range issuers {
		if !domain.ContainsID(states, id) {
			toCalculateAndPublish = append(toCalculateAndPublish, id)
		}
	}

	// 4. Calculate new states and publish them synchronously
	for _, id := range toCalculateAndPublish {
		state, err := p.identityService.UpdateState(ctx, id)
		if err != nil {
			log.Error(ctx, "Error during processing claims", err, id.String())
			continue
		}

		err = p.publishProof(ctx, *state)
		if err != nil {
			log.Error(ctx, "Error during publishing proof", err, id.String())
			continue
		}
	}
}

// PublishProof publishes new proof using the latest state
func (p *publisher) publishProof(ctx context.Context, newState domain.IdentityState) (err error) {
	// TODO: add metricts
	//start := time.Now()
	//defer func() {
	//	status := promLabelStatusOk
	//	if err != nil {
	//		status = promLabelStatusErr
	//	}
	//
	//}()

	did, err := core.ParseDID(newState.Identifier)
	if err != nil {
		return err
	}

	// 1. Get latest transacted state
	latestState, err := p.identityService.GetLatestStateByID(ctx, did)
	if err != nil {
		return err
	}

	// latestStateHash, err := merkletree.NewHashFromHex(*latestState.State)
	_, err = merkletree.NewHashFromHex(*latestState.State)
	if err != nil {
		return err
	}

	// TODO: core.IdenState should be calculated before state stored to db
	newStateHash, err := merkletree.NewHashFromHex(*newState.State)
	if err != nil {
		return err
	}

	authClaim, err := p.claimService.GetAuthClaimForPublishing(ctx, did, *newState.State)
	if err != nil {
		return err
	}

	claimKeyID, err := p.identityService.GetKeyIDFromAuthClaim(ctx, authClaim)
	if err != nil {
		return err
	}

	oldStateTree, err := latestState.ToTreeState()
	if err != nil {
		return err
	}

	circuitAuthClaim, err := p.fillAuthClaimData(ctx, did, authClaim)
	if err != nil {
		return err
	}

	hashOldAndNewStates, err := poseidon.Hash([]*big.Int{oldStateTree.State.BigInt(), newStateHash.BigInt()})
	if err != nil {
		return err
	}

	sigDigest := kms.BJJDigest(hashOldAndNewStates)
	sigBytes, err := p.kms.Sign(ctx, claimKeyID, sigDigest)
	if err != nil {
		return err
	}

	signature, err := kms.DecodeBJJSignature(sigBytes)
	if err != nil {
		return err
	}

	isLatestStateGenesis := latestState.PreviousState == nil
	stateTransitionInputs := circuits.StateTransitionInputs{
		ID:                &did.ID,
		NewState:          newStateHash,
		OldTreeState:      oldStateTree,
		IsOldStateGenesis: isLatestStateGenesis,

		AuthClaim:          circuitAuthClaim.Claim,
		AuthClaimIncMtp:    circuitAuthClaim.IncProof.Proof,
		AuthClaimNonRevMtp: circuitAuthClaim.NonRevProof.Proof,

		Signature: signature,
	}

	_, err = stateTransitionInputs.InputsMarshal()
	// jsonInputs, err := stateTransitionInputs.InputsMarshal()
	if err != nil {
		return err
	}

	// TODO: Integrate when it's finished
	//fullProof, err := p.ZKService.Generate(ctx, jsonInputs, string(circuits.StateTransitionCircuitID))
	//if err != nil {
	//	return err
	//}

	// 7. Publish state and receive txID

	//txID, err := p.PublishingService.PublishState(ctx, did, latestStateHash, newStateHash, isLatestStateGenesis, fullProof.Proof)
	//if err != nil {
	//	return err
	//}

	// 8. Update state with txID value (block values are still default because tx is not confirmed)

	// TODO: we should use txID from step 7.
	newState.Status = domain.StatusTransacted
	txUUID, _ := uuid.NewRandom()
	txID := txUUID.String()
	newState.TxID = &txID

	err = p.identityService.UpdateIdentityState(ctx, &newState)
	if err != nil {
		return err
	}

	// add go routine that will listen for transaction status update

	go func() {
		err2 := p.updateTransactionStatus(ctx, newState, txID)
		if err2 != nil {
			log.Error(ctx, "can not update transaction status", err2)
		}
	}()
	return nil
}

func (p *publisher) fillAuthClaimData(ctx context.Context, identifier *core.DID, authClaim *domain.Claim) (circuits.ClaimWithMTPProof, error) {
	var authClaimData circuits.ClaimWithMTPProof

	err := p.storage.Pgx.BeginFunc(
		ctx, func(tx pgx.Tx) error {
			var errIn error

			var idState *domain.IdentityState
			idState, errIn = p.identityService.GetLatestStateByID(ctx, identifier)
			if errIn != nil {
				return errIn
			}

			identityTrees, errIn := p.mtService.GetIdentityMerkleTrees(ctx, tx, identifier)
			if errIn != nil {
				return errIn
			}

			claimsTree, errIn := identityTrees.ClaimsTree()
			if errIn != nil {
				return errIn
			}
			// get index hash of authClaim
			coreClaim := authClaim.CoreClaim.Get()
			hIndex, errIn := coreClaim.HIndex()
			if errIn != nil {
				return errIn
			}

			authClaimMTP, _, errIn := claimsTree.GenerateProof(ctx, hIndex, idState.TreeState().ClaimsRoot)
			if errIn != nil {
				return errIn
			}

			authClaimData = circuits.ClaimWithMTPProof{
				Claim: coreClaim,
			}

			authClaimData.IncProof = circuits.MTProof{
				Proof:     authClaimMTP,
				TreeState: idState.TreeState(),
			}

			// revocation / non revocation MTP for the latest identity state
			nonRevocationProof, errIn := identityTrees.
				GenerateRevocationProof(ctx, new(big.Int).SetUint64(uint64(authClaim.RevNonce)), idState.TreeState().RevocationRoot)

			authClaimData.NonRevProof = circuits.MTProof{
				TreeState: idState.TreeState(),
				Proof:     nonRevocationProof,
			}

			return errIn
		})
	if err != nil {
		return authClaimData, err
	}
	return authClaimData, nil
}

// updateTransactionStatus update identity state with transaction status
func (p *publisher) updateTransactionStatus(ctx context.Context, state domain.IdentityState, txID string) error {
	receipt, err := p.transactionService.WaitForTransactionReceipt(ctx, txID)
	if err != nil {
		log.Error(ctx, "error during receipt receiving: ", err)
		return err
	}

	if receipt.Status == types.ReceiptStatusSuccessful {
		// wait until transaction will be confirmed if transaction has enough confirmation blocks
		log.Debug(ctx, "Waiting for confirmation", "tx", receipt.TxHash.Hex())
		confirmed, rErr := p.transactionService.WaitForConfirmation(ctx, receipt)
		if rErr != nil {
			return fmt.Errorf("transaction receipt is found, but not confirmed - %s", *state.TxID)
		}
		if !confirmed {
			return fmt.Errorf("transaction receipt is found, but tx is not confirmed yet - %s", *state.TxID)
		}
	} else {
		// do not wait for many confirmations, just save as failed
		log.Info(ctx, "transaction failed", "tx", *state.TxID)
	}

	err = p.updateIdentityStateTxStatus(ctx, &state, receipt)
	if err != nil {
		log.Error(ctx, "error during identity state update: ", err)
		return err
	}

	log.Info(ctx, "transaction status updated", "tx", txID)
	return nil
}

func (p *publisher) updateIdentityStateTxStatus(ctx context.Context, state *domain.IdentityState, receipt *types.Receipt) error {
	header, err := p.transactionService.GetHeaderByNumber(ctx, receipt.BlockNumber)
	if err != nil {
		log.Error(ctx, "couldn't find receipt block: ", err)
		return err
	}

	blockNumber := int(receipt.BlockNumber.Int64())
	state.BlockNumber = &blockNumber

	blockTime := int(header.Time)
	state.BlockTimestamp = &blockTime

	if receipt.Status == types.ReceiptStatusSuccessful {
		state.Status = domain.StatusConfirmed
		err = p.claimService.UpdateClaimsMTPAndState(ctx, state)
	} else {
		state.Status = domain.StatusFailed
		err = p.identityService.UpdateIdentityState(ctx, state)
	}

	if err != nil {
		log.Error(ctx, "state is not updated: ", err)
		return err
	}

	return nil
}
