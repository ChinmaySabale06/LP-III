// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MentalHealthRecords
 * @notice A decentralized smart contract for secure, patient-controlled mental health record management.
 * @dev Implements access control where patients own their records and explicitly grant/revoke access to doctors.
 */
contract MentalHealthRecords {
    // Structure defining a mental health record
    struct Record {
        uint256 id;
        string recordHash; // Encrypted medical data or IPFS CID
        uint256 timestamp;
    }

    // Mapping to store records privately per patient address
    mapping(address => Record[]) private patientRecords;

    // Access control mapping: Doctor Address => (Patient Address => isAllowed)
    mapping(address => mapping(address => bool)) public doctorAccess;

    // Events for real-time frontend reactivity & blockchain auditing
    event RecordAdded(address indexed patient, uint256 indexed id, string recordHash, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed doctor, uint256 timestamp);
    event AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp);

    // Custom errors for gas efficiency and clear debugging
    error Unauthorized();
    error InvalidDoctorAddress();
    error EmptyRecordHash();

    /**
     * @notice Allows a patient to add a new encrypted record or IPFS hash to their profile
     * @param _recordHash The cryptographic hash / IPFS CID of the encrypted mental health data
     */
    function addRecord(string memory _recordHash) external {
        if (bytes(_recordHash).length == 0) {
            revert EmptyRecordHash();
        }

        uint256 newRecordId = patientRecords[msg.sender].length + 1;
        Record memory newRecord = Record({
            id: newRecordId,
            recordHash: _recordHash,
            timestamp: block.timestamp
        });

        patientRecords[msg.sender].push(newRecord);

        emit RecordAdded(msg.sender, newRecordId, _recordHash, block.timestamp);
    }

    /**
     * @notice Grants a doctor access to view the patient's records
     * @param _doctor The wallet address of the healthcare provider / doctor
     */
    function grantAccess(address _doctor) external {
        if (_doctor == address(0) || _doctor == msg.sender) {
            revert InvalidDoctorAddress();
        }

        doctorAccess[_doctor][msg.sender] = true;

        emit AccessGranted(msg.sender, _doctor, block.timestamp);
    }

    /**
     * @notice Revokes a doctor's permission to view the patient's records
     * @param _doctor The wallet address of the doctor being revoked
     */
    function revokeAccess(address _doctor) external {
        if (_doctor == address(0)) {
            revert InvalidDoctorAddress();
        }

        doctorAccess[_doctor][msg.sender] = false;

        emit AccessRevoked(msg.sender, _doctor, block.timestamp);
    }

    /**
     * @notice Returns all records belonging to the caller (patient)
     * @return Record[] List of caller's records
     */
    function getMyRecords() external view returns (Record[] memory) {
        return patientRecords[msg.sender];
    }

    /**
     * @notice Allows an authorized doctor to view a specific patient's records
     * @param _patient The address of the patient whose records are requested
     * @return Record[] List of the patient's records
     */
    function getPatientRecords(address _patient) external view returns (Record[] memory) {
        // Access Control check: Caller must be a granted doctor for _patient
        if (!doctorAccess[msg.sender][_patient]) {
            revert Unauthorized();
        }

        return patientRecords[_patient];
    }

    /**
     * @notice Helper to check if caller has access to a patient's records
     * @param _patient The patient address
     */
    function hasDoctorAccess(address _patient) external view returns (bool) {
        return doctorAccess[msg.sender][_patient];
    }

    /**
     * @notice Helper to get total number of records for caller
     */
    function getMyRecordCount() external view returns (uint256) {
        return patientRecords[msg.sender].length;
    }
}
