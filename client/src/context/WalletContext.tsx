// FILE: client/src/context/WalletContext.tsx
"use client";

import { useState, createContext, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
    account: string | null;
    connectWallet: () => Promise<void>;
    errorMessage: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setErrorMessage(null);
                }
            } catch (error) {
                console.error("Error connecting to MetaMask", error);
                setErrorMessage("Failed to connect wallet. Please try again.");
            }
        } else {
            setErrorMessage("MetaMask is not installed. Please install it to continue.");
        }
    };

    return (
        <WalletContext.Provider value={{ account, connectWallet, errorMessage }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};