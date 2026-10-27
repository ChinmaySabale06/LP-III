import React, { useState } from "react";
import {
  Stethoscope,
  Search,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Lock,
  Copy,
  Check,
  FileText,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { formatTimestamp, shortenAddress, TEST_ACCOUNTS } from "../utils/contract";

export default function DoctorTab({
  onFetchRecords,
  patientRecords,
  accessDenied,
  loadingAction,
  account,
  searchedPatient,
}) {
  const [patientInput, setPatientInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!patientInput.trim()) return;
    onFetchRecords(patientInput.trim());
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid-layout-2">
      {/* Column 1: Patient Lookup & Permission Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="card-glass">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-box icon-blue">
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 className="card-title">Doctor Portal</h3>
                <p className="card-description">Query authorized patient records from the blockchain</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label className="form-label">
                Patient's Ethereum Wallet Address:
                <span className="form-label-hint">(0x...)</span>
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="Enter patient address e.g. 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                required
              />

              <div style={{ marginTop: "10px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--slate-500)" }}>
                  Quick Patient Addresses for Testing:
                </span>
                <div className="chips-container">
                  {TEST_ACCOUNTS.filter((acc) => acc.role.includes("Patient")).map((pat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chip"
                      onClick={() => setPatientInput(pat.address)}
                    >
                      {pat.role}: {shortenAddress(pat.address)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-action-primary"
              disabled={loadingAction === "fetchPatientRecords" || !patientInput.trim()}
            >
              <Search size={18} />
              {loadingAction === "fetchPatientRecords" ? "Querying Smart Contract..." : "Fetch Patient Records"}
            </button>
          </form>

          {/* Access Control Notice */}
          <div style={{ marginTop: "24px" }} className="alert-box alert-info">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", marginBottom: "3px" }}>Smart Contract Access Rule:</strong>
              The smart contract executes <code>doctorAccess[msg.sender][patient]</code>. If the patient has not explicitly granted your connected wallet address (<code>{shortenAddress(account)}</code>) access, the transaction will revert with <code>Unauthorized()</code> and trigger an Access Denied alert.
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Result Records or Access Denied Display */}
      <div className="card-glass">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-box icon-purple">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="card-title">Medical Records Results</h3>
              <p className="card-description">
                {searchedPatient ? `Patient: ${shortenAddress(searchedPatient)}` : "No patient queried yet"}
              </p>
            </div>
          </div>

          {patientRecords && (
            <span className="brand-pill" style={{ background: "var(--emerald-50)", color: "var(--emerald-500)" }}>
              <ShieldCheck size={12} style={{ display: "inline", marginRight: "4px" }} />
              Authorized
            </span>
          )}
        </div>

        {/* State 1: Access Denied Alert */}
        {accessDenied && (
          <div className="alert-box alert-error" style={{ flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldAlert size={24} color="#e11d48" />
              <strong style={{ fontSize: "1.05rem" }}>ACCESS DENIED</strong>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.5" }}>
              The patient <strong>{shortenAddress(searchedPatient)}</strong> has <strong>NOT</strong> granted permission to your doctor wallet address (<strong>{shortenAddress(account)}</strong>).
            </p>
            <div style={{ fontSize: "0.8rem", background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "6px" }}>
              💡 <em>To test authorization: Switch to the <strong>Patient Tab</strong> while connected to the patient wallet, enter your doctor's address in the "Manage Doctor Access" section, click <strong>"Grant Access"</strong>, and then re-fetch here.</em>
            </div>
          </div>
        )}

        {/* State 2: Patient Records Returned Successfully */}
        {patientRecords && patientRecords.length > 0 && (
          <div className="records-container">
            <div className="alert-box alert-success" style={{ marginBottom: "12px", padding: "10px 14px" }}>
              <ShieldCheck size={18} />
              <span>Permission Verified: Successfully retrieved <strong>{patientRecords.length}</strong> record(s).</span>
            </div>

            {patientRecords.map((rec, index) => (
              <div key={index} className="record-item-card">
                <div className="record-top-meta">
                  <span className="record-id-badge">
                    <Lock size={12} />
                    Record #{rec.id.toString()}
                  </span>
                  <span className="record-time">
                    <Clock size={13} />
                    {formatTimestamp(rec.timestamp)}
                  </span>
                </div>

                <div className="record-content-box">
                  <div style={{ wordBreak: "break-word", paddingRight: "28px" }}>
                    {rec.recordHash}
                  </div>
                  <button
                    className="copy-btn"
                    style={{ position: "absolute", top: "8px", right: "8px" }}
                    onClick={() => copyToClipboard(rec.recordHash, index)}
                    title="Copy record hash"
                  >
                    {copiedId === index ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State 3: Patient has 0 records */}
        {patientRecords && patientRecords.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-box">
              <UserCheck size={28} />
            </div>
            <h4 style={{ fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
              Access Granted - No Records Found
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>
              You are authorized by this patient, but they have not uploaded any records yet.
            </p>
          </div>
        )}

        {/* State 4: Initial Empty State before querying */}
        {!patientRecords && !accessDenied && (
          <div className="empty-state">
            <div className="empty-icon-box">
              <Search size={28} />
            </div>
            <h4 style={{ fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
              Search for Patient Records
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>
              Enter a patient's Ethereum address on the left and click "Fetch Patient Records". The contract will verify your authorization before returning confidential medical data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
