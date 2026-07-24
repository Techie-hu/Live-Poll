"use client";

import { useEffect, useState } from "react";
import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { KleverModule } from "@creit.tech/stellar-wallets-kit/modules/klever";
import { OneKeyModule } from "@creit.tech/stellar-wallets-kit/modules/onekey";
import { BitgetModule } from "@creit.tech/stellar-wallets-kit/modules/bitget";

const DEFAULT_MODULES = typeof window !== "undefined" ? [
  new FreighterModule(),
  new xBullModule(),
  new AlbedoModule(),
  new LobstrModule(),
  new RabetModule(),
  new HanaModule(),
  new KleverModule(),
  new OneKeyModule(),
  new BitgetModule(),
] : [];

let isInitialized = false;

export function initWalletKit() {
  if (typeof window === "undefined") return;
  if (!isInitialized) {
    StellarWalletsKit.init({
      modules: DEFAULT_MODULES,
      network: Networks.TESTNET,
    });
    isInitialized = true;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    initWalletKit();
    const mods = DEFAULT_MODULES;
    const wallets = mods
      .filter((m: any) => m.isAvailable)
      .map((m: any) => ({ id: m.id, name: m.name }));
    setAvailableWallets(wallets);

    const checkConnection = async () => {
      try {
        const addr = await StellarWalletsKit.getAddress();
        if (addr?.address) {
          setAddress(addr.address);
        }
      } catch {
        // not connected
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      initWalletKit();
      const { address: addr } = await StellarWalletsKit.getAddress();
      if (addr) {
        setAddress(addr);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    setAddress(null);
  };

  const signTransaction = async (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => {
    initWalletKit();
    const addr = opts?.address || address || (await StellarWalletsKit.getAddress()).address;
    const result = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase || Networks.TESTNET,
      address: addr,
    });
    if ((result as any).error) {
      throw new Error(
        (result as any).error.message || "Transaction rejected"
      );
    }
    return {
      signedTxXdr: result.signedTxXdr,
      signerAddress: result.signerAddress || addr,
    };
  };

  const signAuthEntry = async (authEntry: string, opts?: { networkPassphrase?: string; address?: string }) => {
    initWalletKit();
    const addr = opts?.address || address || (await StellarWalletsKit.getAddress()).address;
    const result = await StellarWalletsKit.signAuthEntry(authEntry, {
      networkPassphrase: opts?.networkPassphrase || Networks.TESTNET,
      address: addr,
    });
    if ((result as any).error) {
      throw new Error(
        (result as any).error.message || "Auth entry rejected"
      );
    }
    return {
      signedAuthEntry: (result as any).signedAuthEntry || result,
      signerAddress: result.signerAddress || addr,
    };
  };

  return {
    address,
    isConnecting,
    error,
    availableWallets,
    connect,
    disconnect,
    signTransaction,
    signAuthEntry,
  };
}
