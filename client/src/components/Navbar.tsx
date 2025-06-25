// FILE: src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation'; // Import the hook
import ConnectWallet from "./ConnectWallet";

const Navbar = () => {
  const pathname = usePathname(); // Get the current URL path

  // Helper function to determine link styles
  const getLinkClass = (path: string) => {
    return pathname === path
      ? 'text-primary-accent font-bold' // Style for the active page
      : 'text-gray-300 hover:text-primary-accent'; // Style for inactive pages
  };

  return (
    <nav className="w-full p-4 fixed top-0 left-0 z-50 bg-primary-dark/80 backdrop-blur-md border-b border-primary-deep/50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-white tracking-wider hover:text-primary-accent transition-colors">
        Celestia
        </Link>
        <div className="flex items-center gap-6">
            <Link href="/" className={`transition-colors ${getLinkClass('/')}`}>
              Home
            </Link>
            <Link href="/create" className={`transition-colors ${getLinkClass('/create')}`}>
              Create
            </Link>
            {/*<ConnectWallet />*/}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;