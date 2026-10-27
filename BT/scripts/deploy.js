import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying MentalHealthRecords contract with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const MentalHealthRecords = await hre.ethers.getContractFactory("MentalHealthRecords");
  const contract = await MentalHealthRecords.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("MentalHealthRecords deployed successfully to:", contractAddress);
  console.log("----------------------------------------------------");

  // Save frontend artifacts (Address + ABI)
  saveFrontendFiles(contractAddress);
}

function saveFrontendFiles(contractAddress) {
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "MentalHealthRecords.sol",
    "MentalHealthRecords.json"
  );

  if (fs.existsSync(artifactPath)) {
    const ContractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const contractData = {
      address: contractAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId || 31337,
      abi: ContractArtifact.abi,
    };

    fs.writeFileSync(
      path.join(contractsDir, "MentalHealthRecords.json"),
      JSON.stringify(contractData, null, 2)
    );
    console.log(`Saved contract artifact to: ${path.join(contractsDir, "MentalHealthRecords.json")}`);
  }

  // Also save a root copy for easy reference
  const rootArtifactPath = path.join(__dirname, "deployment-info.json");
  fs.writeFileSync(
    rootArtifactPath,
    JSON.stringify({ address: contractAddress, network: hre.network.name, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log(`Saved deployment info to: ${rootArtifactPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
