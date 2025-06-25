// FILE: src/components/ConnectWallet.tsx
"use client";

import { useWallet } from '@/context/WalletContext';

const ConnectWallet = () => {
  const { account, connectWallet } = useWallet();

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div>
      {account ? (
        <p className="px-4 py-2 font-mono text-sm text-primary-accent bg-primary-dark/50 border border-primary-deep rounded-full">
          {formatAddress(account)}
        </p>
      ) : (
        <button
          onClick={connectWallet}
          className="px-5 py-2 text-sm font-bold text-white transition-all duration-300 bg-primary-vibrant rounded-full shadow-lg hover:bg-primary-accent hover:text-primary-dark hover:scale-105"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;