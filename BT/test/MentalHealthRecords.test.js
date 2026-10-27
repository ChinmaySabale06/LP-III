import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("MentalHealthRecords Smart Contract", function () {
  let MentalHealthRecords;
  let contract;
  let owner;
  let patient;
  let doctor1;
  let doctor2;

  beforeEach(async function () {
    [owner, patient, doctor1, doctor2] = await ethers.getSigners();
    MentalHealthRecords = await ethers.getContractFactory("MentalHealthRecords");
    contract = await MentalHealthRecords.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully with a valid address", async function () {
      const address = await contract.getAddress();
      expect(address).to.properAddress;
    });
  });

  describe("Record Management (addRecord & getMyRecords)", function () {
    it("Should allow a patient to add a new record", async function () {
      const recordHash = "QmTestIPFSCID123456789";
      
      const tx = await contract.connect(patient).addRecord(recordHash);
      await expect(tx)
        .to.emit(contract, "RecordAdded")
        .withArgs(patient.address, 1, recordHash, (val) => val > 0);

      const records = await contract.connect(patient).getMyRecords();
      expect(records.length).to.equal(1);
      expect(records[0].id).to.equal(1n);
      expect(records[0].recordHash).to.equal(recordHash);
      expect(records[0].timestamp).to.be.gt(0n);
    });

    it("Should revert if recordHash is empty", async function () {
      await expect(contract.connect(patient).addRecord(""))
        .to.be.revertedWithCustomError(contract, "EmptyRecordHash");
    });

    it("Should increment record IDs correctly for subsequent additions", async function () {
      await contract.connect(patient).addRecord("Hash_1");
      await contract.connect(patient).addRecord("Hash_2");

      const records = await contract.connect(patient).getMyRecords();
      expect(records.length).to.equal(2);
      expect(records[0].id).to.equal(1n);
      expect(records[1].id).to.equal(2n);
    });

    it("Should keep records isolated between different patients", async function () {
      await contract.connect(patient).addRecord("Patient1_Hash");
      await contract.connect(owner).addRecord("Owner_Hash");

      const patientRecords = await contract.connect(patient).getMyRecords();
      const ownerRecords = await contract.connect(owner).getMyRecords();

      expect(patientRecords.length).to.equal(1);
      expect(patientRecords[0].recordHash).to.equal("Patient1_Hash");

      expect(ownerRecords.length).to.equal(1);
      expect(ownerRecords[0].recordHash).to.equal("Owner_Hash");
    });
  });

  describe("Access Control (grantAccess, revokeAccess, getPatientRecords)", function () {
    it("Should allow patient to grant access to a doctor", async function () {
      const tx = await contract.connect(patient).grantAccess(doctor1.address);
      await expect(tx)
        .to.emit(contract, "AccessGranted")
        .withArgs(patient.address, doctor1.address, (val) => val > 0);

      const isAllowed = await contract.doctorAccess(doctor1.address, patient.address);
      expect(isAllowed).to.be.true;
    });

    it("Should allow authorized doctor to view patient's records", async function () {
      await contract.connect(patient).addRecord("EncryptedMentalHealthReport1");
      await contract.connect(patient).grantAccess(doctor1.address);

      const records = await contract.connect(doctor1).getPatientRecords(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].recordHash).to.equal("EncryptedMentalHealthReport1");
    });

    it("Should deny access if doctor has NOT been granted permission", async function () {
      await contract.connect(patient).addRecord("Confidential_Record");

      // doctor2 was never granted access
      await expect(
        contract.connect(doctor2).getPatientRecords(patient.address)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("Should deny access after patient revokes permission", async function () {
      await contract.connect(patient).addRecord("Private_Session_Notes");
      await contract.connect(patient).grantAccess(doctor1.address);

      // Access is active
      const beforeRevoke = await contract.connect(doctor1).getPatientRecords(patient.address);
      expect(beforeRevoke.length).to.equal(1);

      // Patient revokes access
      const tx = await contract.connect(patient).revokeAccess(doctor1.address);
      await expect(tx)
        .to.emit(contract, "AccessRevoked")
        .withArgs(patient.address, doctor1.address, (val) => val > 0);

      expect(await contract.doctorAccess(doctor1.address, patient.address)).to.be.false;

      // Access should now be denied
      await expect(
        contract.connect(doctor1).getPatientRecords(patient.address)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("Should revert if granting to zero address or self", async function () {
      await expect(
        contract.connect(patient).grantAccess(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "InvalidDoctorAddress");

      await expect(
        contract.connect(patient).grantAccess(patient.address)
      ).to.be.revertedWithCustomError(contract, "InvalidDoctorAddress");
    });
  });
});
