export type VerifierContext = {
  OrgEmail: string;
  OrgPassword: string;
  OrgUsername: string;
  OrganizationName: string;
  setVerifierDetails: (
    OrgEmail: string,
    OrganizationName: string,
    OrgUsername: string,
    OrgPassword: string
  ) => void;
};

export type Verifier = {
  OrgEmail: string;
  OrgPassword: string;
  OrgUsername: string;
  OrganizationName: string;
};
