import { Environments } from "@/utils/types";
import {
  PublicClient,
  mainnet,
  testnet,
  staging,
  EnvironmentConfig,
} from "@lens-protocol/client";

export const environments: Record<Environments, EnvironmentConfig> = {
  [Environments.Staging]: staging,
  [Environments.Mainnet]: mainnet,
  [Environments.Testnet]: testnet,
  [Environments.Production]: mainnet,
};

// Public client for Lens Protocol
export const client = PublicClient.create({
  environment: environments[Environments.Testnet],
  // origin: "https://lens-next-poc.vercel.app",
  apiKey: process.env.NEXT_PUBLIC_LENS_API_KEY,
});
