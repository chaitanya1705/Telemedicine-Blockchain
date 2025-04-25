document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Web3
    const initialized = await initWeb3();
    if (!initialized) {
        showNotification("Failed to initialize blockchain connection. Please ensure MetaMask is installed.", "error");
    }
    
    // Show login section initially
    showSection('loginSection');
    
    // Login button event listeners (both navbar and main section)
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('loginBtnLarge').addEventListener('click', handleLogin);
    
    // Handle login function
    async function handleLogin() {
        const connected = await connectWallet();
        if (connected) {
            showNotification("Successfully connected to wallet!", "success");
        }
    }
    
    // Navigation event listeners
    document.getElementById('homeLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (!currentAccount) {
            showSection('loginSection');
        } else if (userRole === 0) {
            showSection('registrationSection');
        } else {
            // Show appropriate dashboard based on role
            updateUIBasedOnRole(true);
        }
    });
    
    document.getElementById('prescriptionsLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (!currentAccount) {
            showNotification("Please login first to view prescriptions", "warning");
            return;
        }
        
        if (userRole === 1) {
            showSection('doctorDashboard');
            loadDoctorPrescriptions();
        } else if (userRole === 2) {
            showSection('patientDashboard');
            loadPatientPrescriptions();
        } else if (userRole === 3) {
            showSection('pharmacistDashboard');
        } else {
            showNotification("Please register first to access prescriptions", "warning");
            showSection('registrationSection');
        }
    });
    
    // Registration form submit
    document.getElementById('registrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('userName').value;
        const role = document.getElementById('userRole').value;
        
        try {
            await prescriptionSystemContract.methods.registerUser(name, role).send({ from: currentAccount });
            showNotification("Registration successful!", "success");
            userRole = parseInt(role);
            updateUIBasedOnRole(true);
        } catch (error) {
            console.error("Error during registration:", error);
            showNotification("Registration failed: " + error.message, "error");
        }
    });
    
    // Doctor - Issue prescription form
    document.getElementById('prescriptionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const patientAddress = document.getElementById('patientAddress').value;
        const medication = document.getElementById('medication').value;
        const dosage = document.getElementById('dosage').value;
        const quantity = document.getElementById('quantity').value;
        const refills = document.getElementById('refills').value;
        const expiryDays = document.getElementById('expiryDays').value;
        
        try {
            await prescriptionSystemContract.methods.issuePrescription(
                patientAddress,
                medication,
                dosage,
                quantity,
                refills,
                expiryDays
            ).send({ from: currentAccount });
            
            showNotification("Prescription issued successfully!", "success");
            loadDoctorPrescriptions();
            document.getElementById('prescriptionForm').reset();
        } catch (error) {
            console.error("Error issuing prescription:", error);
            showNotification("Failed to issue prescription: " + error.message, "error");
        }
    });
    
    
    // Pharmacist - Verify prescription form
    document.getElementById('verifyPrescriptionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const prescriptionId = document.getElementById('prescriptionId').value;
        
        try {
            const prescriptionDetails = await prescriptionSystemContract.methods.getPrescription(prescriptionId).call();
            
            // Display prescription details
            const prescriptionDetailsDiv = document.getElementById('prescriptionDetails');
            const prescriptionDetailsContent = document.getElementById('prescriptionDetailsContent');
            
            // Format the prescription details
            let statusText = getStatusText(parseInt(prescriptionDetails.status));
            let statusClass = getStatusClass(parseInt(prescriptionDetails.status));
            
            prescriptionDetailsContent.innerHTML = `
                <div class="prescription-detail">
                    <dl class="row">
                        <dt class="col-sm-4">Prescription ID:</dt>
                        <dd class="col-sm-8">#${prescriptionDetails.id}</dd>
                        
                        <dt class="col-sm-4">Patient:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.patientId}</dd>
                        
                        <dt class="col-sm-4">Doctor:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.doctorId}</dd>
                        
                        <dt class="col-sm-4">Medication:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.medication}</dd>
                        
                        <dt class="col-sm-4">Dosage:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.dosage}</dd>
                        
                        <dt class="col-sm-4">Quantity:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.quantity}</dd>
                        
                        <dt class="col-sm-4">Refills Remaining:</dt>
                        <dd class="col-sm-8">${prescriptionDetails.refills}</dd>
                        
                        <dt class="col-sm-4">Issue Date:</dt>
                        <dd class="col-sm-8">${formatDate(prescriptionDetails.issueDate)}</dd>
                        
                        <dt class="col-sm-4">Expiry Date:</dt>
                        <dd class="col-sm-8">${formatDate(prescriptionDetails.expiryDate)}</dd>
                        
                        <dt class="col-sm-4">Status:</dt>
                        <dd class="col-sm-8"><span class="badge ${statusClass}">${statusText}</span></dd>
                    </dl>
                </div>
            `;
            
            // Show the details section and handle the fill button state
            prescriptionDetailsDiv.classList.remove('d-none');
            
            const fillButton = document.getElementById('fillPrescriptionBtn');
            
            // Disable fill button if prescription is not valid for filling
            if (statusText !== "Created" || 
                new Date().getTime() > prescriptionDetails.expiryDate * 1000) {
                fillButton.disabled = true;
                fillButton.textContent = "Cannot Fill (Invalid/Expired)";
            } else {
                fillButton.disabled = false;
                fillButton.textContent = "Fill Prescription";
                
                // Set the current prescription ID for filling
                fillButton.setAttribute('data-prescription-id', prescriptionId);
            }
            
        } catch (error) {
            console.error("Error verifying prescription:", error);
            showNotification("Failed to verify prescription: " + error.message, "error");
        }
    });
    
    // Pharmacist - Fill prescription button
    document.getElementById('fillPrescriptionBtn').addEventListener('click', async function() {
        if (this.disabled) return;
        
        const prescriptionId = this.getAttribute('data-prescription-id');
        
        try {
            await prescriptionSystemContract.methods.fillPrescription(prescriptionId).send({ from: currentAccount });
            showNotification("Prescription filled successfully!", "success");
            
            // Verify the prescription again to update the UI
            document.getElementById('prescriptionId').value = prescriptionId;
            document.getElementById('verifyPrescriptionForm').dispatchEvent(new Event('submit'));
            
        } catch (error) {
            console.error("Error filling prescription:", error);
            showNotification("Failed to fill prescription: " + error.message, "error");
        }
    });
    
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
    
    // Helper functions
    
    // Show notification
    function showNotification(message, type) {
        const notificationArea = document.getElementById('notificationArea');
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === "error" ? "danger" : type}`;
        notification.innerHTML = message;
        
        notificationArea.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notificationArea.removeChild(notification);
            }, 500);
        }, 5000);
    }
    
    // Get status badge class
    function getStatusClass(status) {
        const statusClasses = [
            "bg-primary", // Created
            "bg-success", // Filled
            "bg-warning", // Expired
            "bg-danger"   // Revoked
        ];
        return statusClasses[status] || "bg-secondary";
    }
    
    // Show specific section and hide others
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
    
    // Update UI based on user role
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
});