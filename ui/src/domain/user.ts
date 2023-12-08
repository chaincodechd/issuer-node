{
  /* eslint-disable */
}
export type UserDetails = {
  address: string;
  adhar: string;
  adharStatus: boolean;
  createdAt: Date;
  dob: string;
  documentationSource: string;
  gmail: string;
  gstin: string;
  gstinStatus: boolean;
  id: string;
  iscompleted: boolean;
  name: string;
  PAN: string;
  PANStatus: boolean;
  owner: string;
  phoneNumber: string;
  username: string;
  userType: string;
};
{
  /* eslint-disable */
}
export type userProfile = {
  Address: string;
  Adhar: string;
  DOB: Date;
  DocumentationSource: string;
  Gmail: string;
  Gstin: string;
  ID: string;
  Name: string;
  Owner: string;
  PAN: string;
  PhoneNumber: string;
};
export type FormValue = {
  Aadhar: string;
  Age: string;
  PAN: string;
  address: string;
  dob: string;
  gst: string;
  mobile: string;
  owner: string;
  request: string;
};
export type FormData = {
  adhaarID: string;
  age: string;
  schemaID: string;
};

export type Login = {
  fullName: string;
  gmail: string;
  iscompleted: boolean;
  password: string;
  userDID: string;
  userType: string;
  username: string;
};

export type UserResponse = {
  msg: string;
  status: boolean;
};

export type DigiLockerLoginResponse = {
  created: string;
  id: string;
  ttl: number;
  userId: string;
};

export type DigiLockerCreateUrlResponse = {
  id: string;
  patronId: string;
  result: {
    requestId: string;
    url: string;
  };
  task: string;
};

export type DigiLockerDetailsResponse = {
  digilockerid: string;
  dob: string;
  eaadhaar: string;
  files: Array<string>;
  gender: string;
  name: string;
  nameAsAdhar: string;
};

export type SignupResponse = {
  msg: string;
  status: boolean;
};

export type UserDIDResponse = {
  identifier: string;
};
