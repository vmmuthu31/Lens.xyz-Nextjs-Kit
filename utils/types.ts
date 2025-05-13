export enum Environments {
  Production = "production",
  Staging = "staging",
  Mainnet = "mainnet",
  Testnet = "testnet",
}

export enum LensAppAddresses {
  MAINNET = "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE",
  TESTNET = "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7",
}

export enum LensAuthRole {
  ACCOUNT_OWNER = "ACCOUNT_OWNER",
  ACCOUNT_MANAGER = "ACCOUNT_MANAGER",
  ONBOARDING_USER = "ONBOARDING_USER",
  BUILDER = "BUILDER",
}

export interface AuthOptions {
  useTestnet?: boolean;
  role?: LensAuthRole;
  customAppId?: string;
}

export interface ChallengeOptions {
  useTestnet?: boolean;
  role: LensAuthRole;
  appAddress?: string;
  accountAddress?: string;
  ownerAddress?: string;
}
