// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PrescriptionSystem {
    // Define roles
    enum Role { None, Doctor, Patient, Pharmacist }
    
    // Define prescription status
    enum Status { Created, Filled, Expired, Revoked }
    
    // Prescription structure
    struct Prescription {
        uint256 id;
        address patientId;
        address doctorId;
        string medication;
        string dosage;
        uint256 quantity;
        uint256 refills;
        uint256 issueDate;
        uint256 expiryDate;
        Status status;
        address filledBy;
        uint256 filledDate;
    }
    
    // User structure
    struct User {
        string name;
        Role role;
        bool isRegistered;
    }
    
    // Mappings
    mapping(address => User) public users;
    mapping(uint256 => Prescription) public prescriptions;
    mapping(address => uint256[]) public patientPrescriptions;
    mapping(address => uint256[]) public doctorPrescriptions;
    
    uint256 public prescriptionCount = 0;
    
    // Events
    event UserRegistered(address indexed userAddress, string name, Role role);
    event PrescriptionIssued(uint256 indexed prescriptionId, address indexed doctorId, address indexed patientId);
    event PrescriptionFilled(uint256 indexed prescriptionId, address indexed pharmacistId);
    event PrescriptionRevoked(uint256 indexed prescriptionId, address indexed doctorId);
    
    // Modifiers
    modifier onlyDoctor() {
        require(users[msg.sender].role == Role.Doctor, "Only doctors can perform this action");
        _;
    }
    
    modifier onlyPharmacist() {
        require(users[msg.sender].role == Role.Pharmacist, "Only pharmacists can perform this action");
        _;
    }
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User is not registered");
        _;
    }
    
    // Register a new user
    function registerUser(string memory _name, uint8 _role) public {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(_role > 0 && _role <= 3, "Invalid role");
        
        users[msg.sender] = User({
            name: _name,
            role: Role(_role),
            isRegistered: true
        });
        
        emit UserRegistered(msg.sender, _name, Role(_role));
    }
    
    // Issue a new prescription (only doctors)
    function issuePrescription(
        address _patientId,
        string memory _medication,
        string memory _dosage,
        uint256 _quantity,
        uint256 _refills,
        uint256 _expiryDays
    ) public onlyRegistered onlyDoctor returns (uint256) {
        require(users[_patientId].role == Role.Patient, "Invalid patient address");
        
        uint256 prescriptionId = prescriptionCount++;
        uint256 issueDate = block.timestamp;
        uint256 expiryDate = issueDate + (_expiryDays * 1 days);
        
        prescriptions[prescriptionId] = Prescription({
            id: prescriptionId,
            patientId: _patientId,
            doctorId: msg.sender,
            medication: _medication,
            dosage: _dosage,
            quantity: _quantity,
            refills: _refills,
            issueDate: issueDate,
            expiryDate: expiryDate,
            status: Status.Created,
            filledBy: address(0),
            filledDate: 0
        });
        
        patientPrescriptions[_patientId].push(prescriptionId);
        doctorPrescriptions[msg.sender].push(prescriptionId);
        
        emit PrescriptionIssued(prescriptionId, msg.sender, _patientId);
        
        return prescriptionId;
    }
    
    // Fill a prescription (only pharmacists)
    function fillPrescription(uint256 _prescriptionId) public onlyRegistered onlyPharmacist {
        Prescription storage prescription = prescriptions[_prescriptionId];
        
        require(prescription.id == _prescriptionId, "Prescription does not exist");
        require(prescription.status == Status.Created, "Prescription cannot be filled");
        require(block.timestamp <= prescription.expiryDate, "Prescription has expired");
        
        prescription.status = Status.Filled;
        prescription.filledBy = msg.sender;
        prescription.filledDate = block.timestamp;
        
        if (prescription.refills > 0) {
            prescription.refills--;
            prescription.status = Status.Created;
        }
        
        emit PrescriptionFilled(_prescriptionId, msg.sender);
    }
    
    // Revoke a prescription (only the issuing doctor)
    function revokePrescription(uint256 _prescriptionId) public onlyRegistered {
        Prescription storage prescription = prescriptions[_prescriptionId];
        
        require(prescription.id == _prescriptionId, "Prescription does not exist");
        require(prescription.doctorId == msg.sender, "Only the issuing doctor can revoke");
        require(prescription.status == Status.Created, "Cannot revoke filled or expired prescription");
        
        prescription.status = Status.Revoked;
        
        emit PrescriptionRevoked(_prescriptionId, msg.sender);
    }
    
    // Get a prescription by ID
    function getPrescription(uint256 _prescriptionId) public view returns (
        uint256 id,
        address patientId,
        address doctorId,
        string memory medication,
        string memory dosage,
        uint256 quantity,
        uint256 refills,
        uint256 issueDate,
        uint256 expiryDate,
        Status status
    ) {
        Prescription storage prescription = prescriptions[_prescriptionId];
        require(prescription.id == _prescriptionId, "Prescription does not exist");
        
        return (
            prescription.id,
            prescription.patientId,
            prescription.doctorId,
            prescription.medication,
            prescription.dosage,
            prescription.quantity,
            prescription.refills,
            prescription.issueDate,
            prescription.expiryDate,
            prescription.status
        );
    }
    
    // Get all prescriptions for a patient
    function getPatientPrescriptions() public view onlyRegistered returns (uint256[] memory) {
        return patientPrescriptions[msg.sender];
    }
    
    // Get all prescriptions issued by a doctor
    function getDoctorPrescriptions() public view onlyRegistered onlyDoctor returns (uint256[] memory) {
        return doctorPrescriptions[msg.sender];
    }
    
    // Verify if a user is registered and get role
    function getUserRole(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }
}