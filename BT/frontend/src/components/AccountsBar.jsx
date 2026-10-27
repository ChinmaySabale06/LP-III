import React, { useState } from "react";
import { Users, Copy, Check, Info } from "lucide-react";
import { TEST_ACCOUNTS } from "../utils/contract";

export default function AccountsBar({ currentAccount }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (address, index) => {
    navigator.clipboard.writeText(address);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="accounts-helper-box">
      <div className="accounts-helper-title">
        <Users size={16} />
        <span>Hardhat Local Test Accounts (for Quick Testing & Grading)</span>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--slate-500)", marginBottom: "10px" }}>
        Import any of these pre-funded accounts into MetaMask using Hardhat's default private keys to test both Patient and Doctor roles locally.
      </p>

      <div>
        {TEST_ACCOUNTS.map((acc, idx) => {
          const isCurrent = currentAccount && currentAccount.toLowerCase() === acc.address.toLowerCase();
          return (
            <div key={idx} className="account-row">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="account-label">{acc.role}:</span>
                <span className="account-address-code">{acc.address}</span>
                {isCurrent && (
                  <span
                    className="brand-pill"
                    style={{ background: "var(--emerald-50)", color: "var(--emerald-500)" }}
                  >
                    Active in MetaMask
                  </span>
                )}
              </div>
              <button
                className="copy-btn"
                onClick={() => handleCopy(acc.address, idx)}
                title="Copy address to clipboard"
              >
                {copiedIndex === idx ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--emerald-500)", fontSize: "0.75rem" }}>
                    <Check size={14} /> Copied
                  </span>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
