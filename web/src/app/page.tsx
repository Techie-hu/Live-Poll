"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, isDemoMode } from "@/lib/wallet-kit";
import { getContractClient, resetContractClient } from "@/lib/contract-client";
import { Networks } from "@creit.tech/stellar-wallets-kit";

type PollResults = {
  question: string;
  options: Array<[string, number]>;
};

type TxStatus = "idle" | "pending" | "success" | "error";

export default function Home() {
  const {
    address,
    isConnecting,
    error: walletError,
    availableWallets,
    connect,
    disconnect,
    signTransaction,
    signAuthEntry,
  } = useWallet();

  const [results, setResults] = useState<PollResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const client = await getContractClient(signTransaction, signAuthEntry);
      const { result } = await (client as any).get_results({});
      setResults(result as PollResults);
    } catch (e: any) {
      // In demo capture mode (?demo=1), suppress the contract-RPC error
      // banner so the wallet-ui screenshots aren't dominated by a red
      // network error. Real users never have this flag set.
      if (!isDemoMode()) {
        setError(e?.message || "Failed to fetch results");
      }
    } finally {
      setLoadingResults(false);
    }
  }, [signTransaction, signAuthEntry]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleVote = async () => {
    if (selectedOption === null || !address) return;

    setTxStatus("pending");
    setStatusMessage("Preparing transaction...");
    setError(null);
    setTxHash(null);

    try {
      const client = await getContractClient(signTransaction, signAuthEntry);
      setStatusMessage("Simulating transaction...");
      const tx = await (client as any).vote(
        { voter: address, option_index: selectedOption },
        { publicKey: address }
      );

      setStatusMessage("Waiting for wallet signature...");
      const sent = await tx.signAndSend({
        signTransaction,
        signAuthEntry,
      });

      setTxStatus("success");
      setStatusMessage("Vote submitted!");
      setTxHash(sent.result?.hash || null);
      setVoted(true);
      await fetchResults();
    } catch (e: any) {
      setTxStatus("error");
      const msg = e?.message || "Transaction failed";
      setStatusMessage(msg);
      setError(msg);
      if (msg.includes("rejected") || msg.includes("User rejected")) {
        setStatusMessage("Transaction rejected by wallet");
      }
      if (msg.includes("already voted")) {
        setStatusMessage("You have already voted in this poll");
        setVoted(true);
      }
    }
  };

  const totalVotes = results?.options.reduce((sum, [, v]) => sum + v, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Live Poll
            </h1>
            <p className="text-purple-200 text-sm mt-1">
              Stellar testnet • One question, real-time results
            </p>
          </div>

          <div className="flex items-center gap-3">
            {address ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-purple-300">Connected</p>
                  <p className="text-sm font-mono text-white">
                    {address.slice(0, 4)}...{address.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        {walletError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{walletError}</p>
          </div>
        )}

        {availableWallets.length > 0 && !address && (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-purple-200 text-sm mb-3">
              Supported wallets: {availableWallets.map((w) => w.name).join(", ")}
            </p>
          </div>
        )}

        <main className="space-y-6">
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-1">
              {results?.question || "Loading poll..."}
            </h2>
            <p className="text-purple-300 text-sm mb-6">
              {totalVotes} {totalVotes === 1 ? "vote" : "votes"} cast
            </p>

            {loadingResults && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loadingResults && results && (
              <div className="space-y-3">
                {results.options.map(([text, count], idx) => {
                  const pct =
                    totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        !voted && address && setSelectedOption(idx)
                      }
                      disabled={!address || voted}
                      className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                        selectedOption === idx
                          ? "border-indigo-400 bg-indigo-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      } ${
                        !address || voted
                          ? "opacity-70 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="text-white font-medium">{text}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-300 text-sm font-mono">
                            {pct}%
                          </span>
                          <span className="text-purple-300 text-xs bg-white/10 px-2 py-1 rounded-md">
                            {count} {count === 1 ? "vote" : "votes"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {error && !loadingResults && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-6">
              {!address ? (
                <p className="text-purple-300 text-sm text-center py-3">
                  Connect your wallet to vote
                </p>
              ) : voted ? (
                <div className="flex items-center justify-center gap-2 text-emerald-300 py-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">You have already voted</span>
                </div>
              ) : (
                <button
                  onClick={handleVote}
                  disabled={selectedOption === null || txStatus === "pending"}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  {txStatus === "pending"
                    ? statusMessage || "Processing..."
                    : selectedOption === null
                      ? "Select an option to vote"
                      : "Cast Vote"}
                </button>
              )}
            </div>
          </section>

          {txStatus !== "idle" && (
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-white font-semibold mb-3">
                Transaction Status
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    txStatus === "pending"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : txStatus === "success"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      txStatus === "pending"
                        ? "bg-yellow-400 animate-pulse"
                        : txStatus === "success"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                    }`}
                  />
                  {txStatus === "pending"
                    ? "Pending"
                    : txStatus === "success"
                      ? "Success"
                      : "Failed"}
                </span>
                <span className="text-purple-200 text-sm">{statusMessage}</span>
              </div>

              {txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 text-sm"
                >
                  View on Stellar Explorer
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}

              <button
                onClick={fetchResults}
                disabled={refreshing}
                className="mt-4 text-sm text-purple-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh results"}
              </button>
            </section>
          )}

          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">About this poll</h3>
            <ul className="text-purple-200 text-sm space-y-1 list-disc list-inside">
              <li>
                Deployed contract:{" "}
                <span className="font-mono text-xs">
                  CDPZIOJ5L4VJWAJ4NQ2G4FEQHEGDECJVY5YIN5IDWDOYS5252EHECGPT
                </span>
              </li>
              <li>Network: Stellar Testnet</li>
              <li>One vote per wallet address</li>
              <li>Real-time results updated on-chain</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
