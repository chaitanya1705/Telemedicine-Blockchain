// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserManagement {
    // Structs
    struct Doctor {
        string name;
        string specialization;
        string licenseNumber;
        bool isVerified;
        bool exists;
    }
    
    struct Patient {
        string name;
        uint256 age;
        string medicalHistoryHash; // IPFS hash of patient's medical history
        bool exists;
    }
    
    // Mappings
    mapping(address => Doctor) public doctors;
    mapping(address => Patient) public patients;
    
    // Admin address that can verify doctors
    address public admin;
    
    // Events
    event DoctorRegistered(address indexed doctorAddress, string name, string specialization);
    event DoctorVerified(address indexed doctorAddress);
    event PatientRegistered(address indexed patientAddress, string name, uint age, string medicalHistoryHash);

    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    // Register a new doctor
    function registerDoctor(
        string memory _name,
        string memory _specialization,
        string memory _licenseNumber
    ) external returns (bool) {
        require(!doctors[msg.sender].exists, "Doctor already registered");
        
        doctors[msg.sender] = Doctor({
            name: _name,
            specialization: _specialization,
            licenseNumber: _licenseNumber,
            isVerified: false,
            exists: true
        });
        
        emit DoctorRegistered(msg.sender, _name, _specialization);
        return true;
    }
    
    // Verify a doctor (only admin)
    function verifyDoctor(address _doctorAddress) external onlyAdmin returns (bool) {
        require(doctors[_doctorAddress].exists, "Doctor does not exist");
        require(!doctors[_doctorAddress].isVerified, "Doctor already verified");
        
        doctors[_doctorAddress].isVerified = true;
        
        emit DoctorVerified(_doctorAddress);

        return true;
    }
    
    // Register a new patient
    function registerPatient(
    string memory _name,
    uint256 _age,
    string memory _medicalHistoryHash
) external returns (bool) {
    require(!patients[msg.sender].exists, "Patient already registered");

    patients[msg.sender] = Patient({
        name: _name,
        age: _age,
        medicalHistoryHash: _medicalHistoryHash,
        exists: true
    });

    emit PatientRegistered(msg.sender, _name, _age, _medicalHistoryHash);

    return true;
}
    
    // Check if an address belongs to a verified doctor
    function isDoctor(address _address) external view returns (bool) {
        return doctors[_address].exists && doctors[_address].isVerified;
    }
    
    // Check if an address belongs to a registered patient
    function isPatient(address _address) external view returns (bool) {
        return patients[_address].exists;
    }
    
    // Get doctor details
    function getDoctorDetails(address _doctorAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory specialization,
            string memory licenseNumber,
            bool isVerified
        ) 
    {
        Doctor storage doctor = doctors[_doctorAddress];
        require(doctor.exists, "Doctor does not exist");
        
        return (
            doctor.name,
            doctor.specialization,
            doctor.licenseNumber,
            doctor.isVerified
        );
    }
    
    // Get patient details
    function getPatientDetails(address _patientAddress) 
        external 
        view 
        returns (
            string memory name,
            uint256 age,
            string memory medicalHistoryHash
        ) 
    {
        Patient storage patient = patients[_patientAddress];
        require(patient.exists, "Patient does not exist");
        
        return (
            patient.name,
            patient.age,
            patient.medicalHistoryHash
        );
    }
    
}