"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Lens Demo
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link
              href="/"
              className={`${
                pathname === "/" ? "text-blue-600" : "text-gray-600"
              } hover:text-blue-600 transition-colors`}
            >
              Home
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
