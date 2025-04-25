// prescription.js - Prescription functionality

// Issue a new prescription
console.log("🧾 prescription.js loaded!");

async function issuePrescription(
    appointmentId,
    medicationDetails,
    dosage,
    frequency,
    duration,
    additionalNotes,
    expiryDate,
    signature
) {
    if (!web3 || !currentAccount || !prescriptionInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        const result = await prescriptionInstance.methods
            .issuePrescription(
                appointmentId,
                medicationDetails,
                dosage,
                frequency,
                duration,
                additionalNotes,
                Math.floor(expiryDate.getTime() / 1000),
                signature
            )
            .send({ from: currentAccount });
        
        console.log("Prescription issued successfully:", result);
        return result.events.PrescriptionIssued.returnValues.prescriptionId;
    } catch (error) {
        console.error("Error issuing prescription:", error);
        return false;
    }
}

// Verify a prescription
async function verifyPrescription(prescriptionId, signature) {
    if (!web3 || !prescriptionInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        return await prescriptionInstance.methods
            .verifyPrescription(prescriptionId, signature)
            .call();
    } catch (error) {
        console.error("Error verifying prescription:", error);
        return false;
    }
}

// Get prescription details
async function getPrescriptionDetails(prescriptionId) {
    if (!web3 || !currentAccount || !prescriptionInstance) {
        console.error("Web3 or contract instance not initialized");
        return null;
    }
    
    try {
        return await prescriptionInstance.methods
            .getPrescriptionDetails(prescriptionId)
            .call({ from: currentAccount });
    } catch (error) {
        console.error("Error getting prescription details:", error);
        return null;
    }
}

// Check if a prescription is valid (not expired)
async function isPrescriptionValid(prescriptionId) {
    if (!web3 || !prescriptionInstance) {
        console.error("Web3 or contract instance not initialized");
        return false;
    }
    
    try {
        return await prescriptionInstance.methods
            .isPrescriptionValid(prescriptionId)
            .call();
    } catch (error) {
        console.error("Error checking prescription validity:", error);
        return false;
    }
}

// Load doctor's issued prescriptions
async function loadDoctorPrescriptionsTable(prescriptionIds) {
    const prescriptionsTable = document.getElementById('prescriptions-table');
    if (!prescriptionsTable) return;
    
    const tableBody = prescriptionsTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    for (const prescriptionId of prescriptionIds) {
        try {
            const details = await getPrescriptionDetails(prescriptionId);
            
            // Create prescription row
            const row = document.createElement('tr');
            
            // Convert timestamps to readable dates
            const issueDate = new Date(details.issueDate * 1000);
            const expiryDate = new Date(details.expiryDate * 1000);
            
            // Get patient name
            const patientDetails = await userManagementInstance.methods
                .getPatientDetails(details.patient)
                .call({ from: currentAccount });
            
            // Check if prescription is valid
            const isValid = await isPrescriptionValid(prescriptionId);
            
            row.innerHTML = `
                <td>${prescriptionId}</td>
                <td>${patientDetails.name}</td>
                <td>${details.medicationDetails}</td>
                <td>${issueDate.toLocaleDateString()}</td>
                <td>${expiryDate.toLocaleDateString()}</td>
                <td>
                    <button class="btn primary-btn view-prescription-btn" data-id="${prescriptionId}">View</button>
                    ${isValid ? '<span class="status-badge valid">Valid</span>' : '<span class="status-badge expired">Expired</span>'}
                </td>
            `;
            
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`Error loading prescription ${prescriptionId}:`, error);
        }
    }
    
    // Add event listeners to buttons
    addPrescriptionButtonListeners();
}
async function loadAppointmentsForDropdown() {
    try {
        const res = await fetch(`http://localhost:5000/api/appointments/doctor/${currentAccount}`);
        const appointments = await res.json();

        const dropdown = document.getElementById('appointment-select');
        dropdown.innerHTML = '<option value="">-- Select an Appointment --</option>';
        console.log("👀 Appointments fetched from API:", appointments);
        appointments.forEach(a => console.log(`📄 Appt #${a.id} - Status: ${a.status}`));
        appointments
            .filter(appt => {
                console.log("🧪 Checking appointment:", appt.id, appt.status);
                return appt.status && appt.status.toLowerCase() === 'completed';
            })
            .forEach(appt => {
                const date = new Date(appt.timestamp * 1000).toLocaleString();
                const option = document.createElement('option');
                option.value = appt.id;
                option.textContent = `#${appt.id} - ${date}`;
                dropdown.appendChild(option);
            });


    } catch (err) {
        console.error("❌ Failed to load appointments for dropdown:", err);
    }
}

// Load patient's prescriptions
async function loadPatientPrescriptionsTable(prescriptionIds) {
    const prescriptionsTable = document.getElementById('prescriptions-table');
    if (!prescriptionsTable) return;
    
    const tableBody = prescriptionsTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    for (const prescriptionId of prescriptionIds) {
        try {
            const details = await getPrescriptionDetails(prescriptionId);
            
            // Create prescription row
            const row = document.createElement('tr');
            
            // Convert timestamps to readable dates
            const issueDate = new Date(details.issueDate * 1000);
            const expiryDate = new Date(details.expiryDate * 1000);
            
            // Get doctor name
            const doctorDetails = await userManagementInstance.methods
                .getDoctorDetails(details.doctor)
                .call({ from: currentAccount });
            
            // Check if prescription is valid
            const isValid = await isPrescriptionValid(prescriptionId);
            
            row.innerHTML = `
                <td>${prescriptionId}</td>
                <td>Dr. ${doctorDetails.name}</td>
                <td>${details.medicationDetails}</td>
                <td>${issueDate.toLocaleDateString()}</td>
                <td>${expiryDate.toLocaleDateString()}</td>
                <td>
                    <button class="btn primary-btn view-prescription-btn" data-id="${prescriptionId}">View</button>
                    ${isValid ? '<span class="status-badge valid">Valid</span>' : '<span class="status-badge expired">Expired</span>'}
                </td>
            `;
            
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`Error loading prescription ${prescriptionId}:`, error);
        }
    }
    
    // Add event listeners to buttons
    addPrescriptionButtonListeners();
}

// Handle prescription submission
async function handlePrescriptionSubmission(event) {
    event.preventDefault();
  
    const appointmentId = document.getElementById('appointment-select').value;
    const medicationDetails = document.getElementById('medication-details').value;
    const dosage = document.getElementById('dosage').value;
    const frequency = document.getElementById('frequency').value;
    const duration = document.getElementById('duration').value;
    const additionalNotes = document.getElementById('additional-notes').value;
    const expiryDateStr = document.getElementById('expiry-date').value;
  
    if (!appointmentId || !medicationDetails || !dosage || !frequency || !duration || !expiryDateStr) {
      alert('Please fill all required fields');
      return;
    }
  
    const expiryDate = new Date(expiryDateStr);
    const nowUnix = Math.floor(Date.now() / 1000);
    const expiryUnix = Math.floor(expiryDate.getTime() / 1000);
  
    console.log("🕒 Now:", nowUnix);
    console.log("📅 Expiry:", expiryUnix);
  
    if (expiryUnix <= nowUnix) {
      alert("❌ Expiry date must be in the future.");
      return;
    }
  
    // Generate digital signature (simplified for now)
    const signature = web3.utils.sha3(
      `${appointmentId}-${medicationDetails}-${dosage}-${currentAccount}-${Date.now()}`
    );
  
    console.log("📤 Submitting prescription for appointment:", appointmentId);
  
    try {
      const prescriptionId = await prescriptionInstance.methods.issuePrescription(
        appointmentId,
        medicationDetails,
        dosage,
        frequency,
        duration,
        additionalNotes,
        expiryUnix,
        signature
      ).send({ from: currentAccount });
  
      console.log("✅ Prescription issued successfully:", prescriptionId);
      alert("Prescription issued successfully!");
  
      // Reload updated data
      const prescriptions = await prescriptionInstance.methods
        .getDoctorPrescriptions()
        .call({ from: currentAccount });
  
      loadDoctorPrescriptionsTable(prescriptions);
      document.getElementById('prescription-form').reset();
      document.querySelector('.sidebar-menu a[data-tab="prescriptions"]').click();
  
    } catch (error) {
      alert("❌ Error issuing prescription. See console for details.");
      console.error("❌ Blockchain Error:", error);
    }
  }
  

// Add event listeners to prescription buttons
function addPrescriptionButtonListeners() {
    const viewButtons = document.querySelectorAll('.view-prescription-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const prescriptionId = button.getAttribute('data-id');
            
            try {
                const details = await getPrescriptionDetails(prescriptionId);
                
                // Create modal to display prescription details
                const modal = document.createElement('div');
                modal.className = 'modal';
                
                // Convert timestamps to readable dates
                const issueDate = new Date(details.issueDate * 1000);
                const expiryDate = new Date(details.expiryDate * 1000);
                
                // Get doctor and patient details
                const doctorDetails = await userManagementInstance.methods
                    .getDoctorDetails(details.doctor)
                    .call({ from: currentAccount });
                
                const patientDetails = await userManagementInstance.methods
                    .getPatientDetails(details.patient)
                    .call({ from: currentAccount });
                
                // Check if prescription is valid
                const isValid = await isPrescriptionValid(prescriptionId);
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Prescription #${prescriptionId}</h2>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="prescription-container">
                                <div class="prescription-header">
                                    <h3>TeleMedicine Blockchain Prescription</h3>
                                    <p class="status ${isValid ? 'valid' : 'expired'}">${isValid ? 'VALID' : 'EXPIRED'}</p>
                                </div>
                                
                                <div class="prescription-details">
                                    <div class="prescription-row">
                                        <div class="prescription-col">
                                            <h4>Doctor Information</h4>
                                            <p>Name: Dr. ${doctorDetails.name}</p>
                                            <p>Specialization: ${doctorDetails.specialization}</p>
                                            <p>License: ${doctorDetails.licenseNumber}</p>
                                        </div>
                                        <div class="prescription-col">
                                            <h4>Patient Information</h4>
                                            <p>Name: ${patientDetails.name}</p>
                                            <p>Age: ${patientDetails.age}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="prescription-medication">
                                        <h4>Medication</h4>
                                        <p><strong>Medication:</strong> ${details.medicationDetails}</p>
                                        <p><strong>Dosage:</strong> ${details.dosage}</p>
                                        <p><strong>Frequency:</strong> ${details.frequency}</p>
                                        <p><strong>Duration:</strong> ${details.duration}</p>
                                        ${details.additionalNotes ? `<p><strong>Additional Notes:</strong> ${details.additionalNotes}</p>` : ''}
                                    </div>
                                    
                                    <div class="prescription-dates">
                                        <p><strong>Issue Date:</strong> ${issueDate.toLocaleDateString()}</p>
                                        <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
                                    </div>
                                    
                                    <div class="prescription-signature">
                                        <p><strong>Doctor's Digital Signature:</strong></p>
                                        <p class="signature-hash">${details.signature.substring(0, 20)}...</p>
                                        <p><strong>Blockchain Verification:</strong> This prescription is stored on the Ethereum blockchain and cannot be altered.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn primary-btn print-btn">Print Prescription</button>
                            <button class="btn secondary-btn close-btn">Close</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Add event listeners for modal buttons
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('.close-btn').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('.print-btn').addEventListener('click', () => {
                    // Open print dialog
                    const prescriptionContent = modal.querySelector('.prescription-container').outerHTML;
                    const printWindow = window.open('', '_blank');
                    
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Prescription #${prescriptionId}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .prescription-container { border: 1px solid #ddd; padding: 20px; max-width: 800px; margin: 0 auto; }
                                    .prescription-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                    .prescription-row { display: flex; gap: 20px; margin-bottom: 20px; }
                                    .prescription-col { flex: 1; }
                                    .prescription-medication, .prescription-dates, .prescription-signature { margin-bottom: 20px; }
                                    .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
                                    .valid { color: green; border: 1px solid green; }
                                    .expired { color: red; border: 1px solid red; }
                                    .signature-hash { font-family: monospace; word-break: break-all; }
                                </style>
                            </head>
                            <body>
                                ${prescriptionContent}
                            </body>
                        </html>
                    `);
                    
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                });
                
                // Close modal when clicking outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
            } catch (error) {
                console.error(`Error viewing prescription ${prescriptionId}:`, error);
                alert('Error retrieving prescription details. Please try again.');
            }
        });
    });
}

// Add CSS for prescription modal
function addPrescriptionModalStyles() {
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background-color: var(--background-color);
            border-radius: var(--border-radius);
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .close-modal {
            font-size: 24px;
            cursor: pointer;
        }
        
        .prescription-container {
            border: 1px solid var(--border-color);
            padding: 20px;
            border-radius: var(--border-radius);
        }
        
        .prescription-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--text-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .prescription-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .prescription-col {
            flex: 1;
            min-width: 250px;
        }
        
        .prescription-medication, .prescription-dates, .prescription-signature {
            margin-bottom: 20px;
        }
        
        .status {
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .valid {
            color: #27ae60;
            border: 1px solid #27ae60;
        }
        
        .expired {
            color: #e74c3c;
            border: 1px solid #e74c3c;
        }
        
        .signature-hash {
            font-family: monospace;
            word-break: break-all;
            background-color: var(--secondary-bg);
            padding: 10px;
            border-radius: 4px;
        }
        
        /* Dark mode specific styles */
        body.dark-mode .modal-content {
            background-color: var(--background-color);
        }
    `;
    
    document.head.appendChild(modalStyles);
}

// Call this function on page load
document.addEventListener('DOMContentLoaded', addPrescriptionModalStyles);
function initAppointmentDropdownLoader() {
    const loadIfVisible = () => {
      const tab = document.querySelector('#new-prescription');
      const select = document.getElementById('appointment-select');
  
      if (currentAccount && tab && tab.classList.contains('active') && select) {
        console.log("🧾 Tab visible. Loading dropdown...");
        loadAppointmentsForDropdown();
      }
    };
  
    // 1. On tab click
    document.querySelector('[data-tab="new-prescription"]')?.addEventListener('click', () => {
      setTimeout(loadIfVisible, 300);
    });
  
    // 2. In case tab is already open on load
    window.addEventListener('load', () => {
      setTimeout(loadIfVisible, 500);
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prescription-form');
    if (form) {
      console.log("✅ Hooking up prescription form submit");
      form.addEventListener('submit', handlePrescriptionSubmission);
    } else {
      console.warn("⚠️ prescription-form not found in DOM");
    }
  });
  
  initAppointmentDropdownLoader();
  