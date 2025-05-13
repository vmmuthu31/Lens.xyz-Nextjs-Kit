"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Lens.xyz
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
