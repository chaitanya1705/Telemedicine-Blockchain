// app.js - Main application functionality

// Contract instances
let userManagementInstance;
let authenticationInstance;
let consultationInstance;
let prescriptionInstance;

// Web3 and account variables
let web3;
let accounts = [];
let currentAccount;

// User details
let isDoctor = false;
let isPatient = false;
let userDetails = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded");
    
    // Initialize theme
    initTheme();
    
    // Set up UI event listeners
    setupEventListeners();
    
    // Check if MetaMask is installed
    checkMetaMaskInstallation();
});

// Check if MetaMask is installed
function checkMetaMaskInstallation() {
    const metamaskStatusElement = document.getElementById('metamask-status');
    
    if (metamaskStatusElement) {
        if (window.ethereum) {
            metamaskStatusElement.textContent = "MetaMask is installed. Click 'Connect Wallet' to continue.";
            metamaskStatusElement.style.color = "green";
        } else {
            metamaskStatusElement.innerHTML = "MetaMask is not installed. <a href='https://metamask.io/download.html' target='_blank'>Click here to install</a>.";
            metamaskStatusElement.style.color = "red";
            
            // Disable connect button
            const connectWalletBtn = document.getElementById('connect-wallet-btn');
            if (connectWalletBtn) {
                connectWalletBtn.disabled = true;
                connectWalletBtn.textContent = "MetaMask Required";
            }
        }
    }
}

// Initialize Web3
async function initWeb3() {
    console.log("Initializing Web3...");
    
    // Modern browsers with MetaMask
    if (window.ethereum) {
        console.log("Ethereum provider detected");
        web3 = new Web3(window.ethereum);
        try {
            // Request account access
            console.log("Requesting account access...");
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Get accounts
            accounts = await web3.eth.getAccounts();
            currentAccount = accounts[0];
            console.log("Connected account:", currentAccount);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', function (newAccounts) {
                console.log("Account changed:", newAccounts);
                accounts = newAccounts;
                currentAccount = accounts[0];
                location.reload();
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', function () {
                console.log("Chain changed");
                location.reload();
            });
            
            updateConnectionStatus(true);
            
            // Load contract data after successful web3 initialization
            await loadContractData();
            
            // Check admin status after contracts are loaded
            if (typeof checkAndShowAdminButton === 'function') {
                await checkAndShowAdminButton();
            }
            
            // Check authentication after contract data is loaded
            await checkAuthentication();
            
            // Show registration section if not authenticated
            if (!isDoctor && !isPatient && document.getElementById('register')) {
                document.getElementById('login').style.display = 'none';
                document.getElementById('register').style.display = 'block';
            }
            
            return true;
        } catch (error) {
            console.error("User denied account access:", error);
            updateConnectionStatus(false, "Account access denied. Please connect to MetaMask.");
            return false;
        }
    } else {
        // No ethereum provider detected
        console.error("No Ethereum provider detected");
        updateConnectionStatus(false, "MetaMask not detected. Please install MetaMask.");
        return false;
    }
}

// Load contract ABIs and addresses from separate files
async function loadContractData() {
    console.log("Loading contract data...");
    try {
        // Load contract addresses from contract-addresses.js
        const addresses = await loadContractAddresses();
        console.log("Contract addresses loaded:", addresses);
        
        // Load contract ABIs from their respective files
        const userManagementABI = await loadContractABI('UserManagement');
        const authenticationABI = await loadContractABI('Authentication');
        const consultationABI = await loadContractABI('Consultation');
        const prescriptionABI = await loadContractABI('Prescription');
        
        console.log("Contract ABIs loaded");
        
        // Create contract instances
        userManagementInstance = new web3.eth.Contract(userManagementABI, addresses.userManagement);
        authenticationInstance = new web3.eth.Contract(authenticationABI, addresses.authentication);
        consultationInstance = new web3.eth.Contract(consultationABI, addresses.consultation);
        prescriptionInstance = new web3.eth.Contract(prescriptionABI, addresses.prescription);
        
        console.log("Contract instances initialized");
    } catch (error) {
        console.error("Error loading contract data:", error);
        showError("Failed to load contract data. Please check your connection and try again.");
    }
}

// Load contract addresses from external file
// Load contract addresses from external file
async function loadContractAddresses() {
    try {
        console.log("Fetching contract addresses...");
        const response = await fetch('js/contract-addresses.js');
        if (!response.ok) {
            throw new Error(`Failed to load contract addresses: ${response.status} ${response.statusText}`);
        }
        const addressesModule = await response.text();
        
        // Extract the addresses object from the file content
        const startIndex = addressesModule.indexOf('{');
        const endIndex = addressesModule.lastIndexOf('}') + 1;
        
        if (startIndex === -1 || endIndex === 0 || startIndex >= endIndex) {
            throw new Error('Contract addresses file has invalid format');
        }
        
        const addressesJson = addressesModule.substring(startIndex, endIndex);
        const addresses = JSON.parse(addressesJson);
        
        // Verify all required addresses are present
        const requiredContracts = ['userManagement', 'authentication', 'consultation', 'prescription'];
        const missingContracts = requiredContracts.filter(contract => !addresses[contract] || addresses[contract] === '0x0000000000000000000000000000000000000000');
        
        if (missingContracts.length > 0) {
            throw new Error(`Missing contract addresses for: ${missingContracts.join(', ')}`);
        }
        
        console.log("Successfully loaded contract addresses:", addresses);
        return addresses;
    } catch (error) {
        console.error("Error loading contract addresses:", error);
        
        // Instead of silently using fallback addresses, show an error to the user
        const errorMessage = "Failed to load blockchain contract addresses. The application cannot function properly. Please contact support.";
        showError(errorMessage);
        
        // Return null or throw error to indicate failure, rather than providing fallback addresses
        // This prevents the app from working with incorrect contract addresses
        throw new Error("Contract addresses could not be loaded. Application cannot initialize.");
    }
}

// Load contract ABI from external file
async function loadContractABI(contractName) {
    try {
        console.log(`Fetching ${contractName} ABI...`);
        const response = await fetch(`js/abi/${contractName}ABI.js`);
        if (!response.ok) {
            throw new Error(`Failed to load ${contractName} ABI`);
        }
        const abiModule = await response.text();
        
        // Extract the ABI array from the file content
        // This is a safer approach than using eval
        const startIndex = abiModule.indexOf('[');
        const endIndex = abiModule.lastIndexOf(']') + 1;
        const abiJson = abiModule.substring(startIndex, endIndex);
        const abi = JSON.parse(abiJson);
        
        return abi;
    } catch (error) {
        console.error(`Error loading ${contractName} ABI:`, error);
        // Return empty ABI as fallback
        console.log(`Using empty ABI for ${contractName}`);
        return [];
    }
}

// Check user authentication status
async function checkAuthentication() {
    console.log("Checking authentication status...");
    if (!web3 || !currentAccount || !authenticationInstance) {
        console.error("Web3, account, or contract instance not initialized");
        return;
    }
    
    try {
        // Check if user is admin
        const isAdmin = await checkIsAdmin();
        console.log("Is admin:", isAdmin);
        
        // If on admin page, verify admin status
        if (window.location.pathname.includes('admin-dashboard')) {
            if (!isAdmin) {
                console.log("Not admin, redirecting to index");
                window.location.href = 'index.html';
                return;
            }
            // Admin is authenticated, no need to check other roles
            return;
        }
        
        // Check if user is a doctor
        isDoctor = await authenticationInstance.methods.isDoctor(currentAccount).call();
        console.log("Is doctor:", isDoctor);
        
        // Check if user is a patient
        isPatient = await authenticationInstance.methods.isPatient(currentAccount).call();
        console.log("Is patient:", isPatient);
        
        // Redirect to appropriate dashboard if authenticated
        if (isDoctor || isPatient) {
            // If user is on index page and is authenticated, redirect to dashboard
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                if (isDoctor) {
                    console.log("Redirecting to doctor dashboard");
                    window.location.href = 'doctor-dashboard.html';
                } else {
                    console.log("Redirecting to patient dashboard");
                    window.location.href = 'patient-dashboard.html';
                }
            }
            
            // Load user details if on dashboard
            if (isDashboardPage()) {
                await loadUserDetails();
                await loadDashboardData();
            }
        } else if (isAdmin && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
            // If admin is on index page, redirect to admin dashboard
            console.log("Admin detected, redirecting to admin dashboard");
            window.location.href = 'admin-dashboard.html';
        } else {
            // If user is not authenticated and trying to access dashboard, redirect to index
            if (isDashboardPage() && !window.location.pathname.includes('admin-dashboard')) {
                console.log("Not authenticated, redirecting to index");
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
        showError("Failed to verify authentication. Please try again.");
    }
}

// Load user details
async function loadUserDetails() {
    console.log("Loading user details...");
    try {
        // Log contract instance and current account to verify they exist
        console.log("User management instance:", userManagementInstance);
        console.log("Current account:", currentAccount);
        
        if (isDoctor) {
            console.log("Attempting to get doctor details for:", currentAccount);
            
            // Test that the method exists
            console.log("getDoctorDetails method:", userManagementInstance.methods.getDoctorDetails);
            
            const result = await userManagementInstance.methods.getDoctorDetails(currentAccount).call();
            console.log("Raw doctor details result:", result);
            
            userDetails = {
                name: result.name,
                specialization: result.specialization,
                licenseNumber: result.licenseNumber,
                isVerified: result.isVerified
            };
            
            console.log("Processed doctor details:", userDetails);
            
            // Update UI with doctor details - add more logs
            const doctorNameEl = document.getElementById('doctor-name');
            const doctorAddressEl = document.getElementById('doctor-address');
            
            console.log("Doctor name element:", doctorNameEl);
            console.log("Doctor address element:", doctorAddressEl);
            
            if (doctorNameEl) doctorNameEl.textContent = userDetails.name;
            if (doctorAddressEl) doctorAddressEl.textContent = currentAccount;
            
            // Update profile form if on doctor dashboard
            if (document.getElementById('profile-name')) {
                document.getElementById('profile-name').value = userDetails.name;
                document.getElementById('profile-specialization').value = userDetails.specialization;
                document.getElementById('profile-license').value = userDetails.licenseNumber;
                document.getElementById('verification-status').textContent = userDetails.isVerified ? 'Verified' : 'Pending';
            }
        } else if (isPatient) {
            console.log("Attempting to get patient details for:", currentAccount);
            
            // Test that the method exists
            console.log("getPatientDetails method:", userManagementInstance.methods.getPatientDetails);
            
            const result = await userManagementInstance.methods.getPatientDetails(currentAccount).call();
            console.log("Raw patient details result:", result);
            
            userDetails = {
                name: result.name,
                age: result.age,
                medicalHistoryHash: result.medicalHistoryHash
            };
            
            console.log("Processed patient details:", userDetails);
            
            // Update UI with patient details - add more logs
            const patientNameEl = document.getElementById('patient-name');
            const patientAddressEl = document.getElementById('patient-address');
            
            console.log("Patient name element:", patientNameEl);
            console.log("Patient address element:", patientAddressEl);
            
            if (patientNameEl) patientNameEl.textContent = userDetails.name;
            if (patientAddressEl) patientAddressEl.textContent = currentAccount;
            
            // Update profile form if on patient dashboard
            if (document.getElementById('profile-name')) {
                document.getElementById('profile-name').value = userDetails.name;
                document.getElementById('profile-age').value = userDetails.age;
                document.getElementById('profile-medical-history').value = userDetails.medicalHistoryHash;
            }
        }
    } catch (error) {
        console.error("Error loading user details:", error);
        // Show the error details in the UI for easier debugging
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = 'Error loading user details: ' + error.message;
            statusElement.style.color = 'red';
        }
    }
}

// Check if user is admin
async function checkIsAdmin() {
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        const adminAddress = await userManagementInstance.methods.admin().call();
        return adminAddress.toLowerCase() === currentAccount.toLowerCase();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Show admin button if the connected account is an admin
async function checkAndShowAdminButton() {
    if (web3 && currentAccount && userManagementInstance) {
        try {
            const adminAddress = await userManagementInstance.methods.admin().call();
            const isAdmin = adminAddress.toLowerCase() === currentAccount.toLowerCase();
            
            const adminLoginBtn = document.getElementById('admin-login-btn');
            if (adminLoginBtn) {
                adminLoginBtn.style.display = isAdmin ? 'block' : 'none';
                
                // Add event listener to the admin button
                if (isAdmin) {
                    adminLoginBtn.addEventListener('click', function() {
                        window.location.href = 'admin-dashboard.html';
                    });
                }
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        }
    }
}

// Load dashboard data
async function loadDashboardData() {
    console.log("Loading dashboard data");
    if (isDoctor) {
        if (typeof loadDoctorDashboardData === 'function') {
            await loadDoctorDashboardData();
        } else {
            console.warn("loadDoctorDashboardData function not found");
        }
    } else if (isPatient) {
        if (typeof loadPatientDashboardData === 'function') {
            await loadPatientDashboardData();
        } else {
            console.warn("loadPatientDashboardData function not found");
        }
    }
}

// Initialize dashboard tabs
function initDashboardTabs() {
    console.log("Initializing dashboard tabs");
    const tabs = document.querySelectorAll('.sidebar-menu a');
    const tabContents = document.querySelectorAll('.dashboard-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding tab content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Helper functions
function isDashboardPage() {
    return window.location.pathname.includes('dashboard');
}

function updateConnectionStatus(connected, message = '') {
    console.log("Updating connection status:", connected, message);
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = 'Connected to Ethereum network. Account: ' + currentAccount;
            statusElement.style.color = 'green';
        } else {
            statusElement.textContent = message || 'Not connected to Ethereum network';
            statusElement.style.color = 'red';
        }
    }
    
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
        if (connected) {
            connectWalletBtn.textContent = 'Wallet Connected';
            connectWalletBtn.disabled = true;
        } else {
            connectWalletBtn.textContent = 'Connect Wallet';
            connectWalletBtn.disabled = false;
        }
    }
}

// Added helper function to display errors in UI
function showError(message) {
    console.error(message);
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = 'red';
    } else {
        // If no status element, show in alert
        alert(message);
    }
}

function setupEventListeners() {
    console.log("Setting up event listeners");
    
    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Connect wallet button
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            console.log("Connect wallet button clicked");
            const success = await initWeb3();
            if (success && !isDoctor && !isPatient && document.getElementById('register')) {
                document.getElementById('login').style.display = 'none';
                document.getElementById('register').style.display = 'block';
            }
        });
    }
    document.addEventListener('DOMContentLoaded', function() {
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async function() {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    alert('Connected to MetaMask! Account: ' + accounts[0]);
                    // After successful connection, you can proceed with your app's logic
                    // window.location.reload(); // Optional: reload page after connection
                } catch (error) {
                    alert('Failed to connect: ' + error.message);
                }
            } else {
                alert('MetaMask is not installed');
            }
        });
    }
});
    // Doctor registration button
    const registerDoctorBtn = document.getElementById('register-doctor-btn');
    if (registerDoctorBtn) {
        registerDoctorBtn.addEventListener('click', () => {
            document.getElementById('patient-registration-form').style.display = 'none';
            document.getElementById('doctor-registration-form').style.display = 'block';
        });
    }
    
    // Patient registration button
    const registerPatientBtn = document.getElementById('register-patient-btn');
    if (registerPatientBtn) {
        registerPatientBtn.addEventListener('click', () => {
            document.getElementById('doctor-registration-form').style.display = 'none';
            document.getElementById('patient-registration-form').style.display = 'block';
        });
    }
    
    // Doctor registration form
    const doctorRegistrationForm = document.getElementById('doctor-registration-form');
    if (doctorRegistrationForm) {
        doctorRegistrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('doctor-name').value;
            const specialization = document.getElementById('doctor-specialization').value;
            const licenseNumber = document.getElementById('doctor-license').value;
            
            try {
                const result = await registerDoctor(name, specialization, licenseNumber);
                if (result) {
                    alert('Registration successful! Please wait for admin verification.');
                    window.location.href = 'doctor-dashboard.html';
                } else {
                    alert('Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Doctor registration error:', error);
                alert('Registration failed: ' + error.message);
            }
        });
    }
    
    // Patient registration form
    const patientRegistrationForm = document.getElementById('patient-registration-form');
    if (patientRegistrationForm) {
        patientRegistrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('patient-name').value;
            const age = document.getElementById('patient-age').value;
            const medicalHistory = document.getElementById('patient-medical-history').value;
            
            try {
                const result = await registerPatient(name, age, medicalHistory);
                if (result) {
                    alert('Registration successful!');
                    window.location.href = 'patient-dashboard.html';
                } else {
                    alert('Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Patient registration error:', error);
                alert('Registration failed: ' + error.message);
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Logout clicked");
            // In a real application, you would handle logout logic here
            window.location.href = 'index.html';
        });
    }
}

// Theme functions
function initTheme() {
    console.log("Initializing theme");
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    console.log("Toggling theme");
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Check if the browser has window.ethereum available and log this information immediately
if (typeof window !== 'undefined') {
    console.log("Window object initialized");
    console.log("window.ethereum available:", !!window.ethereum);
    if (window.ethereum) {
        console.log("ethereum object properties:", Object.keys(window.ethereum));
    }
}

// Registration functions (should be defined elsewhere, added placeholders for completeness)
async function registerDoctor(name, specialization, licenseNumber) {
    if (!userManagementInstance || !currentAccount) {
        showError("Web3 or contract not initialized");
        return false;
    }
    
    try {
        await userManagementInstance.methods.registerDoctor(name, specialization, licenseNumber)
            .send({ from: currentAccount });
        return true;
    } catch (error) {
        console.error("Error registering doctor:", error);
        return false;
    }
}

async function registerPatient(name, age, medicalHistory) {
    if (!userManagementInstance || !currentAccount) {
        showError("Web3 or contract not initialized");
        return false;
    }
    
    try {
        // Hash medical history if needed
        const medicalHistoryHash = web3.utils.keccak256(medicalHistory);
        
        await userManagementInstance.methods.registerPatient(name, age, medicalHistoryHash)
            .send({ from: currentAccount });
        return true;
    } catch (error) {
        console.error("Error registering patient:", error);
        return false;
    }
}

// Initialize the dashboard when the page loads
window.addEventListener('load', async () => {
    console.log("Page loaded");
    
    // Try connecting to MetaMask if available
    if (window.ethereum) {
        setTimeout(async () => {
            try {
                // Only auto-connect if we're on a dashboard page
                if (isDashboardPage()) {
                    const success = await initWeb3();
                    if (success) {
                        console.log("Initializing dashboard");
                        initDashboardTabs();
                        
                        // Try loading data again
                        if (isDoctor) {
                            // Check if doctor dashboard functions are available
                            if (typeof loadDoctorDashboardData === 'function') {
                                await loadDoctorDashboardData();
                            }
                        } else if (isPatient) {
                            // Check if patient dashboard functions are available
                            if (typeof loadPatientDashboardData === 'function') {
                                await loadPatientDashboardData();
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error initializing application:", error);
                showError("Failed to initialize application. Please refresh and try again.");
            }
        }, 1000); // 1 second delay
    }
});