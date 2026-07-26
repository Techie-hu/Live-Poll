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

// Single source of truth for the registered wallets: each entry pairs a
// human-readable display name with the kit module class. `DEFAULT_MODULES`
// instantiates them at module-load time on the client; the demo capture
// path (see useEffect below) renders the same names without instantiating,
// so there is exactly one place to update if a wallet is added or
// renamed.
const WALLET_DEFS = [
  { id: "freighter", name: "Freighter", mod: FreighterModule },
  { id: "xbull", name: "xBull", mod: xBullModule },
  { id: "albedo", name: "Albedo", mod: AlbedoModule },
  { id: "lobstr", name: "Lobstr", mod: LobstrModule },
  { id: "rabet", name: "Rabet", mod: RabetModule },
  { id: "hana", name: "Hana", mod: HanaModule },
  { id: "klever", name: "Klever", mod: KleverModule },
  { id: "onekey", name: "OneKey", mod: OneKeyModule },
  { id: "bitget", name: "Bitget", mod: BitgetModule },
] as const;

// Each module entry is a class; InstanceType turns it into the runtime
// instance type. Used to give DEFAULT_MODULES a precise element type
// without falling back to `any`.
type WalletModule = InstanceType<(typeof WALLET_DEFS)[number]["mod"]>;

// IMPORTANT: kept as a `let` and populated *lazily* inside `initWalletKit`.
//
// Instantiating the kit modules at module-eval time would run at the top of
// the client bundle, *before* React hydration finishes. Some kit modules
// inject CSS custom properties (e.g. `--swk-background`) into
// `document.documentElement.style` synchronously in their constructor, which
// would diverge from the server-rendered `<html>` and trigger a React
// hydration mismatch warning — surfaced in dev mode as a corner error
// overlay. By deferring instantiation until `initWalletKit()` is called
// from a `useEffect`, the side-effect runs post-hydration and the DOM is
// consistent.
let DEFAULT_MODULES: WalletModule[] = [];

let isInitialized = false;

/**
 * Strict detection of the `?demo=1` flag appended to the URL. Used by the
 * page and the wallet hook to render the wallet-options banner for
 * documentation screenshots when no browser extension is installed.
 *
 * - SSR-safe: returns false on the server (typeof window guard).
 * - Strict: only matches the literal query parameter `demo === "1"`,
 *   not arbitrary substrings (e.g. `?something=demo=12` won't trigger).
 * - Production-isolated: callers that respect this flag render only an
 *   informational banner and suppress a noisy RPC error banner; they do
 *   not bypass any signing / authentication path.
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function initWalletKit() {
  if (typeof window === "undefined") return;
  if (!isInitialized) {
    // Populate the module list lazily, here (post-hydration), instead of
    // at top-level. See the comment above DEFAULT_MODULES.
    DEFAULT_MODULES = WALLET_DEFS.map((d) => new d.mod());
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
    const isDemo = isDemoMode();
    // In demo mode (?demo=1), force every registered wallet to show in
    // the inline banner even though no browser extension is installed.
    // Real production traffic never sets this flag.
    if (isDemo) {
      // Render directly from WALLET_DEFS — no module instantiation, so
      // the names are guaranteed to be readable on the page even when
      // the kit's `m.name` accessor does not surface a string.
      setAvailableWallets(
        WALLET_DEFS.map(({ id, name }) => ({ id, name })),
      );
    } else {
      const wallets = mods
        .filter((m: any) => m.isAvailable)
        .map((m: any) => ({ id: m.id, name: m.name }));
      setAvailableWallets(wallets);
    }

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
