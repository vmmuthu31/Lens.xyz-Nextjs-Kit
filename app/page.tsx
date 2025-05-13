"use client";
import { ethers } from "ethers";
import {
  authenticateChallenge,
  fetchAvailableAccounts,
  generateChallenge,
  onboardUser,
} from "@/services/features/onboarding";
import { LensAuthRole } from "@/utils/types";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import {
  getAuthenticatedSessions,
  getCurrentSession,
} from "@/services/features/session";
import { storage } from "@/services/features/storage";
import { createUser, updateUser } from "@/services/features/accounts";
import { MetadataAttributeType } from "@lens-protocol/metadata";

export default function Home() {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    profileImage: "",
    coverImage: "",
  });
  const [lensAccount, setLensAccount] = useState<{
    __typename: string;
    addedAt: string;
    account: {
      __typename: string;
      address: string;
      owner: string;
      score: number;
      createdAt: string;
      username: {
        __typename: string;
        id: string;
        value: string;
        localName: string;
        linkedTo: string;
        ownedBy: string;
        timestamp: string;
        namespace: string;
      };
    };
  } | null>(null);

  const fetchLensAccount = async () => {
    if (!address) {
      console.error("Address is undefined. Please connect your wallet.");
      return;
    }

    const accounts = await fetchAvailableAccounts(address);

    if (accounts && accounts.items && accounts.items.length > 0) {
      const firstAccount = accounts.items[0];
      setLensAccount({
        __typename: firstAccount.__typename,
        addedAt: firstAccount.addedAt.toString(),
        account: {
          __typename: firstAccount.account.__typename,
          address: firstAccount.account.address.toString(),
          owner: firstAccount.account.owner.toString(),
          score: firstAccount.account.score,
          createdAt: firstAccount.account.createdAt.toString(),
          username: {
            __typename: firstAccount.account.username?.__typename || "",
            id: firstAccount.account.username?.id.toString(),
            value: firstAccount.account.username?.value.toString(),
            localName: firstAccount.account.username?.localName || "",
            linkedTo: firstAccount.account.username?.linkedTo || "",
            ownedBy: firstAccount.account.username?.ownedBy.toString(),
            timestamp: firstAccount.account.username?.timestamp.toString(),
            namespace: firstAccount.account.username?.namespace.toString(),
          },
        },
      });
    } else {
      setLensAccount(null);
    }
  };

  const getToken = () => {
    const token = storage.getItem("authToken");
    return token;
  };

  useEffect(() => {
    getToken();
    fetchLensAccount();
  }, [address]);

  const handleOnboardOrUpdate = async () => {
    try {
      if (!window.ethereum || address === undefined) {
        alert("MetaMask is required to onboard.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const sessionClient = await onboardUser(signer, {
        role: LensAuthRole.ONBOARDING_USER,
        useTestnet: true,
      });
      if (sessionClient.isOk()) {
        getAuthenticatedSessions(sessionClient.value).then((sessions) => {
          console.log("Authenticated sessions:", sessions);
        });
      }

      const currentSession = await getCurrentSession(sessionClient.value);
      const appAddress = currentSession?.app;
      const challenge = await generateChallenge(address, {
        appAddress,
        role: LensAuthRole.ONBOARDING_USER,
      });

      const signature = await signer.signMessage(challenge.text);

      const tokens = await authenticateChallenge(challenge.id, signature);
      localStorage.setItem("authToken", tokens.accessToken);

      if (lensAccount) {
        await updateUser(
          formData.username || lensAccount.account.username.localName,
          formData.bio || "",
          formData.profileImage || "",
          formData.coverImage || "",
          [
            {
              key: "hobby",
              value: "coding",
              type: MetadataAttributeType.STRING,
            },
            {
              key: "location",
              value: "Earth",
              type: MetadataAttributeType.STRING,
            },
          ]
        );
      } else {
        await createUser(
          sessionClient.value,
          signer,
          formData.username,
          formData.bio,
          formData.profileImage,
          formData.coverImage,
          [
            { key: "hobby", value: "coding" },
            { key: "location", value: "Earth" },
          ]
        );
      }
    } catch (error) {
      console.error("Onboarding or update failed:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "username") {
      const sanitizedValue = value.replace(/[^a-z]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 gap-6  font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[20px] row-start-2 items-center">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {lensAccount ? "Update Your Profile" : "Create Your Profile"}
          </h2>
          {lensAccount && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <strong>Existing Account:</strong>
              </p>
              <p className="text-sm text-gray-500">
                Username: {lensAccount.account.username.localName}
              </p>
              <p className="text-sm text-gray-500">
                Bio: {lensAccount.account.username.value}
              </p>
            </div>
          )}
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                placeholder="Enter your username"
              />
              <p className="mt-1 text-sm text-gray-500">
                Only lowercase letters are allowed. No spaces or special
                characters.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                placeholder="Write a short bio"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image URL
              </label>
              <input
                type="text"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                placeholder="Enter profile image URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="text"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                placeholder="Enter cover image URL"
              />
            </div>
          </form>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={handleOnboardOrUpdate}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-12 px-8 sm:w-auto shadow-lg"
          >
            {lensAccount ? "Update Profile" : "Onboard with Lens"}
          </button>
        </div>
      </main>
    </div>
  );
}
