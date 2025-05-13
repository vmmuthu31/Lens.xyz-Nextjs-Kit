import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { IStorageProvider } from "@lens-protocol/client";

export const storage: IStorageProvider = {
  getItem(key: string) {
    const value = getCookie(key);
    return typeof value === "string" ? value : null;
  },

  async setItem(key: string, value: string) {
    await setCookie(key, value);
  },

  async removeItem(key: string) {
    await deleteCookie(key);
  },
};
