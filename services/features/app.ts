import { Platform, app } from "@lens-protocol/metadata";
import { storageClient } from "../clients/storageClient";

export const createAndDeployApp = async ({
  name,
  tagline,
  description,
  logo,
  developer,
  url,
  termsOfService,
  privacyPolicy,
  platforms = [],
}: {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  developer: string;
  url: string;
  termsOfService: string;
  privacyPolicy: string;
  platforms: string[];
}) => {
  const metadata = app({
    name,
    tagline,
    description,
    logo,
    developer,
    url,
    termsOfService,
    privacyPolicy,
    platforms: platforms.map((platform) => platform as Platform),
  });

  const uploadMetadata = async () => {
    const { uri } = await storageClient.uploadAsJson(metadata);
    console.log("Metadata URI:", uri);

    const deployAppContract = async (metadataUri: string) => {
      const mutation = `
                mutation {
                    createApp(
                        request: {
                            metadataUri: "${metadataUri}"
                        }
                    ) {
                        ... on CreateAppResponse {
                            hash
                        }
                        ... on TransactionWillFail {
                            reason
                        }
                    }
                }
            `;

      console.log("Deploy App Mutation:", mutation);
    };

    await deployAppContract(uri);
  };

  await uploadMetadata();
};
