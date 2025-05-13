import { client } from "../client";
import { ethers } from "ethers";
import { AuthenticationResult, evmAddress } from "@lens-protocol/client";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";

/**
 * Default Lens protocol app addresses
 */
export enum LensAppAddresses {
  MAINNET = "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE",
  TESTNET = "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7",
}

/**
 * Authentication roles supported by Lens Protocol
 */
export enum LensAuthRole {
  ACCOUNT_OWNER = "ACCOUNT_OWNER",
  ACCOUNT_MANAGER = "ACCOUNT_MANAGER",
  ONBOARDING_USER = "ONBOARDING_USER",
  BUILDER = "BUILDER",
}

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
 * Authentication configuration options
 */
export interface AuthOptions {
  /** Network to use (defaults to mainnet) */
  useTestnet?: boolean;
  /** Role for authentication (defaults to ONBOARDING_USER) */
  role?: LensAuthRole;
  /** Custom app ID if not using default Lens apps */
  customAppId?: string;
}

/**
 * Interface for authentication challenge options
 */
export interface ChallengeOptions {
  /** Network to use (defaults to mainnet) */
  useTestnet?: boolean;
  /** Role for challenge generation (defaults to ONBOARDING_USER) */
  role: LensAuthRole;
  /** App address required for all roles except BUILDER */
  appAddress?: string;
  /** Account address required for ACCOUNT_OWNER and ACCOUNT_MANAGER roles */
  accountAddress?: string;
  /** Owner address required for ACCOUNT_OWNER role */
  ownerAddress?: string;
  /** Manager address required for ACCOUNT_MANAGER role */
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
    console.log(
      `Generating authentication challenge for ${walletAddress} as ${options.role}`
    );

    // Determine the appropriate app address based on network
    const appAddress =
      options.appAddress ||
      (options.useTestnet
        ? LensAppAddresses.TESTNET
        : LensAppAddresses.MAINNET);

    let challengeRequest;

    switch (options.role) {
      case LensAuthRole.BUILDER:
        // Builder role doesn't require an app address
        challengeRequest = { builder: { address: walletAddress } };
        break;
      case LensAuthRole.ONBOARDING_USER:
        // Onboarding user needs app address and wallet
        if (!appAddress) {
          throw new Error("App address is required for ONBOARDING_USER role");
        }
        challengeRequest = {
          onboardingUser: { app: appAddress, wallet: walletAddress },
        };
        break;
      case LensAuthRole.ACCOUNT_OWNER:
        // Account owner authentication
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
        // Account manager authentication
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

    console.log("Challenge generated successfully");
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
): Promise<AuthenticationResult> {
  try {
    const address = await signer.getAddress();

    // Determine the appropriate app ID based on network and custom options
    const appId =
      options.customAppId ||
      (options.useTestnet
        ? LensAppAddresses.TESTNET
        : LensAppAddresses.MAINNET);

    const role = options.role || LensAuthRole.ONBOARDING_USER;

    // Log the authentication attempt for debugging
    console.log(`Authenticating ${address} with Lens Protocol as ${role}`);
    console.log(`Using app ID: ${appId}`);

    // Build the appropriate login request based on the role
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

    // Handle authentication result
    if (authenticated.isErr()) {
      console.error("Authentication error details:", authenticated.error);
      throw new Error(`Authentication failed: ${authenticated.error.message}`);
    }

    console.log("Authentication successful");
    return authenticated.value as unknown as AuthenticationResult;
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
    console.log(`Fetching available accounts for wallet: ${walletAddress}`);

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
