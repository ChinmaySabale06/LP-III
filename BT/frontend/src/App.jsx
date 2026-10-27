import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import PatientTab from "./components/PatientTab";
import DoctorTab from "./components/DoctorTab";
import AccountsBar from "./components/AccountsBar";
import {
  getProvider,
  getContractInstance,
  EXPECTED_CHAIN_ID,
  CONTRACT_ADDRESS,
  parseContractError,
  shortenAddress,
} from "./utils/contract";
import { User, Stethoscope, AlertTriangle, ShieldCheck, HeartPulse } from "lucide-react";

export default function App() {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [activeTab, setActiveTab] = useState("patient"); // 'patient' | 'doctor'
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

  // Patient State
  const [myRecords, setMyRecords] = useState([]);

  // Doctor State
  const [searchedPatient, setSearchedPatient] = useState("");
  const [patientRecords, setPatientRecords] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Floating Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  /**
   * Connect to MetaMask
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      showToast("MetaMask is not installed. Please install MetaMask to use this DApp.", "error");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const net = await provider.getNetwork();
        const currentChainId = Number(net.chainId);
        setChainId(currentChainId);
        setNetwork(net.name === "unknown" ? `Chain ${currentChainId}` : net.name);
        setIsCorrectNetwork(currentChainId === EXPECTED_CHAIN_ID);
        showToast(`Connected: ${shortenAddress(accounts[0])}`, "success");
      }
    } catch (err) {
      console.error("Connection failed:", err);
      showToast(parseContractError(err), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Prompt MetaMask to switch or add the local Hardhat network (31337)
   */
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    const hexChainId = "0x" + EXPECTED_CHAIN_ID.toString(16);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
      setIsCorrectNetwork(true);
    } catch (switchError) {
      // 4902 error code means network is not added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              },
            ],
          });
          setIsCorrectNetwork(true);
        } catch (addError) {
          showToast("Failed to add Hardhat network to MetaMask.", "error");
        }
      } else {
        showToast("Failed to switch network.", "error");
      }
    }
  };

  /**
   * Fetch caller's records (for Patient tab)
   */
  const fetchMyRecords = useCallback(async () => {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContractInstance(signer);

      const records = await contract.getMyRecords();
      setMyRecords(records);
    } catch (err) {
      console.error("Error fetching my records:", err);
    }
  }, [account]);

  /**
   * Add Record (Patient)
   */
  const handleAddRecord = async (recordHash) => {
    if (!account) {
      showToast("Please connect your wallet first.", "error");
      return false;
    }

    try {
      setLoadingAction("addRecord");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContractInstance(signer);

      const tx = await contract.addRecord(recordHash);
      showToast("Transaction submitted. Waiting for block confirmation...", "info");
      await tx.wait();

      showToast("Mental health record successfully added to blockchain!", "success");
      await fetchMyRecords();
      return true;
    } catch (err) {
      console.error("Error adding record:", err);
      showToast(parseContractError(err), "error");
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Grant Access to Doctor (Patient)
   */
  const handleGrantAccess = async (doctorAddress) => {
    if (!account) {
      showToast("Please connect your wallet first.", "error");
      return false;
    }

    if (!ethers.isAddress(doctorAddress)) {
      showToast("Please enter a valid Ethereum address.", "error");
      return false;
    }

    try {
      setLoadingAction("grantAccess");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContractInstance(signer);

      const tx = await contract.grantAccess(doctorAddress);
      showToast("Permission update submitted to blockchain...", "info");
      await tx.wait();

      showToast(`Doctor access granted to ${shortenAddress(doctorAddress)}!`, "success");
      return true;
    } catch (err) {
      console.error("Error granting access:", err);
      showToast(parseContractError(err), "error");
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Revoke Access from Doctor (Patient)
   */
  const handleRevokeAccess = async (doctorAddress) => {
    if (!account) {
      showToast("Please connect your wallet first.", "error");
      return false;
    }

    if (!ethers.isAddress(doctorAddress)) {
      showToast("Please enter a valid Ethereum address.", "error");
      return false;
    }

    try {
      setLoadingAction("revokeAccess");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContractInstance(signer);

      const tx = await contract.revokeAccess(doctorAddress);
      showToast("Revocation submitted to blockchain...", "info");
      await tx.wait();

      showToast(`Doctor access revoked for ${shortenAddress(doctorAddress)}!`, "success");
      return true;
    } catch (err) {
      console.error("Error revoking access:", err);
      showToast(parseContractError(err), "error");
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Fetch Patient Records (Doctor)
   */
  const handleFetchPatientRecords = async (patientAddress) => {
    if (!account) {
      showToast("Please connect your doctor wallet first.", "error");
      return;
    }

    if (!ethers.isAddress(patientAddress)) {
      showToast("Please enter a valid Ethereum patient address.", "error");
      return;
    }

    setSearchedPatient(patientAddress);
    setAccessDenied(false);
    setPatientRecords(null);

    try {
      setLoadingAction("fetchPatientRecords");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContractInstance(signer);

      // Call getPatientRecords(patientAddress)
      const records = await contract.getPatientRecords(patientAddress);
      setPatientRecords(records);
      setAccessDenied(false);
      showToast(`Successfully retrieved ${records.length} records.`, "success");
    } catch (err) {
      console.error("Error fetching patient records:", err);
      // Determine if error is access denied / unauthorized
      setAccessDenied(true);
      setPatientRecords(null);
      showToast("Access Denied: You are not authorized by this patient.", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  // Listen to MetaMask account / network changes and auto-connect if already authorized
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          showToast(`Account switched: ${shortenAddress(accounts[0])}`, "info");
        } else {
          setAccount("");
          setMyRecords([]);
          setPatientRecords(null);
          showToast("Wallet disconnected.", "info");
        }
      };

      const handleChainChanged = (chainIdHex) => {
        const id = parseInt(chainIdHex, 16);
        setChainId(id);
        setIsCorrectNetwork(id === EXPECTED_CHAIN_ID);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Auto-connect if already connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const provider = new ethers.BrowserProvider(window.ethereum);
            provider.getNetwork().then((net) => {
              const currentChainId = Number(net.chainId);
              setChainId(currentChainId);
              setNetwork(net.name === "unknown" ? `Chain ${currentChainId}` : net.name);
              setIsCorrectNetwork(currentChainId === EXPECTED_CHAIN_ID);
            });
          }
        })
        .catch(console.error);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Fetch patient's records when account changes
  useEffect(() => {
    if (account) {
      fetchMyRecords();
    }
  }, [account, fetchMyRecords]);

  return (
    <>
      <div className="bg-ambient-orb-1" />
      <div className="bg-ambient-orb-2" />

      <div className="app-container">
        {/* Navigation Bar */}
        <Navbar
          account={account}
          network={network}
          chainId={chainId}
          isCorrectNetwork={isCorrectNetwork}
          onConnect={connectWallet}
          onSwitchNetwork={switchNetwork}
          loading={loading}
        />

        {/* Network Warning Alert if not on Hardhat 31337 */}
        {account && !isCorrectNetwork && (
          <div className="alert-box alert-warning">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>Wrong Network Detected!</strong> MindLedger is currently deployed to the Hardhat Localhost network (Chain ID: 31337). Your wallet is connected to Chain ID: {chainId}.
            </div>
            <button
              className="btn-action-primary"
              style={{ width: "auto", padding: "6px 14px", fontSize: "0.82rem" }}
              onClick={switchNetwork}
            >
              Switch to Hardhat (31337)
            </button>
          </div>
        )}

        {/* Hero Section & Role Switcher */}
        <div className="hero-card">
          <div className="hero-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <HeartPulse size={20} color="#6366f1" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-600)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Patient-Owned Healthcare Protocol
              </span>
            </div>
            <h2>Decentralized Mental Health Records</h2>
            <p>
              Your medical history is encrypted and anchored to the blockchain. You have total sovereign authority to grant or revoke provider access at any time.
            </p>
          </div>

          {/* Role Navigation Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "patient" ? "active" : ""}`}
              onClick={() => setActiveTab("patient")}
            >
              <User size={18} />
              <span>Patient Portal</span>
              <span className="tab-badge">{myRecords.length} Records</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "doctor" ? "active" : ""}`}
              onClick={() => setActiveTab("doctor")}
            >
              <Stethoscope size={18} />
              <span>Doctor Portal</span>
            </button>
          </div>
        </div>

        {/* Active Tab View */}
        {activeTab === "patient" ? (
          <PatientTab
            records={myRecords}
            onAddRecord={handleAddRecord}
            onGrantAccess={handleGrantAccess}
            onRevokeAccess={handleRevokeAccess}
            onRefreshRecords={fetchMyRecords}
            loadingAction={loadingAction}
            account={account}
          />
        ) : (
          <DoctorTab
            onFetchRecords={handleFetchPatientRecords}
            patientRecords={patientRecords}
            accessDenied={accessDenied}
            loadingAction={loadingAction}
            account={account}
            searchedPatient={searchedPatient}
          />
        )}

        {/* Hardhat Quick Test Accounts Bar */}
        <AccountsBar currentAccount={account} />
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-floating">
          {toast.type === "success" && <ShieldCheck size={18} color="#10b981" />}
          {toast.type === "error" && <AlertTriangle size={18} color="#f43f5e" />}
          {toast.type === "info" && <div className="spinner" />}
          <span style={{ fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}
    </>
  );
}
