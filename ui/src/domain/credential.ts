export type CredentialsTabIDs = "issued" | "links";

export type ProofType = "MTP" | "SIG";

export type Credential = {
  createdAt: Date;
  credentialSubject: Record<string, unknown>;
  expired: boolean;
  expiresAt: Date | null;
  id: string;
  issuedBy: string;
  proofTypes: ProofType[];
  revNonce: number;
  revokeDate: Date;
  revoked: boolean;
  schemaHash: string;
  schemaType: string;
  schemaUrl: string;
  userDID: string;
  userID: string;
};

export type IssuedQRCode = {
  qrCode: unknown;
  schemaType: string;
};

export type LinkStatus = "active" | "inactive" | "exceeded";

export type Link = {
  active: boolean;
  createdAt: Date;
  credentialExpiration: Date | null;
  credentialSubject: Record<string, unknown>;
  expiration: Date | null;
  id: string;
  issuedClaims: number;
  maxIssuance: number | null;
  proofTypes: ProofType[];
  schemaHash: string;
  schemaType: string;
  schemaUrl: string;
  status: LinkStatus;
};
export type CreateAuthRequestResponse = {
  body: {
    callbackUrl: string;
    reason: string;
    scope: {
      circuitId: string;
      id: number;
      query: {
        allowedIssuers: string[];
        context: string;
        credentialSubject: {
          "Adhar-number": number;
          Age: number;
          id: string;
          type: string;
        };
        type: string;
      };
    }[];
  };
  from: string;
  id: string;
  thid: string;
  typ: string;
  type: string;
};
