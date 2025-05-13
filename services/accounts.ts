import { account, MetadataAttributeType } from "@lens-protocol/metadata";
import {
  createAccountWithUsername,
  fetchAccount,
} from "@lens-protocol/client/actions";
import { uri, never, SessionClient, Context } from "@lens-protocol/client";
import { storageClient } from "./storageClient";
import { Signer } from "ethers";
import { handleOperationWith } from "@lens-protocol/client/ethers";

const createMetadata = (
  name: string,
  bio: string,
  picture: string,
  coverPicture: string,
  attributes: Array<{ key: string; value: string }>
) => {
  return account({
    name,
    bio,
    picture,
    coverPicture,
    attributes: attributes.map((attr) => ({
      ...attr,
      type: MetadataAttributeType.STRING,
    })),
  });
};

export async function uploadMetadata(
  sessionClient: SessionClient<Context>,
  signer: Signer,
  name: string,
  bio: string,
  picture: string,
  coverPicture: string,
  attributes: Array<{ key: string; value: string }>
) {
  const metadata = createMetadata(name, bio, picture, coverPicture, attributes);
  const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);

  const result = await createAccountWithUsername(sessionClient, {
    username: { localName: name },
    metadataUri: uri(metadataUri),
  })
    .andThen(handleOperationWith(signer))
    .andThen(sessionClient.waitForTransaction)
    .andThen((txHash) => fetchAccount(sessionClient, { txHash }))
    .andThen((account) =>
      sessionClient.switchAccount({
        account: account?.address ?? never("Account not found"),
      })
    );

  if (result.isErr()) {
    console.error("Error creating account:", result.error);
  } else {
    console.log("Account created successfully!");
  }
}
