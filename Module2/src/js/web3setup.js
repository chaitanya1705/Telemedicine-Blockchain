let web3;
let prescriptionSystemContract;
let currentAccount;
let userRole;

// Initialize Web3
async function initWeb3() {
    try {
        // Modern browsers with MetaMask/Ethereum provider
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            console.log("Web3 instance initialized with window.ethereum");
            return true;
        } 
        // Legacy dapp browsers
        else if (window.web3) {
            web3 = new Web3(window.web3.currentProvider);
            console.log("Web3 instance initialized with window.web3.currentProvider");
            return true;
        } 
        // Fallback to Ganache
        else {
            const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            web3 = new Web3(provider);
            console.log("Web3 instance initialized with local provider");
            return true;
        }
    } catch (error) {
        console.error("Error initializing Web3:", error);
        showNotification("Failed to connect to the blockchain network", "error");
        return false;
    }
}

// Connect wallet function
async function connectWallet() {
    try {
        if (window.ethereum) {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentAccount = accounts[0];
            document.getElementById('accountDisplay').textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
            console.log("Connected to account:", currentAccount);
            
            // Setup contract
            const contractLoaded = await loadContract();
            if (contractLoaded) {
                // Check if user is registered
                const isRegistered = await checkUserRegistration();
                updateUIBasedOnRole(isRegistered);
                return true;
            }
            return false;
        } else {
            showNotification("MetaMask not detected! Please install MetaMask to use this application.", "error");
            return false;
        }
    } catch (error) {
        console.error("Error connecting wallet:", error);
        showNotification("Failed to connect wallet: " + error.message, "error");
        return false;
    }
}

// Load contract
async function loadContract() {
    try {
        // Load contract ABI from the generated JSON file
        const response = await fetch('../PrescriptionSystem.json');
        if (!response.ok) {
            throw new Error("Failed to load contract ABI");
        }
        const contractJson = await response.json();
        
        // Get network ID dynamically from MetaMask
        const networkId = await web3.eth.net.getId();
        
        // Create contract instance
        prescriptionSystemContract = new web3.eth.Contract(
            contractJson.abi,
            contractJson.networks[networkId].address 
        );
        
        console.log("Contract loaded successfully at address:", contractJson.networks[networkId].address);
        return true;
    } catch (error) {
        console.error("Error loading contract:", error);
        showNotification("Failed to load smart contract", "error");
        return false;
    }
}

// Check if user is registered
async function checkUserRegistration() {
    try {
        const role = await prescriptionSystemContract.methods.getUserRole(currentAccount).call();
        userRole = parseInt(role);
        
        if (userRole > 0) {
            console.log(`User registered as role: ${userRole}`);
            return true;
        } else {
            console.log("User not registered");
            return false;
        }
    } catch (error) {
        console.error("Error checking user registration:", error);
        return false;
    }
}

// Event listeners for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', async function (accounts) {
        currentAccount = accounts[0];
        document.getElementById('accountDisplay').textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        console.log("Account changed to:", currentAccount);
        
        // Check registration status for new account
        const isRegistered = await checkUserRegistration();
        updateUIBasedOnRole(isRegistered);
    });
}

// Function to format dates from timestamp
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// Convert prescription status number to string
function getStatusText(statusCode) {
    const statuses = ["Created", "Filled", "Expired", "Revoked"];
    return statuses[statusCode] || "Unknown";
}

// Convert role number to string
function getRoleText(roleCode) {
    const roles = ["None", "Doctor", "Patient", "Pharmacist"];
    return roles[roleCode] || "Unknown";
}

function showNotification(message, type) {
    const notificationArea = document.getElementById('notificationArea');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === "error" ? "danger" : type}`;
    notification.innerHTML = message;
    
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationArea.removeChild(notification);
        }, 500);
    }, 5000);
}
// Add this function to web3setup.js
function updateUIBasedOnRole(isRegistered) {
    if (!isRegistered) {
        showSection('registrationSection');
        document.getElementById('prescriptionsLink').classList.add('d-none');
        return;
    }
    
    document.getElementById('prescriptionsLink').classList.remove('d-none');
    
    if (userRole === 1) { // Doctor
        showSection('doctorDashboard');
        loadDoctorPrescriptions();
    } else if (userRole === 2) { // Patient
        showSection('patientDashboard');
        loadPatientPrescriptions();
    } else if (userRole === 3) { // Pharmacist
        showSection('pharmacistDashboard');
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove('d-none');
        } else {
            section.classList.add('d-none');
        }
    });
}
// Add these functions to web3setup.js

// Load patient's prescriptions
async function loadPatientPrescriptions() {
    try {
        const prescriptionIds = await prescriptionSystemContract.methods.getPatientPrescriptions().call({ from: currentAccount });
        const patientPrescriptionsList = document.getElementById('patientPrescriptionsList');
        
        patientPrescriptionsList.innerHTML = '';
        
        if (prescriptionIds.length === 0) {
            patientPrescriptionsList.innerHTML = '<tr><td colspan="7" class="text-center">No prescriptions found</td></tr>';
            return;
        }
        
        for (const id of prescriptionIds) {
            const prescription = await prescriptionSystemContract.methods.getPrescription(id).call();
            
            const statusText = getStatusText(parseInt(prescription.status));
            const statusClass = getStatusClass(parseInt(prescription.status));
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${prescription.id}</td>
                <td>${prescription.doctorId.substring(0, 6)}...${prescription.doctorId.substring(38)}</td>
                <td>${prescription.medication}</td>
                <td>${formatDate(prescription.issueDate)}</td>
                <td>${formatDate(prescription.expiryDate)}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info view-btn" data-id="${prescription.id}">View</button>
                </td>
            `;
            
            patientPrescriptionsList.appendChild(row);
        }
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                viewPrescriptionDetails(id);
            });
        });
        
    } catch (error) {
        console.error("Error loading patient prescriptions:", error);
        showNotification("Failed to load prescriptions", "error");
    }
}

// Load doctor's prescriptions
async function loadDoctorPrescriptions() {
    try {
        const prescriptionIds = await prescriptionSystemContract.methods.getDoctorPrescriptions().call({ from: currentAccount });
        const doctorPrescriptionsList = document.getElementById('doctorPrescriptionsList');
        
        doctorPrescriptionsList.innerHTML = '';
        
        if (prescriptionIds.length === 0) {
            doctorPrescriptionsList.innerHTML = '<tr><td colspan="5" class="text-center">No prescriptions issued yet</td></tr>';
            return;
        }
        
        for (const id of prescriptionIds) {
            const prescription = await prescriptionSystemContract.methods.getPrescription(id).call();
            
            const statusText = getStatusText(parseInt(prescription.status));
            const statusClass = getStatusClass(parseInt(prescription.status));
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${prescription.id}</td>
                <td>${prescription.patientId.substring(0, 6)}...${prescription.patientId.substring(38)}</td>
                <td>${prescription.medication}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info view-btn" data-id="${prescription.id}">View</button>
                    ${statusText === "Created" ? `<button class="btn btn-sm btn-danger revoke-btn" data-id="${prescription.id}">Revoke</button>` : ''}
                </td>
            `;
            
            doctorPrescriptionsList.appendChild(row);
        }
        
        // Add event listeners to buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                viewPrescriptionDetails(id);
            });
        });
        
        document.querySelectorAll('.revoke-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                revokePrescription(id);
            });
        });
        
    } catch (error) {
        console.error("Error loading doctor prescriptions:", error);
        showNotification("Failed to load prescriptions", "error");
    }
}

// You'll also need these additional functions:
function getStatusClass(status) {
    const statusClasses = [
        "bg-primary", // Created
        "bg-success", // Filled
        "bg-warning", // Expired
        "bg-danger"   // Revoked
    ];
    return statusClasses[status] || "bg-secondary";
}

// View prescription details in modal
async function viewPrescriptionDetails(prescriptionId) {
    try {
        const prescription = await prescriptionSystemContract.methods.getPrescription(prescriptionId).call();
        
        const statusText = getStatusText(parseInt(prescription.status));
        const statusClass = getStatusClass(parseInt(prescription.status));
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="prescription-detail">
                <div class="text-center mb-3">
                    <h4>Prescription #${prescription.id}</h4>
                    <span class="badge ${statusClass} mb-2">${statusText}</span>
                </div>
                <dl class="row">
                    <dt class="col-sm-4">Patient:</dt>
                    <dd class="col-sm-8">${prescription.patientId}</dd>
                    
                    <dt class="col-sm-4">Doctor:</dt>
                    <dd class="col-sm-8">${prescription.doctorId}</dd>
                    
                    <dt class="col-sm-4">Medication:</dt>
                    <dd class="col-sm-8">${prescription.medication}</dd>
                    
                    <dt class="col-sm-4">Dosage:</dt>
                    <dd class="col-sm-8">${prescription.dosage}</dd>
                    
                    <dt class="col-sm-4">Quantity:</dt>
                    <dd class="col-sm-8">${prescription.quantity}</dd>
                    
                    <dt class="col-sm-4">Refills Remaining:</dt>
                    <dd class="col-sm-8">${prescription.refills}</dd>
                    
                    <dt class="col-sm-4">Issue Date:</dt>
                    <dd class="col-sm-8">${formatDate(prescription.issueDate)}</dd>
                    
                    <dt class="col-sm-4">Expiry Date:</dt>
                    <dd class="col-sm-8">${formatDate(prescription.expiryDate)}</dd>
                </dl>
            </div>
        `;
        
        // Show the modal
        const prescriptionModal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
        prescriptionModal.show();
        
    } catch (error) {
        console.error("Error viewing prescription details:", error);
        showNotification("Failed to load prescription details", "error");
    }
}

// Doctor - Revoke prescription
async function revokePrescription(prescriptionId) {
    try {
        await prescriptionSystemContract.methods.revokePrescription(prescriptionId).send({ from: currentAccount });
        showNotification("Prescription revoked successfully!", "success");
        loadDoctorPrescriptions();
    } catch (error) {
        console.error("Error revoking prescription:", error);
        showNotification("Failed to revoke prescription: " + error.message, "error");
    }
}