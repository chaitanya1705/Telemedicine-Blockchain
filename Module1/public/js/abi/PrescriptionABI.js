// PrescriptionABI.js
// Export Prescription contract ABI - Auto-generated, do not edit manually!

const PrescriptionABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_userManagementAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_consultationAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "caller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isVerified",
                "type": "bool"
            }
        ],
        "name": "DebugDoctorCheck",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "prescriptionId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "appointmentId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "patient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "doctor",
                "type": "address"
            }
        ],
        "name": "PrescriptionIssued",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "doctorPrescriptions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "patientPrescriptions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "prescriptions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "appointmentId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "patient",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "doctor",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "medicationDetails",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "dosage",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "frequency",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "duration",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "additionalNotes",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "issueDate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expiryDate",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            },
            {
                "internalType": "bool",
                "name": "exists",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_appointmentId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_medicationDetails",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_dosage",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_frequency",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_duration",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_additionalNotes",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_expiryDate",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_signature",
                "type": "bytes"
            }
        ],
        "name": "issuePrescription",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_prescriptionId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_signature",
                "type": "bytes"
            }
        ],
        "name": "verifyPrescription",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_prescriptionId",
                "type": "uint256"
            }
        ],
        "name": "getPrescriptionDetails",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "appointmentId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "patient",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "doctor",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "medicationDetails",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "dosage",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "frequency",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "duration",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "additionalNotes",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "issueDate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expiryDate",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "getDoctorPrescriptions",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPatientPrescriptions",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_prescriptionId",
                "type": "uint256"
            }
        ],
        "name": "isPrescriptionValid",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
];

// Make available for import
PrescriptionABI;