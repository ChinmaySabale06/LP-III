# MindLedger: Blockchain-Based Mental Health Record Management DApp

A secure, decentralized, patient-controlled mental health record management application built on Ethereum. Patients retain sovereign ownership over their confidential clinical data and cryptographically grant or revoke healthcare provider (doctor) access on-chain.

---

## 🛠️ Tech Stack

- **Smart Contract:** Solidity `^0.8.20`
- **Development & Testing Environment:** Hardhat `^2.22` with `@nomicfoundation/hardhat-toolbox`
- **Frontend Framework:** React.js (Vite)
- **Web3 Integration:** Ethers.js `v6`
- **Wallet Support:** MetaMask
- **Styling:** Custom CSS with Glassmorphism and Calming Lavender / Sky-Blue Palette
- **Icons & Polish:** Lucide-React, Canvas-Confetti

---

## 📋 Smart Contract Architecture (`contracts/MentalHealthRecords.sol`)

The `MentalHealthRecords` smart contract enforces sovereign patient ownership:

```solidity
struct Record {
    uint256 id;
    string recordHash;   // Encrypted medical data or IPFS CID
    uint256 timestamp;
}

// Private storage mapping
mapping(address => Record[]) private patientRecords;

// Access control: Doctor => (Patient => isAllowed)
mapping(address => mapping(address => bool)) public doctorAccess;
```

### Core Functions:
1. `addRecord(string memory _recordHash)`: Only the patient can add their own record. Automatically timestamps the block and generates an incremental ID.
2. `grantAccess(address _doctor)`: Patient grants a doctor wallet permission to view their records (`doctorAccess[_doctor][msg.sender] = true`).
3. `revokeAccess(address _doctor)`: Patient revokes access (`doctorAccess[_doctor][msg.sender] = false`).
4. `getMyRecords()`: Returns all records belonging to `msg.sender`.
5. `getPatientRecords(address _patient)`: Returns the patient's records **only** if `doctorAccess[msg.sender][_patient] == true`. Reverts with custom error `Unauthorized()` if permission has not been granted.

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- **Node.js** (v18, v20, or v22+)
- **MetaMask Browser Extension** installed in Chrome, Brave, or Firefox.

---

### 2. Install Dependencies

In the project root directory, install all dependencies:
```bash
# Install root (Hardhat) dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### 3. Run Automated Smart Contract Tests

Verify that all 10 unit tests pass (deployment, record isolation, and access control):
```bash
npm test
```

---

### 4. Start the Local Hardhat Node

Launch a local Ethereum node simulating 20 funded accounts (10,000 ETH each):
```bash
npm run node
```
*Keep this terminal running.*

---

### 5. Deploy the Smart Contract

Open a new terminal window and deploy the contract to your local node:
```bash
npm run deploy
```
> **Note:** The deployment script (`scripts/deploy.js`) automatically exports the deployed contract address and ABI directly to `frontend/src/contracts/MentalHealthRecords.json`.

---

### 6. Start the React Frontend

In the same or a new terminal, launch the frontend dev server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🦊 Configuring MetaMask for Localhost

### Step 1: Add Local Network (Hardhat)
MindLedger includes an automated **"Switch to Hardhat (31337)"** button in the header. Alternatively, you can add it manually in MetaMask:
- **Network Name:** Hardhat Localhost
- **New RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** `ETH`

### Step 2: Import Hardhat Default Accounts
Import at least two accounts into MetaMask using Hardhat's default private keys:

#### Account #0 (Patient / Deployer):
- **Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

#### Account #1 (Doctor 1):
- **Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

#### Account #2 (Doctor 2):
- **Address:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key:** `0x5de4111afa1a4b94908f83103eb2f958080a12f5f2185dae496cb82a442db78e`

---

## 🧪 Testing the Application Flow

### Workflow A: Patient Adds Records
1. Switch MetaMask to **Account #0** (`0xf39F...2266`).
2. Go to the **Patient Portal** tab on the DApp.
3. Click any of the **Quick Presets** (or type a custom encrypted note/IPFS CID) in the "Add Health Record" box.
4. Click **"Add Record to Smart Contract"** and approve the MetaMask transaction.
5. The record immediately appears under **"My Mental Health Records"** with its timestamp, ID, and hash!

### Workflow B: Unauthorized Doctor Query (Access Denied)
1. Switch MetaMask to **Account #1** (`0x7099...79C8`, Doctor 1).
2. Go to the **Doctor Portal** tab.
3. In the patient address field, select the quick chip for **Account #0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`).
4. Click **"Fetch Patient Records"**.
5. The contract will revert with `Unauthorized()`, and the UI displays an **"ACCESS DENIED"** alert banner.

### Workflow C: Patient Grants Doctor Access
1. Switch MetaMask back to **Account #0** (Patient).
2. Go to the **Patient Portal** tab.
3. Under "Manage Doctor Access", click the **"Doctor 1"** quick chip (`0x7099...79C8`).
4. Click **"Grant Access"** and confirm the transaction in MetaMask.

### Workflow D: Doctor Fetches Records Successfully
1. Switch MetaMask back to **Account #1** (Doctor 1).
2. Go to the **Doctor Portal** tab and click **"Fetch Patient Records"**.
3. The records are successfully retrieved and displayed with their IDs, timestamps, and medical hashes!

### Workflow E: Revoking Access
1. Switch MetaMask back to **Account #0** (Patient).
2. Under "Manage Doctor Access", enter Doctor 1's address and click **"Revoke Access"**.
3. Switch back to Doctor 1 and re-fetch: Access is immediately denied again!

---

## 📁 Repository Structure

```
├── contracts/
│   └── MentalHealthRecords.sol    # Smart Contract with Access Control
├── scripts/
│   └── deploy.js                  # Deployment script with auto-sync to frontend
├── test/
│   └── MentalHealthRecords.test.js# Hardhat Chai unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header & Wallet/Network connection
│   │   │   ├── PatientTab.jsx     # Patient record creation & access management
│   │   │   ├── DoctorTab.jsx      # Doctor record lookup & Access Denied alert
│   │   │   └── AccountsBar.jsx    # Quick test accounts reference bar
│   │   ├── contracts/
│   │   │   └── MentalHealthRecords.json # Auto-generated ABI & address
│   │   ├── utils/
│   │   │   └── contract.js        # Ethers.js helper & error parser
│   │   ├── App.jsx                # Core application component
│   │   └── index.css              # Custom calming lavender/sky-blue design
│   └── index.html
├── hardhat.config.js              # Hardhat configuration
└── package.json                   # Root package scripts
```
