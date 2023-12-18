export type LoginLabel = {
  password: string;
  username: string;
};

export type Signup = {
  email: string;
  firstName: string;
  password: string;
  role: string;
  userDID: string;
  userType: string;
  username: string;
};

export type VerifierSignup = {
  OrgEmail: string;
  OrgPassword: string;
  OrgUsername: string;
  OrganizationName: string;
};
