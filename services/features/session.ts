import { client } from "../clients/client";
import {
  currentSession,
  fetchAuthenticatedSessions,
  lastLoggedInAccount,
} from "@lens-protocol/client/actions";
import { evmAddress, SessionClient } from "@lens-protocol/client";
import { gql } from "@apollo/client";

/**
 * Resume an authenticated session from long-term storage.
 */
export async function resumeSession() {
  const resumed = await client.resumeSession();

  if (resumed.isErr()) {
    console.error(resumed.error);
    return null;
  }

  return resumed.value;
}

/**
 * Get details about the current session.
 */
export async function getCurrentSession(sessionClient: SessionClient) {
  const result = await currentSession(sessionClient);

  if (result.isErr()) {
    console.error(result.error);
    return null;
  }

  return result.value;
}

/**
 * Fetch a paginated list of all authenticated sessions.
 */
export async function getAuthenticatedSessions(sessionClient: SessionClient) {
  const result = await fetchAuthenticatedSessions(sessionClient);

  if (result.isErr()) {
    console.error(result.error);
    return [];
  }

  return result.value.items;
}

/**
 * Get the last logged-in account for a specific address.
 */
export async function getLastLoggedInAccount(address: string) {
  const result = await lastLoggedInAccount(client, {
    address: evmAddress(address),
  });

  if (result.isErr()) {
    console.error(result.error);
    return null;
  }

  return result.value;
}

/**
 * Revoke a specific authenticated session.
 * @param authenticationId The ID of the session to revoke.
 */
export async function Logout(authenticationId: string) {
  const REVOKE_AUTHENTICATION_MUTATION = gql`
    mutation RevokeAuthentication($request: RevokeAuthenticationRequest!) {
      revokeAuthentication(request: $request)
    }
  `;

  try {
    const result = await client.mutation(REVOKE_AUTHENTICATION_MUTATION, {
      request: {
        authenticationId,
      },
    });

    return result.isOk();
  } catch (error) {
    console.error("Error revoking authentication:", error);
    return false;
  }
}
