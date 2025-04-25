// admin.js - Admin dashboard functionality

// Check if the current user is the admin
let isAdmin = false;

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Admin dashboard loaded");
    
    // Set up UI event listeners
    setupEventListeners();
    
    // Initialize tabs
    initDashboardTabs();
    
    // Show debug panel
    document.querySelector('.debug-info').style.display = 'block';
    
    // Setup debug toggle
    document.getElementById('toggle-debug').addEventListener('click', function() {
        const debugContent = document.getElementById('debug-content');
        if (debugContent.style.display === 'none') {
            debugContent.style.display = 'block';
            this.textContent = 'Hide Debug Info';
            
            // Populate debug info
            document.getElementById('debug-is-admin').textContent = isAdmin;
            document.getElementById('debug-account').textContent = currentAccount;
            
            // Get contract addresses
            fetch('js/contract-addresses.js')
                .then(response => response.text())
                .then(text => {
                    const startIndex = text.indexOf('{');
                    const endIndex = text.lastIndexOf('}') + 1;
                    const addressesJson = text.substring(startIndex, endIndex);
                    document.getElementById('debug-contract-addresses').textContent = addressesJson;
                });
        } else {
            debugContent.style.display = 'none';
            this.textContent = 'Show Debug Info';
        }
    });
});

// Check if the current user is the admin
async function checkAdminStatus() {
    console.log("Checking admin status...");
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3, account, or contract instance not initialized");
        return false;
    }
    
    try {
        const adminAddress = await userManagementInstance.methods.admin().call();
        console.log("Admin address from contract:", adminAddress);
        console.log("Current account:", currentAccount);
        
        isAdmin = (adminAddress.toLowerCase() === currentAccount.toLowerCase());
        console.log("Is admin:", isAdmin);
        
        if (!isAdmin) {
            alert("You are not authorized to access the admin dashboard.");
            window.location.href = 'index.html';
            return false;
        }
        
        // Display admin address
        document.getElementById('admin-address').textContent = currentAccount;
        return true;
    } catch (error) {
        console.error("Error checking admin status:", error);
        alert("Error checking admin status: " + error.message);
        return false;
    }
}

// Load pending doctors
async function loadPendingDoctors() {
    console.log("Loading pending doctors...");
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3, account, or contract instance not initialized");
        return;
    }
    
    try {
        // Get all doctor registration events
        const doctorRegisteredEvents = await userManagementInstance.getPastEvents('DoctorRegistered', {
            fromBlock: 0,
            toBlock: 'latest'
        });
        
        console.log("Doctor registered events:", doctorRegisteredEvents);
        
        const pendingDoctorsTable = document.getElementById('pending-doctors-table').querySelector('tbody');
        pendingDoctorsTable.innerHTML = '';
        
        let pendingCount = 0;
        let verifiedCount = 0;
        
        // Process each doctor
        for (const event of doctorRegisteredEvents) {
            const doctorAddress = event.returnValues.doctorAddress;
            
            try {
                // Get doctor details
                const doctor = await userManagementInstance.methods.getDoctorDetails(doctorAddress).call();
                
                // Check if doctor is verified
                const isVerified = doctor.isVerified;
                
                if (isVerified) {
                    verifiedCount++;
                } else {
                    pendingCount++;
                    
                    // Create table row for pending doctor
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${doctor.name}</td>
                        <td>${doctor.specialization}</td>
                        <td>${doctor.licenseNumber}</td>
                        <td>${doctorAddress}</td>
                        <td>
                            <button class="btn primary-btn verify-doctor-btn" data-address="${doctorAddress}">
                                Verify Doctor
                            </button>
                        </td>
                    `;
                    
                    pendingDoctorsTable.appendChild(row);
                }
            } catch (error) {
                console.error(`Error getting details for doctor ${doctorAddress}:`, error);
            }
        }
        
        // Update counts
        document.getElementById('pending-doctors-count').textContent = pendingCount;
        document.getElementById('verified-doctors-count').textContent = verifiedCount;
        
        // Add event listeners to verify buttons
        const verifyButtons = document.querySelectorAll('.verify-doctor-btn');
        verifyButtons.forEach(button => {
            button.addEventListener('click', handleVerifyDoctor);
        });
    } catch (error) {
        console.error("Error loading pending doctors:", error);
    }
}

// Load registered patients
async function loadRegisteredPatients() {
    console.log("Loading registered patients...");
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3, account, or contract instance not initialized");
        return;
    }
    
    try {
        // Get all patient registration events
        const patientRegisteredEvents = await userManagementInstance.getPastEvents('PatientRegistered', {
            fromBlock: 0,
            toBlock: 'latest'
        });
        
        console.log("Patient registered events:", patientRegisteredEvents);
        
        const patientsTable = document.getElementById('patients-table').querySelector('tbody');
        patientsTable.innerHTML = '';
        
        let patientCount = 0;
        
        // Process each patient
        for (const event of patientRegisteredEvents) {
            const patientAddress = event.returnValues.patientAddress;
            
            try {
                // Get patient details
                const patient = await userManagementInstance.methods.getPatientDetails(patientAddress).call();
                
                patientCount++;
                
                // Create table row for patient
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${patientAddress}</td>
                `;
                
                patientsTable.appendChild(row);
            } catch (error) {
                console.error(`Error getting details for patient ${patientAddress}:`, error);
            }
        }
        
        // Update count
        document.getElementById('registered-patients-count').textContent = patientCount;
    } catch (error) {
        console.error("Error loading registered patients:", error);
    }
}

// Handle verify doctor button click
async function handleVerifyDoctor(event) {
    const doctorAddress = event.target.getAttribute('data-address');
    console.log("Verifying doctor:", doctorAddress);
    
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3, account, or contract instance not initialized");
        return;
    }
    
    try {
        console.log("Calling verifyDoctor method...");
        const result = await userManagementInstance.methods.verifyDoctor(doctorAddress)
            .send({ from: currentAccount });
        
        console.log("Doctor verification result:", result);
        
        alert(`Doctor successfully verified!`);
        
        // Refresh the doctors list
        await loadPendingDoctors();
    } catch (error) {
        console.error("Error verifying doctor:", error);
        alert("Error verifying doctor: " + error.message);
    }
}

// Load dashboard data
async function loadDashboardData() {
    console.log("Loading admin dashboard data");
    
    // First check if the user is admin
    const isAdminUser = await checkAdminStatus();
    
    if (isAdminUser) {
        // Load pending doctors
        await loadPendingDoctors();
        
        // Load registered patients
        await loadRegisteredPatients();
    }
}

// Initialize the dashboard when the page loads
window.addEventListener('load', async () => {
    console.log("Admin page loaded");
    
    // Initialize web3
    await initWeb3();
    
    // Wait for contract data to load
    if (web3 && currentAccount) {
        // Load dashboard data
        await loadDashboardData();
    }
});