import { client } from "../clients/client";
import { ethers } from "ethers";
import { evmAddress } from "@lens-protocol/client";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";
import {
  AuthOptions,
  ChallengeOptions,
  LensAppAddresses,
  LensAuthRole,
} from "@/utils/types";
import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

/**
 * Helper function to create a message signing function
 * @param signer - Ethers signer to sign messages with
 * @returns A function that signs messages with the provided signer
 */
function signMessageWith(signer: ethers.Signer) {
  return async (message: string) => {
    return await signer.signMessage(message);
  };
}

/**
 * Generates an authentication challenge based on the role and provided addresses
 * @param walletAddress - EVM wallet address to generate challenge for
 * @param options - Challenge generation options (role, addresses, network)
 * @returns Challenge object with id and text to be signed
 */
export async function generateChallenge(
  walletAddress: string,
  options: ChallengeOptions
) {
  try {
    const appAddress =
      options.appAddress ||
      (options.useTestnet
        ? LensAppAddresses.TESTNET
        : LensAppAddresses.MAINNET);

    let challengeRequest;

    switch (options.role) {
      case LensAuthRole.BUILDER:
        challengeRequest = { builder: { address: walletAddress } };
        break;
      case LensAuthRole.ONBOARDING_USER:
        if (!appAddress) {
          throw new Error("App address is required for ONBOARDING_USER role");
        }
        challengeRequest = {
          onboardingUser: { app: appAddress, wallet: walletAddress },
        };
        break;
      case LensAuthRole.ACCOUNT_OWNER:
        if (!appAddress || !options.accountAddress || !options.ownerAddress) {
          throw new Error(
            "App, account, and owner addresses are required for ACCOUNT_OWNER role"
          );
        }
        challengeRequest = {
          accountOwner: {
            app: appAddress,
            account: options.accountAddress,
            owner: options.ownerAddress || walletAddress,
          },
        };
        break;
      case LensAuthRole.ACCOUNT_MANAGER:
        if (!appAddress || !options.accountAddress) {
          throw new Error(
            "App, account, and manager addresses are required for ACCOUNT_MANAGER role"
          );
        }
        challengeRequest = {
          accountManager: {
            app: appAddress,
            account: options.accountAddress,
            manager: walletAddress,
          },
        };
        break;
      default:
        throw new Error(`Unsupported authentication role: ${options.role}`);
    }

    const result = await client.challenge(challengeRequest);

    if (result.isErr()) {
      console.error("Challenge generation error:", result.error);
      throw new Error(`Challenge generation failed: ${result.error.message}`);
    }

    return result.value;
  } catch (error) {
    console.error("Challenge generation error:", error);
    throw error;
  }
}

/**
 * Handles user onboarding/authentication with Lens Protocol
 * @param signer - Ethers signer object from the user's wallet
 * @param options - Authentication options (network, role, custom app ID)
 * @returns Authentication result object with tokens
 */
export async function onboardUser(
  signer: ethers.Signer,
  options: AuthOptions = {}
) {
  try {
    const address = await signer.getAddress();

    const appId =
      options.customAppId ||
      (options.useTestnet
        ? LensAppAddresses.TESTNET
        : LensAppAddresses.MAINNET);

    const role = options.role || LensAuthRole.ONBOARDING_USER;

    let loginRequest;

    switch (role) {
      case LensAuthRole.BUILDER:
        loginRequest = { builder: { address } };
        break;
      case LensAuthRole.ONBOARDING_USER:
        loginRequest = { onboardingUser: { app: appId, wallet: address } };
        break;
      case LensAuthRole.ACCOUNT_OWNER:
        loginRequest = {
          accountOwner: {
            app: appId,
            account: address,
            owner: address,
          },
        };
        break;
      case LensAuthRole.ACCOUNT_MANAGER:
        loginRequest = {
          accountManager: {
            app: appId,
            account: address,
            manager: address,
          },
        };
        break;
      default:
        loginRequest = { onboardingUser: { app: appId, wallet: address } };
    }

    const authenticated = await client.login({
      ...loginRequest,
      signMessage: signMessageWith(signer),
    });

    if (authenticated.isErr()) {
      console.error("Authentication error details:", authenticated.error);
      throw new Error(`Authentication failed: ${authenticated.error.message}`);
    }

    const sessionClient = authenticated;
    console.log("Authentication successful!");
    console.log("Session client:", sessionClient);

    return sessionClient;
  } catch (error) {
    console.error("Onboarding error:", error);
    throw error;
  }
}

/**
 * Lists all accounts available for a given wallet address
 * @param walletAddress - EVM wallet address to check available accounts for
 * @param includeOwned - Whether to include accounts owned by the wallet (defaults to true)
 * @returns List of available accounts for the wallet
 */
export async function fetchAvailableAccounts(
  walletAddress: string,
  includeOwned: boolean = true
) {
  try {
    const result = await fetchAccountsAvailable(client, {
      managedBy: evmAddress(walletAddress),
      includeOwned: includeOwned,
    });

    if (result.isErr()) {
      console.error("Failed to fetch available accounts:", result.error);
      throw new Error(
        `Failed to fetch available accounts: ${result.error.message}`
      );
    }

    return result.value;
  } catch (error) {
    console.error("Error fetching available accounts:", error);
    throw error;
  }
}

export async function authenticateChallenge(
  challengeId: string,
  signature: string
) {
  const AUTHENTICATE_MUTATION = gql`
    mutation Authenticate($id: String!, $signature: String!) {
      authenticate(request: { id: $id, signature: $signature }) {
        ... on AuthenticationTokens {
          accessToken
          refreshToken
          idToken
        }
        ... on WrongSignerError {
          reason
        }
        ... on ExpiredChallengeError {
          reason
        }
        ... on ForbiddenError {
          reason
        }
      }
    }
  `;

  const ENDPOINT = "https://api.testnet.lens.xyz/graphql";

  const httpLink = new HttpLink({
    uri: ENDPOINT,
  });

  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem("authToken");
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
  const result = await apolloClient.mutate({
    mutation: AUTHENTICATE_MUTATION,
    variables: {
      id: challengeId,
      signature: signature,
    },
  });

  if (result.errors) {
    throw new Error(`Authentication failed: ${result.errors[0].message}`);
  }

  return result.data.authenticate;
}
