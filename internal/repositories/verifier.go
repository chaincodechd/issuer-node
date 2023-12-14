package repositories

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	// "os"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"
	"github.com/iden3/go-circuits/v2"

	// cir "github.com/iden3/go-circuits"
	auth "github.com/iden3/go-iden3-auth/v2"
	"github.com/iden3/go-iden3-auth/v2/loaders"
	"github.com/iden3/go-iden3-auth/v2/pubsignals"
	"github.com/iden3/go-iden3-auth/v2/state"

	// "github.com/iden3/go-rapidsnark/types"
	"github.com/golang-jwt/jwt"

	// "github.com/iden3/go-jwz"
	// "github.com/iden3/go-iden3-crypto/constants"
	// "github.com/iden3/go-iden3-crypto/poseidon"
	// "github.com/iden3/go-iden3-crypto/utils"
	// "github.com/iden3/go-rapidsnark/types"
	// zk "github.com/iden3/go-jwz"
	"github.com/iden3/iden3comm/v2/protocol"

	// shell "github.com/ipfs/go-ipfs-api"
	"github.com/polygonid/sh-id-platform/internal/core/domain"
	"github.com/polygonid/sh-id-platform/internal/core/ports"
	// "github.com/polygonid/sh-id-platform/internal/core/services"
	"github.com/polygonid/sh-id-platform/internal/db"
)

type verifier struct{}

func NewVerifier() ports.VerifierRepository {
	return &verifier{}
}

type IdentityRequest struct {
	Type        string   `json:"type"`
	CallbackURL string   `json:"callbackUrl"`
	Email       string   `json:"email"`
	Images      []string `json:"images"`
}

type GetDetailsRequest struct {
	Task       string `json:"type"`
	Essentials struct {
		RequestId string `json:"requestId"`
	} `json:"essentials"`
}

type VerifyAdharResponse struct {
	Response struct {
		Result struct {
			Verified     bool   `json:"verified"`
			AgeBand      string `json:"ageBand"`
			State        string `json:"state"`
			MobileNumber string `json:"mobileNumber"`
			Gender       string `json:"gender"`
		} `json:"result"`
	} `json:"response"`
}

type VerifierDetails struct {
	VerifierID string `json:"verifierId"`
	UserName   string `json:"userName"`
	OrgName    string `json:"orgName"`
	OrgGmail   string `json:"orgGmail"`
}

type verifyresponse struct {
	Response struct {
		Name      string `json:"name"`
		Number    string `json:"number"`
		Fuzzy     string `json:"fuzzy"`
		PanStatus string `json:"panStatus"`
		ID        int    `json:"id"`
		Instance  struct {
			ID          string `json:"id"`
			CallbackUrl string `json:"callbackUrl"`
		} `json:"instance"`
		Result struct {
			Verified      bool   `json:"verified"`
			Message       string `json:"message"`
			UpstreamName  string `json:"upstreamName"`
			PanStatus     string `json:"panStatus"`
			PanStatusCode string `json:"panStatusCode"`
		} `json:"result"`
	} `json:"response"`
}

// type HeaderKey string
// // Token represents a JWZ Token.
// type Token struct {
// 	ZkProof *types.ZKProof // The third segment of the token.  Populated when you Parse a token

	// Alg       string // fields that are part of headers
	// CircuitID string // id of circuit that will be used for proving

// 	Method ProvingMethod // proving method to create a zkp

// 	raw rawJSONWebZeroknowledge // The raw token.  Populated when you Parse a token

// 	inputsPreparer ProofInputsPreparerHandlerFunc
// }

// // rawJSONWebZeroknowledge is json web token with signature presented by zero knowledge proof
// type rawJSONWebZeroknowledge struct {
// 	Payload   []byte                    `json:"payload,omitempty"`
// 	Protected []byte                    `json:"protected,omitempty"`
// 	Header    map[HeaderKey]interface{} `json:"header,omitempty"`
// 	ZKP       []byte                    `json:"zkp,omitempty"`
// }

// // ProvingMethod can be used add new methods for signing or verifying tokens.
// type ProvingMethod interface {
// 	Verify(messageHash []byte, proof *types.ZKProof, verificationKey []byte) error // Returns nil if proof is valid
// 	Prove(inputs []byte, provingKey []byte, wasm []byte) (*types.ZKProof, error)   // Returns proof or error
// 	Alg() string                                                                   // Returns the alg identifier for this method (example: 'AUTH-GROTH-16')
// 	CircuitID() string
// }

var requestMap = make(map[string]interface{})
var sessionID = 0

// // ProofInputsPreparerHandlerFunc prepares inputs using hash message and circuit id
// type ProofInputsPreparerHandlerFunc func(hash []byte, circuitID circuits.CircuitID) ([]byte, error)

// // Prepare function is responsible to call provided handler for inputs preparation
// func (f ProofInputsPreparerHandlerFunc) Prepare(hash []byte, circuitID circuits.CircuitID) ([]byte, error) {
// 	return f(hash, circuitID)
// }

func (v *verifier) GetAuthRequest(ctx context.Context, schemaType string, schemaURL string, credSubject map[string]interface{}) (protocol.AuthorizationRequestMessage, error) {
	// Audience is verifier id
	rURL := "localhost:3002"
	sessionID++
	CallbackURL := "/api/callback"
	Audience := "did:polygonid:polygon:mumbai:2qDyy1kEo2AYcP3RT4XGea7BtxsY285szg6yP9SPrs"

	uri := fmt.Sprintf("%s%s?sessionId=%s", rURL, CallbackURL, strconv.Itoa(sessionID))

	// Generate request for basic authentication
	var request protocol.AuthorizationRequestMessage = auth.CreateAuthorizationRequest("test flow", Audience, uri)

	request.ID = uuid.New().String()
	request.ThreadID = request.ID
	// Add request for a specific proof
	var mtpProofRequest protocol.ZeroKnowledgeProofRequest
	mtpProofRequest.ID = 1
	mtpProofRequest.CircuitID = string(circuits.AtomicQuerySigV2CircuitID)
	mtpProofRequest.Query = map[string]interface{}{
		"allowedIssuers":    []string{"*"},
		"credentialSubject": credSubject,
		"context":           schemaURL,
		"type":              schemaType,
	}
	request.Body.Scope = append(request.Body.Scope, mtpProofRequest)

	// Store auth request in map associated with session ID
	requestMap[strconv.Itoa(sessionID)] = request

	// print request
	fmt.Println("Request", request)

	proof, err := v.GenerateZKProof(request)
	if err != nil {
		log.Println(err.Error())
		return request, err
	}
	fmt.Println("proof", proof)

	return request, nil
}

// GenerateZKProof generates a ZK proof using iden3 and jwz for AuthorizationRequestMessage
func (v *verifier) GenerateZKProof(payload protocol.AuthorizationRequestMessage) (*string, error) {
	// var prover zk.ProvingMethod

	body := payload.Body.Scope[0].Query["credentialSubject"].(map[string]interface{})["id"].(string)
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["body"] = body
	// Set other claims if needed
	// claims["aud"] = "audience"
	// claims["exp"] = time.Now().Add(time.Hour).Unix()

	// Sign the token with a secret key
	tokenString, err := token.SignedString([]byte(payload.To))
	if err != nil {
		return nil, err
	}
	// Use the tokenString as needed
	log.Println("JWT Token:", tokenString)

	
	res,err := v.VerifyJWZ(tokenString, body, payload.To)
	if err != nil {
		return nil, err
	}
	log.Println("result of verifyJWZ", res)
	// Rest of the code...
	return &tokenString, nil

	// Hash the credential subject ID
	// hash, err := zk.Hash([]byte(payload.Body.Scope[0].Query["credentialSubject"].(map[string]interface{})["id"].(string)))
	// if err != nil {
	// 	log.Println(err.Error())
	// 	return nil, err
	// }
	// log.Println("hash.===============", hash)


	// // Get the circuit ID
	// id := payload.Body.Scope[0].CircuitID
	// log.Println("id.===============", id)

	// var proofInput zk.ProofInputsPreparerHandlerFunc

	// // Prepare the inputs for the ZK proof
	// input,err := proofInput.Prepare(hash.Bytes(), cir.CircuitID(id))

	// token,err := zk.NewWithPayload(zk.ProvingMethodGroth16AuthInstance, hash.Bytes(),proofInput)
	// if err != nil {
	// 	log.Println(err.Error())
	// 	return nil, err
	// }
	// log.Println("token.===============", token)

	// // Generate the ZK proo
	// provingKey := []byte(payload.Body.Scope[0].Query["provingKey"].(string))

	// wasm, _ := os.ReadFile("./circuit.wasm")

	// proof,err := zk.ProvingMethodGroth16AuthV2Instance.Prove(input,provingKey,wasm)
	// if err != nil {
	// 	log.Println(err.Error())
	// 	return nil, err
	// }
	// // Print the generated proof
	// fmt.Println("Proof:", proof)

	// return proof, nil
}

// // VerifyZKProof verifies the ZK proof using the provided verification key
// func VerifyZKProof(proof *types.ZKProof, verificationKey []byte) error {
// 	var prover zk.ProvingMethod // Create an instance of the proving method

// 	// Verify the proof using the verification key
// 	err := prover.Verify(, proof, verificationKey)
// 	if err != nil {
// 		return err
// 	}

// 	return nil
// }



// // VerifyZKProof verifies the ZK proof using the provided verification key
func (v *verifier) VerifyJWZ(jwzToken string,proof string,id string) (bool,error){
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["body"] = proof
	// Set other claims if needed
	// claims["aud"] = "audience"
	// claims["exp"] = time.Now().Add(time.Hour).Unix()

	// Sign the token with a secret key
	provingKey, err := token.SignedString([]byte(id))
	if err != nil {
		return false, err
	}

	if provingKey == jwzToken {
		return true, nil
	}else{
		return false, nil
	}

}
// // Callback works with sign-in callbacks
func (v *verifier) Callback(ctx context.Context, sessionId string, tokenBytes []byte) (messageBytes []byte, err error) {

	// Get session ID from request
	// sessionID := r.URL.Query().Get("sessionId")

	// // get JWZ token params from the post request
	// tokenBytes, _ := io.ReadAll(r.Body)

	// Add Polygon Mumbai RPC node endpoint - needed to read on-chain state
	ethURL := "https://polygon-mumbai.g.alchemy.com/v2/YSO_NsiNTjiA-6thPC2RXS9NoBbjjDKC"

	// Add identity state contract address
	contractAddress := "0x134B1BE34911E39A8397ec6289782989729807a4"

	resolverPrefix := "polygon:mumbai"

	// Locate the directory that contains circuit's verification keys
	keyDIR := "../keys"

	// fetch authRequest from sessionID
	authRequest := requestMap[sessionId]

	// print authRequest
	fmt.Println(authRequest)

	// load the verification key
	var verificationKeyloader = &loaders.FSKeyLoader{Dir: keyDIR}
	resolver := state.ETHResolver{
		RPCUrl:          ethURL,
		ContractAddress: common.HexToAddress(contractAddress),
	}

	resolvers := map[string]pubsignals.StateResolver{
		resolverPrefix: resolver,
	}

	// EXECUTE VERIFICATION
	verifier, err := auth.NewVerifier(verificationKeyloader, resolvers, auth.WithIPFSGateway("https://ipfs.io"))
	if err != nil {
		log.Println(err.Error())
		// http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	authResponse, err := verifier.FullVerify(
		ctx,
		string(tokenBytes),
		authRequest.(protocol.AuthorizationRequestMessage),
		pubsignals.WithAcceptedStateTransitionDelay(time.Minute*5))
	if err != nil {
		log.Println(err.Error())
		// http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil, err
	}
	userID := authResponse.From
	messageBytes = []byte("User with ID " + userID + " Successfully authenticated")

	return messageBytes, nil
}

func MockPrepareAuthV2Inputs(_ []byte, _ circuits.CircuitID) ([]byte, error) {
	// hash is already signed
	return []byte(`{"genesisID":"19229084873704550357232887142774605442297337229176579229011342091594174977","profileNonce":"0","authClaim":["301485908906857522017021291028488077057","0","4720763745722683616702324599137259461509439547324750011830105416383780791263","4844030361230692908091131578688419341633213823133966379083981236400104720538","16547485850637761685","0","0","0"],"authClaimIncMtp":["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"authClaimNonRevMtp":["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"authClaimNonRevMtpAuxHi":"0","authClaimNonRevMtpAuxHv":"0","authClaimNonRevMtpNoAux":"1","challenge":"6110517768249559238193477435454792024732173865488900270849624328650765691494","challengeSignatureR8x":"10923900855019966925146890192107445603460581432515833977084358496785417078889","challengeSignatureR8y":"16158862443157007045624936621448425746188316255879806600364391221203989186031","challengeSignatureS":"51416591880507739389339515804072924841765472826035808894700970942045022090","claimsTreeRoot":"5156125448952672817978035354327403409438120028299513459509442000229340486813","revTreeRoot":"0","rootsTreeRoot":"0","state":"13749793311041076104545663747883540987785640262360452307923674522221753800226","gistRoot":"1243904711429961858774220647610724273798918457991486031567244100767259239747","gistMtp":["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"gistMtpAuxHi":"1","gistMtpAuxHv":"1","gistMtpNoAux":"0"}`), nil
}

// func (v *verifier) GenerateZKProof(payload protocol.AuthorizationRequestMessage){

// 	var prover zk.ProvingMethod
// 	hash,err := zk.Hash([]byte(payload.Body.Scope[0].Query["credentialSubject"].(map[string]interface{})["id"].(string)))
// 	if err != nil {
// 		log.Println(err.Error())
// 		return
// 	}
// 	id := payload.Body.Scope[0].CircuitID;
// 	// input := zk.ProofInputsPreparerHandlerFunc(hash, circuits.CircuitID(id))
// 	token, err := zk.NewWithPayload(prover, hash, circuits.CircuitID(id))
// 	if err != nil {
// 		log.Println(err.Error())
// 		return
// 	}
// 	fmt.Println("token", token)

// 	// // all headers must be protected
// 	// headers, err := json.Marshal(token.raw.Header)
// 	// if err != nil {
// 	// 	return "", err
// 	// }
// 	// token.raw.Protected = headers

// 	// msgHash, err := token.GetMessageHash()
// 	// if err != nil {
// 	// 	return "", err
// 	// }

// 	// inputs, err := token.inputsPreparer.Prepare(msgHash, circuits.CircuitID(token.CircuitID))
// 	// if err != nil {
// 	// 	return "", err
// 	// }

// 	// proof, err := token.Method.Prove(inputs, provingKey, wasm)
// 	// if err != nil {
// 	// 	return "", err
// 	// }
// 	// marshaledProof, err := json.Marshal(proof)
// 	// if err != nil {
// 	// 	return "", err
// 	// }
// 	// token.ZkProof = proof
// 	// token.raw.ZKP = marshaledProof

// 	// return token.CompactSerialize()
// 	}

// // Prove creates and returns a complete, proved JWZ.
// // The token is proven using the Proving Method specified in the token.
// func (v *verifier) Prove(provingKey, wasm []byte,token Token) (string, error) {

// 	// all headers must be protected
// 	headers, err := json.Marshal(token.raw.Header)
// 	if err != nil {
// 		return "", err
// 	}
// 	token.raw.Protected = headers

// 	msgHash, err := token.GetMessageHash()
// 	if err != nil {
// 		return "", err
// 	}

// 	inputs, err := token.inputsPreparer.Prepare(msgHash, circuits.CircuitID(token.CircuitID))
// 	if err != nil {
// 		return "", err
// 	}

// 	proof, err := token.Method.Prove(inputs, provingKey, wasm)
// 	if err != nil {
// 		return "", err
// 	}
// 	marshaledProof, err := json.Marshal(proof)
// 	if err != nil {
// 		return "", err
// 	}
// 	token.ZkProof = proof
// 	token.raw.ZKP = marshaledProof

// 	return token.CompactSerialize()
// }

// // GetMessageHash returns bytes of jwz message hash.
// func (token *Token) GetMessageHash() ([]byte, error) {

// 	headers, err := json.Marshal(token.raw.Header)
// 	if err != nil {
// 		return nil, err
// 	}
// 	protectedHeaders := base64.RawURLEncoding.EncodeToString(headers)
// 	payload := base64.RawURLEncoding.EncodeToString(token.raw.Payload)

// 	// JWZ ZkProof input value is ASCII(BASE64URL(UTF8(JWS Protected Header)) || '.' || BASE64URL(JWS Payload)).
// 	messageToProof := []byte(fmt.Sprintf("%s.%s", protectedHeaders, payload))
// 	hash, err := Hash(messageToProof)

// 	if err != nil {
// 		return nil, err
// 	}
// 	return hash.Bytes(), nil
// }

// func (token *Token) CompactSerialize() (string, error) {

// 	if token.raw.Header == nil || token.raw.Protected == nil || token.ZkProof == nil {
// 		return "", errors.New("iden3/jwz:can't serialize without one of components")
// 	}
// 	serializedProtected := base64.RawURLEncoding.EncodeToString(token.raw.Protected)
// 	proofBytes, err := json.Marshal(token.ZkProof)
// 	if err != nil {
// 		return "", err
// 	}
// 	serializedProof := base64.RawURLEncoding.EncodeToString(proofBytes)
// 	serializedPayload := base64.RawURLEncoding.EncodeToString(token.raw.Payload)

// 	return fmt.Sprintf("%s.%s.%s", serializedProtected, serializedPayload, serializedProof), nil
// }

// // Hash returns poseidon hash of big.Int
// // that was created from sha256 hash of the message bytes
// // if such big.Int is not in the Field, DivMod result is returned.
// func Hash(message []byte) (*big.Int, error) {

// 	// 1. sha256 hash
// 	h := sha256.New()
// 	_, err := h.Write(message)
// 	if err != nil {
// 		return nil, err
// 	}
// 	b := h.Sum(nil)

// 	// 2. swap hash before hashing

// 	bs := utils.SwapEndianness(b)
// 	bi := new(big.Int).SetBytes(bs)

// 	// 3. check if it's in field
// 	var m *big.Int
// 	if utils.CheckBigIntInField(bi) {
// 		m = bi
// 	} else {
// 		m = bi.Mod(bi, constants.Q)
// 	}

// 	// 2. poseidon
// 	res, err := poseidon.Hash([]*big.Int{m})

// 	if err != nil {
// 		return nil, err
// 	}
// 	return res, err

func (v *verifier) VerifierRegister(ctx context.Context, conn db.Querier, orgusername string, orgPassword string, orgID string, orgName string, orgEmail string) (string, error) {

	_, err := conn.Exec(ctx, "INSERT INTO verifiers (username, userpassword, id, orgname, user_gmail) VALUES ($1, $2, $3, $4, $5) RETURNING id", orgusername, orgPassword, orgID, orgName, orgEmail)
	if err != nil {
		log.Println(err.Error())
		return "Registration Failed", err
	}
	return "Registration Successful", nil
}

func (v *verifier) VerifierLogin(ctx context.Context, conn db.Querier, orgusername string, orgPassword string) (*domain.VerifierDetails, error) {

	res := VerifierDetails{}

	err := conn.QueryRow(ctx, "SELECT id,orgname,username,user_gmail FROM verifiers WHERE username=$1 AND userpassword=$2", orgusername, orgPassword).Scan(&res.VerifierID, &res.OrgName, &res.UserName, &res.OrgGmail)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	log.Println("res", res)
	return &domain.VerifierDetails{
		VerifierID: res.VerifierID,
		UserName:   res.UserName,
		OrgName:    res.OrgName,
		OrgGmail:   res.OrgGmail,
	}, nil
	// fmt.Println("orgUser", orgUser)
}

func (v *verifier) VerifierDetails(ctx context.Context, conn db.Querier, id string) (*domain.VerifierDetails, error) {

	res := VerifierDetails{}
	err := conn.QueryRow(ctx, "SELECT id,orgname,username,user_gmail FROM verifiers WHERE id=$1", id).Scan(&res.VerifierID, &res.OrgName, &res.UserName, &res.OrgGmail)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	log.Println("res", res)
	return &domain.VerifierDetails{
		VerifierID: res.VerifierID,
		UserName:   res.UserName,
		OrgName:    res.OrgName,
		OrgGmail:   res.OrgGmail,
	}, nil
	// fmt.Println("orgUser", orgUser)
}

// id             text              NOT NULL,
// orgname        text              NULL,
// username        text             NULL,
// userpassword     text             NULL,
// user_gmail       text             NULL,

func (v *verifier) Login(ctx context.Context, username string, password string) (*domain.SinzyLoginResponse, error) {
	url := "https://preproduction.signzy.tech/api/v2/patrons/login"
	payload, err := json.Marshal(map[string]string{
		"username": username,
		"password": password,
	})
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	defer res.Body.Close()
	fmt.Println("res", res)
	var loginResponse domain.SinzyLoginResponse
	if err := json.NewDecoder(res.Body).Decode(&loginResponse); err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	fmt.Println("loginResponse", loginResponse)
	return &loginResponse, nil
}

func (v *verifier) Logout(ctx context.Context, accessToken string) {

	url := "https://signzy.tech/api/v2/patrons/logout?access_token=" + accessToken

	req, _ := http.NewRequest("POST", url, nil)

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}

func (v *verifier) VerifyAccount(ctx context.Context, patronid string, parameterType string, parameterValue string) {

	// url := "https://signzy.tech/api/v2/patrons/....patronid.../digilockers"
	// payload := strings.NewReader("{\"task\":\"verifyAccount\", \"essentials\": {\"mobileNumber\": \"...mobileNumber...\"}}"
	url := "https://signzy.tech/api/v2/patrons/${patronid}/digilockers"

	payload := strings.NewReader(`{"task":"verifyAccount", "essentials": {${parameterType}: "${parameterValue}"}}`)

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", "<Access-Token>")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}

func (v *verifier) GetDigilockerURL(ctx context.Context, patronid string, accessToken string) (*domain.DigilockerURLResponse, error) {
	url := fmt.Sprintf("https://preproduction.signzy.tech/api/v2/patrons/%s/digilockers", patronid)

	fmt.Println("url", url)
	fmt.Println("accessToken", accessToken)
	fmt.Println("patronid", patronid)
	payload, err := json.Marshal(map[string]interface{}{
		"task":       "url",
		"essentials": map[string]string{},
	})
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	fmt.Println("payload", payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	defer res.Body.Close()
	fmt.Println("resFor URL", res)
	fmt.Println("GetURLBody", res.Body)
	var response domain.DigilockerURLResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	fmt.Println("response", response)
	return &response, nil
}

func (v *verifier) PullDocuments(ctx context.Context, patronid string, requestId string, accessToken string) (*domain.DigilockerDocumentList, error) {
	url := fmt.Sprintf("https://preproduction.signzy.tech/api/v2/patrons/%s/digilockers", patronid)
	payload := map[string]interface{}{
		"task": "url",
		"essentials": map[string]string{
			"requestId": requestId,
		},
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", accessToken)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}

	res, err := client.Do(req)
	if err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	var response domain.DigilockerDocumentList

	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		fmt.Println("err", err)
		return nil, err
	}
	defer res.Body.Close()
	// body, _ := ioutil.ReadAll(res.Body)
	fmt.Println("resForAcess", res.Body)
	fmt.Println("response", response)
	return &response, nil
}

func (v *verifier) GetDigilockerEAdharData(ctx context.Context, patronid string) {
	url := "https://signzy.tech/api/v2/patrons/${patronid}/digilockers"

	payload := strings.NewReader("{\"task\":\"getEadhaar\", essentials: {\"requestId\": \"...requestId...\"}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", "<Access-Token>")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}

func (v *verifier) GetRequestID(ctx context.Context, patronid string) {
	url := "https://signzy.tech/api/v2/patrons/${patronid}/digilockers"
	payload := strings.NewReader("{\"task\":\"url\",\"essentials\":{\"redirectUrl\":\"\",\"redirectTime\":\"\",\"callbackUrl\":\"\"}}")
	req, _ := http.NewRequest("POST", url, payload)
	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", "<Access-Token>")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	fmt.Println(res)
	fmt.Println(string(body))
}

func (v *verifier) GetListOfDocuments(ctx context.Context, patronid string, accessToken string, Adhar bool, PAN bool) {
	url := fmt.Sprintf("https://preproduction.signzy.tech/api/v2/patrons/%s/digilockers", patronid)

	payload := strings.NewReader("{\"task\":\"listofdocuments\", essentials: {}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", accessToken)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}

func (V *verifier) GetPANDoc(ctx context.Context, patronid string) {
	url := `https://signzy.tech/api/v2/patrons/${patronid}/digilockers`

	payload := strings.NewReader("{\"task\":\"pullDocuments\", \"essentials\": {\"requestId\": \"...requestId...\",\"docType\": \"...docType...\", \"name\" : \"...name...\", \"panNumber\" : \"...panNumber...\"}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", "<Access-Token>")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}

func (v *verifier) GetDetails(ctx context.Context, partonId string, requestId string, accessToken string) {
	url := fmt.Sprintf("https://preproduction.signzy.tech/api/v2/patrons/%s/digilockers", partonId)

	payload := fmt.Sprintf("{\"task\":\"getDetails\", essentials: {\"requestId\": \"%s\"}}", requestId)

	req, _ := http.NewRequest("POST", url, strings.NewReader(payload))

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("error", err)
	}
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}

func (v *verifier) GetIdentity(ctx context.Context, patronid string, _type string, accessToken string) (*domain.VerificationIdentity, error) {
	url := "https://preproduction.signzy.tech/api/v2/patrons/64c8ce58d41cd00022d8dfa3/identities"

	identityReq := IdentityRequest{
		Type:        _type,
		CallbackURL: "https://www.w3schools.com",
		Email:       "ankur.rand@signzy.com",
		Images:      []string{},
	}

	payloadBytes, err := json.Marshal(identityReq)
	if err != nil {
		log.Println(err.Error())
		// return nil, err
	}
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", accessToken)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		// return nil, err
	}

	defer res.Body.Close()

	fmt.Println(res)
	var identityResponse domain.VerificationIdentity

	if err := json.NewDecoder(res.Body).Decode(&identityResponse); err != nil {
		fmt.Println("err", err)
		// return nil, err
	}

	fmt.Println("identityResponse", identityResponse)
	return &identityResponse, nil
}

func (v *verifier) VerifyAdhar(ctx context.Context, itemId string, accessToken string, Authorization string, uid string) (*domain.VerifyAadhaarResponse, error) {

	url := "https://preproduction.signzy.tech/api/v2/snoops"

	payloadStr := fmt.Sprintf("{\"service\":\"Identity\",\"itemId\":\"%s\",\"accessToken\":\"%s\",\"task\":\"verifyAadhaar\",\"essentials\":{\"uid\":\"%s\"}}", itemId, accessToken, uid)
	req, _ := http.NewRequest("POST", url, strings.NewReader(payloadStr))

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Authorization", Authorization)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	fmt.Println("Body", string(body))
	var response domain.VerifyAadhaarResponse
	err = json.Unmarshal(body, &response)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	if response.Response.Result.Verified != "true" {
		return nil, fmt.Errorf("Adhar not verified")
	} else {
		fmt.Println("Status", "===========Verified==========")
		return &response, nil
	}
}

func (v *verifier) VerifyPAN(ctx context.Context, itemId string, accessToken string, Authorization string, panNumber string, Name string, fuzzy bool, panStatus bool) (*domain.VerifyPANResponse, error) {

	url := "https://preproduction.signzy.tech/api/v2/snoops"
	payloadStr := fmt.Sprintf("{\"service\":\"Identity\",\"itemId\":\"%s\",\"accessToken\":\"%s\",\"task\":\"verification\",\"essentials\":{\"number\":\"%s\",\"name\":\"%s\",\"fuzzy\":\"false\",\"panStatus\":\"true\"}}", itemId, accessToken, panNumber, Name)

	req, _ := http.NewRequest("POST", url, strings.NewReader(payloadStr))

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Add("Authorization", Authorization)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	defer res.Body.Close()

	var response verifyresponse
	err = json.NewDecoder(res.Body).Decode(&response)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	fmt.Println("response", response)
	if !response.Response.Result.Verified {
		return nil, fmt.Errorf("PAN not verified")
	} else {
		return &domain.VerifyPANResponse{
			Verified:      response.Response.Result.Verified,
			Message:       response.Response.Result.Message,
			UpstreamName:  response.Response.Result.UpstreamName,
			PanStatus:     response.Response.Result.PanStatus,
			PanStatusCode: response.Response.Result.PanStatusCode,
		}, nil
	}
}

func (v *verifier) VerifyGSTIN(ctx context.Context, partonId string, Authorization string, gstin string) (*domain.VerifyGSTINResponseNew, error) {

	url := fmt.Sprintf("https://preproduction.signzy.tech/api/v2/patrons/%s/gstns", partonId)
	payloadStr := fmt.Sprintf("{\"task\":\"gstnSearch\",\"essentials\":{\"gstin\":\"%s\"}}", gstin)
	req, _ := http.NewRequest("POST", url, strings.NewReader(payloadStr))

	req.Header.Add("Accept-Language", "en-US,en;q=0.8")
	req.Header.Add("Accept", "*/*")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Add("Authorization", Authorization)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}
	fmt.Println("Body", string(body))
	var response domain.VerifyGSTINResponseNew
	err = json.Unmarshal(body, &response)
	if err != nil {
		log.Println(err.Error())
		return nil, err
	}

	fmt.Println("response", response)
	if response.Result.GSTNDetailed.GSTINStatus != "ACTIVE" {
		return nil, fmt.Errorf("GSTIN not Active")
	} else {
		return &response, nil
	}
}
