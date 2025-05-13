import { account, MetadataAttributeType } from "@lens-protocol/metadata";
import { ApolloClient, InMemoryCache, gql, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { SessionClient, Context } from "@lens-protocol/client";
import { storageClient } from "../clients/storageClient";
import { Signer } from "ethers";

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

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

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

export async function createUser(
  sessionClient: SessionClient<Context>,
  signer: Signer,
  name: string, // This is the username
  bio: string,
  picture: string,
  coverPicture: string,
  attributes: Array<{ key: string; value: string }>
) {
  try {
    const metadata = createMetadata(
      name,
      bio,
      picture,
      coverPicture,
      attributes
    );
    console.log("Metadata:", metadata);

    const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);
    console.log("Metadata URI:", metadataUri);

    const CREATE_ACCOUNT_MUTATION = gql`
      mutation CreateAccount($username: String!, $metadataUri: String!) {
        createAccountWithUsername(
          request: {
            username: { localName: $username }
            metadataUri: $metadataUri
          }
        ) {
          ... on CreateAccountResponse {
            hash
          }
          ... on UsernameTaken {
            reason
          }
          ... on NamespaceOperationValidationFailed {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

    const result = await client.mutate({
      mutation: CREATE_ACCOUNT_MUTATION,
      variables: {
        username: name,
        metadataUri: metadataUri,
      },
    });

    if (
      result.data.createAccountWithUsername.__typename ===
      "CreateAccountResponse"
    ) {
      console.log(
        "Account creation successful:",
        result.data.createAccountWithUsername.hash
      );
      return result.data.createAccountWithUsername.hash;
    }

    if (result.data.createAccountWithUsername.__typename === "UsernameTaken") {
      console.error(
        "Username is already taken:",
        result.data.createAccountWithUsername.reason
      );
      throw new Error(result.data.createAccountWithUsername.reason);
    }

    if (
      result.data.createAccountWithUsername.__typename ===
      "NamespaceOperationValidationFailed"
    ) {
      console.error(
        "Validation failed:",
        result.data.createAccountWithUsername.reason
      );
      throw new Error(result.data.createAccountWithUsername.reason);
    }

    if (
      result.data.createAccountWithUsername.__typename === "TransactionWillFail"
    ) {
      console.error(
        "Transaction will fail:",
        result.data.createAccountWithUsername.reason
      );
      throw new Error(result.data.createAccountWithUsername.reason);
    }

    console.error("Unknown error during account creation:", result);
    throw new Error("Unknown error during account creation");
  } catch (error) {
    console.error("Error during account creation:", error);
    throw error;
  }
}

export async function updateUser(
  name: string,
  bio: string,
  picture: string,
  coverPicture: string,
  attributes: Array<{ key: string; value: string; type: MetadataAttributeType }>
) {
  try {
    const metadata = account({
      name,
      bio,
      picture,
      coverPicture,
      attributes: attributes.map((attr) => ({
        key: attr.key,
        value: attr.value,
        type: MetadataAttributeType.STRING,
      })),
    });

    const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);
    console.log("Updated Metadata URI:", metadataUri);

    const SET_ACCOUNT_METADATA_MUTATION = gql`
      mutation SetAccountMetadata($metadataUri: String!) {
        setAccountMetadata(request: { metadataUri: $metadataUri }) {
          ... on SetAccountMetadataResponse {
            hash
          }
          ... on SponsoredTransactionRequest {
            reason
          }
          ... on SelfFundedTransactionRequest {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

    const result = await client.mutate({
      mutation: SET_ACCOUNT_METADATA_MUTATION,
      variables: {
        metadataUri,
      },
    });

    if (
      result.data.setAccountMetadata.__typename === "SetAccountMetadataResponse"
    ) {
      console.log(
        "Metadata update successful:",
        result.data.setAccountMetadata.hash
      );
      return result.data.setAccountMetadata.hash;
    }

    if (result.data.setAccountMetadata.__typename === "TransactionWillFail") {
      console.error(
        "Transaction will fail:",
        result.data.setAccountMetadata.reason
      );
      throw new Error(result.data.setAccountMetadata.reason);
    }

    console.error("Unknown error during metadata update:", result);
    throw new Error("Unknown error during metadata update");
  } catch (error) {
    console.error("Error during metadata update:", error);
    throw error;
  }
}
