// auth.js - Authentication functionality

// Register a new patient
async function registerPatient(name, age, medicalHistoryHash) {
    console.log("Registering patient:", name, age, medicalHistoryHash);
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        console.log("Calling registerPatient contract method");
        const result = await userManagementInstance.methods
            .registerPatient(name, age, medicalHistoryHash)
            .send({ from: currentAccount });
        
        console.log("Patient registered successfully:", result);
        return true;
    } catch (error) {
        console.error("Error registering patient:", error);
        return false;
    }
}

// Register a new doctor
async function registerDoctor(name, specialization, licenseNumber) {
    console.log("Registering doctor:", name, specialization, licenseNumber);
    if (!web3 || !currentAccount || !userManagementInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        console.log("Calling registerDoctor contract method");
        const result = await userManagementInstance.methods
            .registerDoctor(name, specialization, licenseNumber)
            .send({ from: currentAccount });
        
        console.log("Doctor registered successfully:", result);
        return true;
    } catch (error) {
        console.error("Error registering doctor:", error);
        return false;
    }
}

// Login functionality
async function login() {
    console.log("Attempting login");
    if (!web3 || !currentAccount || !authenticationInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        console.log("Calling login contract method");
        const result = await authenticationInstance.methods
            .login()
            .send({ from: currentAccount });
        
        console.log("Login successful:", result);
        return true;
    } catch (error) {
        console.error("Error logging in:", error);
        return false;
    }
}

// Check if an address is a verified doctor
async function checkIsDoctor(address) {
    console.log("Checking if address is doctor:", address);
    if (!web3 || !authenticationInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        return await authenticationInstance.methods
            .isDoctor(address)
            .call();
    } catch (error) {
        console.error("Error checking doctor status:", error);
        return false;
    }
}

// Check if an address is a registered patient
async function checkIsPatient(address) {
    console.log("Checking if address is patient:", address);
    if (!web3 || !authenticationInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        return await authenticationInstance.methods
            .isPatient(address)
            .call();
    } catch (error) {
        console.error("Error checking patient status:", error);
        return false;
    }
}

// Handle patient profile update
async function handlePatientProfileUpdate(event) {
    event.preventDefault();
    console.log("Updating patient profile");
    
    const name = document.getElementById('profile-name').value;
    const age = document.getElementById('profile-age').value;
    const medicalHistory = document.getElementById('profile-medical-history').value;
    
    try {
        // In a real application, you would upload the medical history to IPFS
        // and store the hash on the blockchain
        const medicalHistoryHash = medicalHistory; // Simplified for demo
        
        console.log("Calling registerPatient for profile update");
        const result = await userManagementInstance.methods
            .registerPatient(name, age, medicalHistoryHash)
            .send({ from: currentAccount });
        
        alert("Profile updated successfully!");
        console.log("Profile update result:", result);
    } catch (error) {
        alert("Error updating profile. Please try again.");
        console.error("Error updating patient profile:", error);
    }
}

// Handle doctor profile update
async function handleDoctorProfileUpdate(event) {
    event.preventDefault();
    console.log("Updating doctor profile");
    
    const name = document.getElementById('profile-name').value;
    const specialization = document.getElementById('profile-specialization').value;
    const licenseNumber = document.getElementById('profile-license').value;
    
    try {
        console.log("Calling registerDoctor for profile update");
        const result = await userManagementInstance.methods
            .registerDoctor(name, specialization, licenseNumber)
            .send({ from: currentAccount });
        
        alert("Profile updated successfully!");
        console.log("Profile update result:", result);
    } catch (error) {
        alert("Error updating profile. Please try again.");
        console.error("Error updating doctor profile:", error);
    }
}