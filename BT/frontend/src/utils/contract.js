import { ethers } from "ethers";
import contractArtifact from "../contracts/MentalHealthRecords.json";

export const CONTRACT_ADDRESS = contractArtifact.address;
export const CONTRACT_ABI = contractArtifact.abi;
export const EXPECTED_CHAIN_ID = 31337; // Hardhat Localhost default chain ID

/**
 * Common test accounts provided by Hardhat Node for easy testing
 */
export const TEST_ACCOUNTS = [
  {
    role: "Patient (Account #0)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    description: "Default deployer & patient account",
  },
  {
    role: "Doctor 1 (Account #1)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    description: "Healthcare Provider / Specialist",
  },
  {
    role: "Doctor 2 (Account #2)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    description: "Alternate Doctor (unauthorized by default)",
  },
];

/**
 * Returns an ethers BrowserProvider instance
 */
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

/**
 * Returns the MentalHealthRecords contract instance
 * @param {ethers.Signer | ethers.Provider} signerOrProvider 
 */
export function getContractInstance(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

/**
 * Shortens an Ethereum address for cleaner UI presentation
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats unix timestamp to localized date/time
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);
  return new Date(num * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Parses contract revert errors gracefully
 */
export function parseContractError(error) {
  if (!error) return "An unknown error occurred.";

  if (error.code === "ACTION_REJECTED" || error.code === 4001) {
    return "Transaction was cancelled / rejected in MetaMask.";
  }

  const message = error.message || "";

  if (message.includes("Unauthorized") || error.data === "0x82b42900") {
    return "Unauthorized: Doctor is not granted permission to view this patient's records.";
  }

  if (message.includes("EmptyRecordHash")) {
    return "Record hash or encrypted data cannot be empty.";
  }

  if (message.includes("InvalidDoctorAddress")) {
    return "Invalid doctor address. Ensure it is a valid non-zero Ethereum address different from your own.";
  }

  if (error.reason) {
    return error.reason;
  }

  return message.length > 120 ? message.substring(0, 120) + "..." : message;
}
