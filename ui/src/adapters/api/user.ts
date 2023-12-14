import axios from "axios";
import { z } from "zod";
import { Response, buildErrorResponse, buildSuccessResponse } from "..";
import { datetimeParser, getStrictParser } from "../parsers";
import { buildAuthorizationHeader } from ".";
import { Env } from "src/domain";
import {
  DigiLockerCreateUrlResponse,
  DigiLockerDetailsResponse,
  DigiLockerLoginResponse,
  Login,
  SignupResponse,
  UserDIDResponse,
  UserDetails,
  UserResponse,
  VerifierLoginResponse,
  VerifierSignupResponse,
  userProfile,
} from "src/domain/user";
import { API_VERSION } from "src/utils/constants";
import { List } from "src/utils/types";

export const userParser = getStrictParser<UserDetails, UserDetails>()(
  z.object({
    address: z.string(),
    adhar: z.string(),
    adharStatus: z.boolean(),
    createdAt: datetimeParser,
    dob: z.string(),
    documentationSource: z.string(),
    gmail: z.string(),
    gstin: z.string(),
    gstinStatus: z.boolean(),
    id: z.string(),
    iscompleted: z.boolean(),
    name: z.string(),
    owner: z.string(),
    PAN: z.string(),
    PANStatus: z.boolean(),
    phoneNumber: z.string(),
    username: z.string(),
    userType: z.string(),
  })
);

export type CreateUser = {
  Email: string;
  Password: string;
  Role: string;
  UserDID: string;
  UserName: string;
  firstName: string;
};
export const digiLockerRsponse = getStrictParser<
  DigiLockerLoginResponse,
  DigiLockerLoginResponse
>()(
  z.object({
    created: z.string(),
    id: z.string(),
    ttl: z.number(),
    userId: z.string(),
  })
);

export const digiLockerUrlResponse = getStrictParser<
  DigiLockerCreateUrlResponse,
  DigiLockerCreateUrlResponse
>()(
  z.object({
    id: z.string(),
    patronId: z.string(),
    result: z.object({
      requestId: z.string(),
      url: z.string(),
    }),
    task: z.string(),
  })
);

export const digiLockerDetailsResponse = getStrictParser<
  DigiLockerDetailsResponse,
  DigiLockerDetailsResponse
>()(
  z.object({
    essentials: z.object({
      requestId: z.string(),
    }),
    id: z.string(),
    patronId: z.string(),
    result: z.object({
      files: z.array(
        z.object({
          date: z.string(),
          description: z.string(),
          doctype: z.string(),
          id: z.string(),
          issuer: z.string(),
          issuerid: z.string(),
          mime: z.array(z.string()),
          name: z.string(),
          parent: z.string(),
          size: z.string(),
          type: z.string(),
        })
      ),
      userDetails: z.object({
        digilockerid: z.string(),
        dob: z.string(),
        eaadhaar: z.string(),
        gender: z.string(),
        mobile: z.string(),
        name: z.string(),
      }),
    }),
    task: z.string(),
  })
);

export const signupResponse = getStrictParser<SignupResponse, SignupResponse>()(
  z.object({
    msg: z.string(),
    status: z.boolean(),
  })
);

export const verifierSignupResponse = getStrictParser<
  VerifierSignupResponse,
  VerifierSignupResponse
>()(
  z.object({
    msg: z.string(),
    status: z.boolean(),
    verifierId: z.string(),
  })
);

export const verifierLoginRespopnse = getStrictParser<
  VerifierLoginResponse,
  VerifierLoginResponse
>()(
  z.object({
    id: z.string(),
    msg: z.string(),
    orgEmail: z.string(),
    orgName: z.string(),
    orgUsername: z.string(),
    status: z.boolean(),
  })
);
export const userResponseParser = getStrictParser<UserResponse, UserResponse>()(
  z.object({
    msg: z.string(),
    status: z.boolean(),
  })
);

export const loginParser = getStrictParser<Login, Login>()(
  z.object({
    fullName: z.string(),
    gmail: z.string(),
    iscompleted: z.boolean(),
    password: z.string(),
    userDID: z.string(),
    username: z.string(),
    userType: z.string(),
  })
);

export type GetUserDID = {
  didMetadata: {
    blockchain: string;
    method: string;
    network: string;
  };
};

export type Verifier = {
  OrgEmail: string;
  OrgPassword: string;
  OrgUsername: string;
  OrganizationName: string;
};

export const userDIDResponse = getStrictParser<UserDIDResponse, UserDIDResponse>()(
  z.object({
    identifier: z.string(),
  })
);

export async function getUserDetails({
  env,
  password,
  username,
}: {
  env: Env;
  password: string;
  username: string;
}): Promise<Response<UserDetails>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: { password, username },
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/getUser`,
    });
    console.log(response.data);
    return buildSuccessResponse(userParser.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function login({
  env,
  password,
  username,
}: {
  env: Env;
  password: string;
  username: string;
}): Promise<Response<Login>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: { password, username },
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/login`,
    });

    return buildSuccessResponse(loginParser.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function updateUser({
  env,
  updatePayload,
}: {
  env: Env;
  updatePayload: userProfile;
}): Promise<Response<UserResponse>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: updatePayload,
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/updateUser`,
    });

    return buildSuccessResponse(userResponseParser.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function getUser({
  env,
  signal,
  userDID,
}: {
  env: Env;
  signal?: AbortSignal;
  userDID: string;
}): Promise<Response<List<UserDetails>>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      signal,
      url: `${API_VERSION}/getUser/${userDID}`,
    });

    return buildSuccessResponse(userParser.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function DigiLockerLogin({
  password,
  username,
}: {
  password: string;
  username: string;
}): Promise<Response<DigiLockerLoginResponse>> {
  try {
    const response = await axios({
      // baseURL: env.api.url,
      data: { password, username },
      // headers: {
      //   Authorization: buildAuthorizationHeader(env),
      // },
      method: "POST",
      url: `https://preproduction.signzy.tech/api/v2/patrons/login`,
    });

    return buildSuccessResponse(digiLockerRsponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function getDigiLockerUrl({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<Response<DigiLockerCreateUrlResponse>> {
  try {
    // console.log(id);
    const response = await axios({
      data: { task: "url" },
      headers: {
        // Accept: "application/json",
        Authorization: id,
      },
      method: "POST",
      url: `https://preproduction.signzy.tech/api/v2/patrons/${userId}/digilockers`,
    });
    // console.log(response.data);

    return buildSuccessResponse(digiLockerUrlResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function getDigiLockerDetails({
  id,
  requestId,
  userId,
}: {
  id: string;
  requestId: string;
  userId: string;
}): Promise<Response<DigiLockerDetailsResponse>> {
  try {
    const response = await axios({
      data: { essentials: { requestId: requestId }, task: "getDetails" },
      headers: {
        Authorization: id,
      },
      method: "POST",
      url: `https://preproduction.signzy.tech/api/v2/patrons/${userId}/digilockers`,
    });
    console.log(response.data);

    return buildSuccessResponse(digiLockerDetailsResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function getUserDID({
  payload,
}: {
  payload: GetUserDID;
}): Promise<Response<UserDIDResponse>> {
  try {
    const response = await axios({
      data: payload,
      method: "POST",
      url: `http://localhost:3001/v1/identities`,
    });

    console.log(response.data);

    return buildSuccessResponse(userDIDResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function signUp({
  env,
  payload,
}: {
  env: Env;
  payload: CreateUser;
}): Promise<Response<SignupResponse>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: payload,
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/signup`,
    });

    console.log(response.data);

    return buildSuccessResponse(signupResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// Verrifier Signup
export async function verifierSignup({
  env,
  payload,
}: {
  env: Env;
  payload: Verifier;
}): Promise<Response<VerifierSignupResponse>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: payload,
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/VerifierRegister`,
    });

    console.log(response.data);

    return buildSuccessResponse(verifierSignupResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function verifierLogin({
  env,
  OrgPassword,
  OrgUsername,
}: {
  OrgPassword: string;
  OrgUsername: string;
  env: Env;
}): Promise<Response<VerifierLoginResponse>> {
  try {
    const response = await axios({
      baseURL: env.api.url,
      data: { OrgPassword, OrgUsername },
      headers: {
        Authorization: buildAuthorizationHeader(env),
      },
      method: "POST",
      url: `${API_VERSION}/VerifierLogin`,
    });
    console.log(response.data);

    return buildSuccessResponse(verifierLoginRespopnse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}
