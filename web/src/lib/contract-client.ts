"use client";

import { Client } from "@stellar/stellar-sdk/contract";

const CONTRACT_ID =
  "CDPZIOJ5L4VJWAJ4NQ2G4FEQHEGDECJVY5YIN5IDWDOYS5252EHECGPT";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

let clientPromise: Promise<Client> | null = null;

export function getContractClient(
  signTransaction?: (xdr: string, opts?: any) => Promise<any>,
  signAuthEntry?: (entry: string, opts?: any) => Promise<any>
): Promise<Client> {
  if (!clientPromise) {
    clientPromise = Client.from({
      contractId: CONTRACT_ID,
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      signTransaction: signTransaction as any,
      signAuthEntry: signAuthEntry as any,
    });
  }
  return clientPromise;
}

export function resetContractClient() {
  clientPromise = null;
}
