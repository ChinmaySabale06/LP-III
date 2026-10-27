import React from "react";
import { Activity, ShieldCheck, Wallet, RefreshCw, AlertTriangle } from "lucide-react";
import { shortenAddress } from "../utils/contract";

export default function Navbar({
  account,
  network,
  chainId,
  isCorrectNetwork,
  onConnect,
  onSwitchNetwork,
  loading,
}) {
  return (
    <header className="header-glass">
      <div className="brand-wrapper">
        <div className="brand-icon-box">
          <Activity size={26} strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 className="brand-title">MindLedger</h1>
            <span className="brand-pill">Web3 DApp</span>
          </div>
          <p className="brand-subtitle">
            <ShieldCheck size={14} color="#6366f1" />
            Confidential Mental Health Records on Blockchain
          </p>
        </div>
      </div>

      <div className="wallet-bar">
        {account && (
          <div
            className="network-badge"
            style={{
              borderColor: isCorrectNetwork ? "var(--sky-200)" : "#fecdd3",
              background: isCorrectNetwork ? "var(--sky-50)" : "#fff1f2",
              color: isCorrectNetwork ? "var(--sky-700)" : "#9f1239",
            }}
          >
            <span
              className="network-dot"
              style={{
                backgroundColor: isCorrectNetwork ? "var(--emerald-500)" : "var(--rose-500)",
                boxShadow: isCorrectNetwork ? "0 0 8px var(--emerald-500)" : "0 0 8px var(--rose-500)",
              }}
            />
            {network ? network : "Localhost (31337)"}
          </div>
        )}

        {account ? (
          <div className="wallet-badge" title={account}>
            <div className="wallet-avatar">
              {account.substring(2, 4).toUpperCase()}
            </div>
            <span>{shortenAddress(account)}</span>
          </div>
        ) : (
          <button
            className="btn-connect"
            onClick={onConnect}
            disabled={loading}
          >
            <Wallet size={18} />
            {loading ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}

        {account && !isCorrectNetwork && (
          <button
            className="btn-action-danger"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            onClick={onSwitchNetwork}
            title="Switch MetaMask to Hardhat Localhost (Chain ID: 31337)"
          >
            <AlertTriangle size={14} />
            Switch Network
          </button>
        )}
      </div>
    </header>
  );
}
