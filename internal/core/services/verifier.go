package services

import (
	"context"
	"fmt"

	// "github.com/google/uuid"
	// "github.com/google/uuid"
	"github.com/iden3/iden3comm/v2/protocol"
	"github.com/polygonid/sh-id-platform/internal/core/domain"
	"github.com/polygonid/sh-id-platform/internal/core/ports"
	"github.com/polygonid/sh-id-platform/internal/db"
)

type verifier struct {
	verRepo ports.VerifierRepository
	storage *db.Storage
}

func NewVerifier(reqRepo ports.VerifierRepository, storage *db.Storage) ports.VerifierService {
	return &verifier{
		verRepo: reqRepo,
		storage: storage,
	}
}

func (v *verifier) GetAuthRequest(ctx context.Context, schemaType string, schemaURL string, credSubject map[string]interface{}) (protocol.AuthorizationRequestMessage, error) {
	return v.verRepo.GetAuthRequest(ctx, schemaType, schemaURL, credSubject)
}

func (v *verifier) Callback(ctx context.Context, sessionId string, tokenString []byte) ([]byte, error) {
	return v.verRepo.Callback(ctx, sessionId, tokenString)
}

func (v *verifier) GetDigiLockerURL(ctx context.Context) (*domain.DigilockerURLResponse, error) {
	res, err := v.verRepo.Login(ctx, "ChaincodeConsulting_test", "tu6rithof3qe")
	if err != nil {
		return nil, err
	}

	resp, err := v.verRepo.GetDigilockerURL(ctx, res.UserId, res.Id)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (v *verifier) AccessDigiLocker(ctx context.Context, patronid string, requestId string, accessToken string, Adhar bool, PAN bool) (string, error) {
	v.verRepo.GetDetails(ctx, patronid, requestId, accessToken)
	// if err != nil {
	// 	return "", err
	// }
	// fmt.Println("AccessDigiLocker", resp)
	return "AccessDigiLocker", nil
}














func (v *verifier) VerifyPAN(ctx context.Context,PAN string,Name string) (*domain.VerifyPANResponse, error) {
	res, err := v.verRepo.Login(ctx, "ChaincodeConsulting_test", "tu6rithof3qe")
	if err != nil {
		return nil, err
	}

	resp, err := v.verRepo.GetIdentity(ctx, res.UserId, "individualPan", res.Id)
	if err != nil {
		return nil, err
	}

	result, err := v.verRepo.VerifyPAN(ctx,resp.Id,resp.AccessToken,res.Id,PAN,Name,false,true)
	if err != nil {
		return nil, err
	}

	fmt.Println("VerifyPAN",result)
	return result, nil
}

func (v *verifier) VerifyAdhar(ctx context.Context,AdharNumber string) (*domain.VerifyAadhaarResponse, error) {
	res, err := v.verRepo.Login(ctx, "ChaincodeConsulting_test", "tu6rithof3qe")
	if err != nil {
		return nil, err
	}
	fmt.Println("Login", res)

	resp, err := v.verRepo.GetIdentity(ctx, res.UserId, "aadhaar", res.Id)
	if err != nil {
		return nil, err
	}
	fmt.Println("GetIdentity", resp)
	result, err := v.verRepo.VerifyAdhar(ctx,resp.Id,resp.AccessToken,res.Id,AdharNumber)
	fmt.Println("AdharNumber", AdharNumber)
	if err != nil {
		return nil, err
	}
	fmt.Println("VerifyAdhar", result)
	return result, nil
}

func(v *verifier) VerifyGSTIN(ctx context.Context, gstin string) (*domain.VerifyGSTINResponseNew, error){
	res, err := v.verRepo.Login(ctx, "ChaincodeConsulting_test", "tu6rithof3qe")
	if err != nil {
		return nil, err
	}
	fmt.Println("Login", res)

	resp,err :=v.verRepo.VerifyGSTIN(ctx,res.UserId,res.Id,gstin)
	if err!= nil{
		return nil, err
	}
	return resp,err
}

func (v *verifier) VerifierLogin(ctx context.Context, username string, password string) (*domain.VerifierDetails, error) {
	res, err := v.verRepo.VerifierLogin(ctx,v.storage.Pgx, username, password)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (v *verifier) VerifierRegister(ctx context.Context,id string, username string, password string, orgName string, orgGmail string) (string, error) {
	res, err := v.verRepo.VerifierRegister(ctx,v.storage.Pgx, username, password,id, orgName, orgGmail)
	if err != nil {
		return res, err
	}
	return res, nil
}

func (v *verifier) VerifierDetails(ctx context.Context, verifierId string) (*domain.VerifierDetails, error) {
	verifierDetails, err := v.verRepo.VerifierDetails(ctx,v.storage.Pgx, verifierId)
	if err != nil {
		return nil, err
	}
	return verifierDetails, nil
}
