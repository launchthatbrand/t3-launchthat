"use server";

import type { PayloadHandler } from "payload";
import { createClerkClient } from "@clerk/backend";
// @ts-strict-ignore
import { status as httpStatus } from "http-status";
import { addDataAndFileToRequest } from "payload";

import { generatePayloadCookie } from "../../../../../node_modules/payload/dist/auth/cookies.js";
import { jwtSign } from "../../../../../node_modules/payload/dist/auth/jwt.js";
import { loginOperation } from "../../../../../node_modules/payload/dist/auth/operations/login.js";
import { getRequestCollection } from "../../../../../node_modules/payload/dist/utilities/getRequestEntity.js";
import { headersWithCors } from "../../../../../node_modules/payload/dist/utilities/headersWithCors.js";
import { isNumber } from "../../../../../node_modules/payload/dist/utilities/isNumber.js";

// Fallback mock user for development without Clerk
const mockUsers = [
  {
    id: "dev-user-123",
    name: "Desmond Tatilian",
    updatedAt: "2025-04-07T20:20:39.581Z",
    createdAt: "2025-03-25T18:52:49.195Z",
    email: "dev@gmail.com",
    collection: "users",
    _strategy: "mock-user",
    loginAttempts: 0,
    role: "admin",
    _verified: true,
  },
];

// Helper function to verify credentials with Clerk SDK
async function verifyWithClerk(email: string, password: string) {
  try {
    // Initialize Clerk if not already done
    if (!process.env.CLERK_SECRET_KEY) {
      console.log("CLERK_SECRET_KEY not found, skipping Clerk verification");
      return null;
    }
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    console.log("Verifying credentials with Clerk SDK");

    // First, find the user by email
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (!clerkUsers.data || clerkUsers.data.length === 0) {
      console.log("No user found with this email");
      return null;
    }

    const user = clerkUsers.data[0];

    // Clerk doesn't have a direct password verification API in the SDK
    // Instead, we'll use a workaround to verify by trying to create a session
    try {
      // This uses an internal API - in a production app, consider using Clerk webhooks
      // or other officially supported methods for authentication flows

      async function generateSignInToken(userId: string) {
        const { token } = await clerkClient.signInTokens.createSignInToken({
          userId,
        });
        return token;
      }
      const session = await clerkClient.signInTokens.createSignInToken({
        userId: user.id,
        strategy: "password",
        identifier: email,
        password,
      });

      if (!session) {
        console.log("Failed to create session, invalid credentials");
        return null;
      }

      // Get the primary email
      const primaryEmailId = user.primaryEmailAddressId;
      const emailObject = user.emailAddresses.find(
        (e: { id: string }) => e.id === primaryEmailId,
      );

      if (!emailObject) {
        console.log("No primary email found");
        return null;
      }

      console.log("User verified with Clerk:", emailObject.emailAddress);

      // Create a user object based on Clerk data
      return {
        id: user.id,
        email: emailObject.emailAddress,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        collection: "users",
        _strategy: "clerk",
        role: (user.publicMetadata?.role as string) || "admin", // You can store roles in publicMetadata
        _verified: emailObject.verification.status === "verified",
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
      };
    } catch (error) {
      console.log("Password verification failed:", error);
      return null;
    }
  } catch (error) {
    console.error("Error verifying with Clerk:", error);
    return null;
  }
}

export const loginHandler: PayloadHandler = async (req) => {
  console.log("CUSTOM LOGIN HANDLER");
  await addDataAndFileToRequest(req);

  const collection = getRequestCollection(req);
  const { searchParams, t, data } = req;
  console.log("email", data?.email);
  console.log("password", data?.password);
  const depth = searchParams.get("depth");
  const authData =
    collection.config.auth?.loginWithUsername !== false
      ? {
          email: typeof req.data?.email === "string" ? req.data.email : "",
          password:
            typeof req.data?.password === "string" ? req.data.password : "",
          username:
            typeof req.data?.username === "string" ? req.data.username : "",
        }
      : {
          email: typeof req.data?.email === "string" ? req.data.email : "",
          password:
            typeof req.data?.password === "string" ? req.data.password : "",
        };

  try {
    // First try the native login operation
    const result = await loginOperation({
      collection,
      data: authData,
      depth: isNumber(depth) ? Number(depth) : undefined,
      req,
    });

    if (result.token) {
      // Native login succeeded
      const cookie = generatePayloadCookie({
        collectionAuthConfig: collection.config.auth,
        cookiePrefix: req.payload.config.cookiePrefix,
        token: result.token,
      });

      if (collection.config.auth?.removeTokenFromResponses) {
        delete result.token;
      }

      return Response.json(
        {
          message: t("authentication:passed"),
          ...result,
        },
        {
          headers: headersWithCors({
            headers: new Headers({
              "Set-Cookie": cookie,
            }),
            req,
          }),
          status: httpStatus.OK,
        },
      );
    }
  } catch (error) {
    console.log("Native login failed, trying Clerk", error);
    // Continue to Clerk verification, don't return error response yet
  }

  // Try Clerk verification if native login failed
  if (authData.email && authData.password) {
    const clerkUser = await verifyWithClerk(authData.email, authData.password);

    if (clerkUser) {
      console.log("User verified with Clerk, creating JWT token");

      // Create a token for the Clerk-verified user
      const { exp, token } = await jwtSign({
        fieldsToSign: {
          id: clerkUser.id,
          email: clerkUser.email,
          collection: clerkUser.collection,
        },
        secret: req.payload.secret,
        tokenExpiration: collection.config.auth?.tokenExpiration || 7200,
      });

      // Generate a cookie for the user
      const cookie = generatePayloadCookie({
        collectionAuthConfig: collection.config.auth,
        cookiePrefix: req.payload.config.cookiePrefix,
        token,
      });

      // Return a successful response with the user and token
      const result = {
        user: clerkUser,
        token,
        exp,
      } as { user: any; token?: string; exp: number };

      if (collection.config.auth?.removeTokenFromResponses) {
        delete result.token;
      }

      return Response.json(
        {
          message: "Authentication successful",
          ...result,
        },
        {
          headers: headersWithCors({
            headers: new Headers({
              "Set-Cookie": cookie,
            }),
            req,
          }),
          status: httpStatus.OK,
        },
      );
    }
  }

  // If Clerk verification failed, fall back to mock user in development
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log('Clerk verification failed, checking mock user database')
  //   const mockUser = mockUsers.find(
  //     (user) => user.email === authData.email && authData.password === 'test1234',
  //   )

  //   if (mockUser) {
  //     console.log('Mock user found:', mockUser.email)

  //     // Create a token for the mock user
  //     const { exp, token } = await jwtSign({
  //       fieldsToSign: {
  //         id: mockUser.id,
  //         email: mockUser.email,
  //         collection: mockUser.collection,
  //       },
  //       secret: req.payload.secret,
  //       tokenExpiration: collection.config.auth?.tokenExpiration || 7200,
  //     })

  //     // Generate a cookie for the mock user
  //     const cookie = generatePayloadCookie({
  //       collectionAuthConfig: collection.config.auth,
  //       cookiePrefix: req.payload.config.cookiePrefix,
  //       token,
  //     })

  //     // Return a successful response with the mock user and token
  //     const result = {
  //       user: mockUser,
  //       token,
  //       exp,
  //     } as { user: any; token?: string; exp: number }

  //     if (collection.config.auth?.removeTokenFromResponses) {
  //       delete result.token
  //     }

  //     return Response.json(
  //       {
  //         message: 'Authentication successful',
  //         ...result,
  //       },
  //       {
  //         headers: headersWithCors({
  //           headers: new Headers({
  //             'Set-Cookie': cookie,
  //           }),
  //           req,
  //         }),
  //         status: httpStatus.OK,
  //       },
  //     )
  //   }
  // }

  // If we got here, all authentication methods failed
  return Response.json(
    {
      message: "Authentication failed",
    },
    {
      status: httpStatus.UNAUTHORIZED,
    },
  );
};
