import React, { useState } from "react";
import {
  FilePlus,
  UserCheck,
  UserX,
  History,
  Clock,
  KeyRound,
  FileText,
  Copy,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatTimestamp, shortenAddress, TEST_ACCOUNTS } from "../utils/contract";

export default function PatientTab({
  records,
  onAddRecord,
  onGrantAccess,
  onRevokeAccess,
  onRefreshRecords,
  loadingAction,
  account,
}) {
  const [recordHash, setRecordHash] = useState("");
  const [doctorAddress, setDoctorAddress] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Quick preset samples for easy testing
  const sampleRecords = [
    "IPFS: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "Clinical Note #102: GAD-7 Anxiety Score: 14 (Moderate). Recommended weekly mindfulness sessions.",
    "Session 4 Report: CBT for sleep disturbances. Patient reports notable improvement.",
    "Prescription Hash: 0x9f83a42c67de183cbcfd41829e1a89bb6f1c4021 (Encrypted)",
  ];

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!recordHash.trim()) return;
    const success = await onAddRecord(recordHash.trim());
    if (success) {
      setRecordHash("");
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // ignore if not supported
      }
    }
  };

  const handleGrant = async () => {
    if (!doctorAddress.trim()) return;
    const success = await onGrantAccess(doctorAddress.trim());
    if (success) {
      setDoctorAddress("");
    }
  };

  const handleRevoke = async () => {
    if (!doctorAddress.trim()) return;
    const success = await onRevokeAccess(doctorAddress.trim());
    if (success) {
      setDoctorAddress("");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid-layout-2">
      {/* Column 1: Record Creation & Access Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Card 1: Add New Mental Health Record */}
        <div className="card-glass">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-box icon-purple">
                <FilePlus size={20} />
              </div>
              <div>
                <h3 className="card-title">Add Health Record</h3>
                <p className="card-description">Store encrypted record hash or clinical note</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddSubmit}>
            <div className="form-group">
              <label className="form-label">
                Record Hash / Encrypted Clinical Data:
                <span className="form-label-hint">(String or IPFS CID)</span>
              </label>
              <textarea
                className="textarea-custom"
                rows={3}
                placeholder="Enter IPFS CID (e.g. Qm...) or encrypted medical note..."
                value={recordHash}
                onChange={(e) => setRecordHash(e.target.value)}
                required
              />

              <div style={{ marginTop: "10px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--slate-500)" }}>
                  <Sparkles size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Quick Presets for Testing:
                </span>
                <div className="chips-container">
                  {sampleRecords.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chip"
                      onClick={() => setRecordHash(sample)}
                    >
                      {sample.length > 35 ? sample.substring(0, 35) + "..." : sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-action-primary"
              disabled={loadingAction === "addRecord" || !recordHash.trim()}
            >
              <FilePlus size={18} />
              {loadingAction === "addRecord" ? "Confirming on Blockchain..." : "Add Record to Smart Contract"}
            </button>
          </form>
        </div>

        {/* Card 2: Access Control Management */}
        <div className="card-glass">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-box icon-blue">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="card-title">Manage Doctor Access</h3>
                <p className="card-description">Grant or revoke permission for medical providers</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Doctor's Ethereum Wallet Address:
              <span className="form-label-hint">(0x...)</span>
            </label>
            <input
              type="text"
              className="input-text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={doctorAddress}
              onChange={(e) => setDoctorAddress(e.target.value)}
            />

            <div style={{ marginTop: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--slate-500)" }}>
                Quick Doctor Test Accounts:
              </span>
              <div className="chips-container">
                {TEST_ACCOUNTS.filter((acc) => acc.role.includes("Doctor")).map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chip"
                    onClick={() => setDoctorAddress(doc.address)}
                  >
                    {doc.role}: {shortenAddress(doc.address)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <button
              type="button"
              className="btn-action-primary"
              style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
              disabled={loadingAction === "grantAccess" || !doctorAddress.trim()}
              onClick={handleGrant}
            >
              <UserCheck size={18} />
              Grant Access
            </button>

            <button
              type="button"
              className="btn-action-danger"
              style={{ justifyContent: "center" }}
              disabled={loadingAction === "revokeAccess" || !doctorAddress.trim()}
              onClick={handleRevoke}
            >
              <UserX size={18} />
              Revoke Access
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Patient's Existing Records */}
      <div className="card-glass">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-box icon-emerald">
              <History size={20} />
            </div>
            <div>
              <h3 className="card-title">My Mental Health Records</h3>
              <p className="card-description">
                Total Records: <strong>{records.length}</strong>
              </p>
            </div>
          </div>

          <button
            className="chip"
            onClick={onRefreshRecords}
            title="Refresh records from blockchain"
          >
            <Clock size={12} /> Refresh
          </button>
        </div>

        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-box">
              <FileText size={28} />
            </div>
            <h4 style={{ fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
              No Records Found
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>
              You have not added any mental health records yet. Use the form on the left to add your first record.
            </p>
          </div>
        ) : (
          <div className="records-container">
            {records.map((rec, index) => (
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
      </div>
    </div>
  );
}
