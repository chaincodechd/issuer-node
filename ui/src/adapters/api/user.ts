import axios from "axios";
import { z } from "zod";
import { Response, buildErrorResponse, buildSuccessResponse } from "..";
import { datetimeParser, getStrictParser } from "../parsers";
import { buildAuthorizationHeader } from ".";
import { Env } from "src/domain";
import {
  DigiLockerCreateUrlResponse,
  DigiLockerLoginResponse,
  Login,
  UserDetails,
  UserResponse,
  userProfile,
} from "src/domain/user";
import { API_VERSION } from "src/utils/constants";
import { List } from "src/utils/types";

export const userParser = getStrictParser<UserDetails, UserDetails>()(
  z.object({
    address: z.string(),
    adhar: z.string(),
    createdAt: datetimeParser,
    dob: z.string(),
    documentationSource: z.string(),
    gmail: z.string(),
    gstin: z.string(),
    id: z.string(),
    iscompleted: z.boolean(),
    name: z.string(),
    owner: z.string(),
    PAN: z.string(),
    phoneNumber: z.string(),
    username: z.string(),
    userType: z.string(),
  })
);

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
    const response = await axios({
      data: { task: "url" },
      headers: {
        Accept: "application/json",
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
}): Promise<Response<DigiLockerCreateUrlResponse>> {
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

    return buildSuccessResponse(digiLockerUrlResponse.parse(response.data));
  } catch (error) {
    return buildErrorResponse(error);
  }
}
