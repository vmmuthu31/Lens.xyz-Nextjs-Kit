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
import { createUser } from "@/services/features/accounts";

export default function Home() {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    profileImage: "",
    coverImage: "",
  });

  const fetchLensAccount = async () => {
    if (!address) {
      console.error("Address is undefined. Please connect your wallet.");
      return;
    }
    const accounts = await fetchAvailableAccounts(address);
    console.log("Available Lens accounts:", accounts);
  };

  const getToken = () => {
    const token = storage.getItem("authToken");
    console.log("Retrieved token:", token);
    return token;
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      console.log("Token exists:", token);
    }

    fetchLensAccount();
  }, [address]);

  const handleOnboard = async () => {
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
      console.log("Current session:", currentSession);

      console.log("Onboarding successful!", sessionClient);
      const appAddress = currentSession?.app;
      const challenge = await generateChallenge(address, {
        appAddress,
        role: LensAuthRole.ONBOARDING_USER,
      });

      // Step 2: Sign Challenge
      const signature = await signer.signMessage(challenge.text);

      // Step 3: Authenticate
      const tokens = await authenticateChallenge(challenge.id, signature);
      localStorage.setItem("authToken", tokens.accessToken);
      console.log("Authentication successful:", tokens);

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
    } catch (error) {
      console.error("Onboarding failed:", error);
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
            Create Your Profile
          </h2>
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
            onClick={handleOnboard}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-12 px-8 sm:w-auto shadow-lg"
          >
            Onboard with Lens
          </button>
        </div>
      </main>
    </div>
  );
}
