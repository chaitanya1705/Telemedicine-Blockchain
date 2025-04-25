

console.log("🧪 consultation.js is loaded!");

// Handle appointment submission
async function handleAppointmentSubmission(event) {
  event.preventDefault();

  const doctorAddress = document.getElementById('doctor-select').value;
  const appointmentDate = document.getElementById('appointment-date').value;
  const appointmentTime = document.getElementById('appointment-time').value;
  const duration = document.getElementById('appointment-duration').value;
  const symptoms = document.getElementById('symptoms').value;

  if (!doctorAddress || !appointmentDate || !appointmentTime || !duration || !symptoms) {
    alert('Please fill all fields');
    return;
  }

  const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  const timestamp = Math.floor(dateTime.getTime() / 1000);

  try {
    console.log("📤 Booking appointment on blockchain...");

    const tx = await consultationInstance.methods.scheduleAppointment(
      doctorAddress,
      timestamp,
      duration,
      symptoms
    ).send({ from: currentAccount });

    console.log("✅ Appointment booked on-chain:", tx);

    alert("Appointment successfully scheduled on blockchain!");

    // Reload appointment tables depending on dashboard
    if (window.location.pathname.includes("doctor-dashboard")) {
      await loadDoctorAppointments();
    } else if (window.location.pathname.includes("patient-dashboard")) {
      await loadPatientAppointments();
    }

    // Reset form and show updated tab
    document.getElementById('appointment-form').reset();
    document.querySelector('.sidebar-menu a[data-tab="appointments"]').click();

  } catch (error) {
    console.error("❌ Error scheduling appointment:", error);
    alert("Failed to schedule appointment.");
  }
}


async function loadPatientAppointments() {
  try {
    const res = await fetch(`http://localhost:5000/api/appointments/patient/${currentAccount}`);
    const appointments = await res.json();
    loadPatientAppointmentsTableFromSQL(appointments);
  } catch (err) {
    console.error("Error loading patient appointments:", err);
  }
}

async function loadDoctorAppointments() {
  try {
    console.log("📡 Fetching appointments for doctor:", currentAccount); // Log 1

    const res = await fetch(`http://localhost:5000/api/appointments/doctor/${currentAccount}`);
    const appointments = await res.json();

    console.log("📋 Appointments received from API:", appointments); // Log 2

    loadDoctorAppointmentsTableFromSQL(appointments);
  } catch (err) {
    console.error("❌ Error loading doctor appointments:", err);
  }
}


function loadPatientAppointmentsTableFromSQL(data) {
  const tableBody = document.querySelector("#appointments-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  data.forEach(appointment => {
    const date = new Date(appointment.timestamp * 1000).toLocaleString();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${appointment.id}</td>
      <td>${appointment.doctorAddress}</td>
      <td>${date}</td>
      <td>${appointment.duration} min</td>
      <td>${appointment.status}</td>
      <td>
         ${appointment.status === 'Scheduled' ? `<button class="btn danger-btn cancel-btn" data-id="${appointment.id}">Cancel</button>` : ''}
      </td>`;
    tableBody.appendChild(row);
  });
  document.querySelectorAll('.cancel-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm("Are you sure you want to cancel this appointment?")) {
        try {
          const response = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Cancelled" })
          });
  
          if (response.ok) {
            alert("Appointment cancelled.");
            await loadPatientAppointments(); // reload the table
          } else {
            const err = await response.json();
            throw new Error(err.error);
          }
        } catch (error) {
          alert("Failed to cancel appointment.");
          console.error("❌ Cancel Error:", error);
        }
      }
    });
  });
  
}

function loadDoctorAppointmentsTableFromSQL(data) {
  const tableBody = document.querySelector("#appointments-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  data.forEach(appointment => {
    const date = new Date(appointment.timestamp * 1000).toLocaleString();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${appointment.id}</td>
      <td>${appointment.patientAddress}</td>
      <td>${date}</td>
      <td>${appointment.duration} min</td>
      <td>${appointment.symptomDescription}</td>
      <td>${appointment.status}</td>
      <td>
        ${appointment.status === 'Scheduled'
          ? `
            <button class="btn success-btn complete-btn" data-id="${appointment.id}">Complete</button>
            <button class="btn danger-btn cancel-btn" data-id="${appointment.id}">Cancel</button>
          `
          : ''}
      </td>`;
    tableBody.appendChild(row);
  });

  // Cancel button logic
  document.querySelectorAll('.cancel-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm("Cancel this appointment?")) {
        try {
          const response = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Cancelled" })
          });

          if (response.ok) {
            alert("Appointment cancelled.");
            await loadDoctorAppointments();
          } else {
            const err = await response.json();
            throw new Error(err.error);
          }
        } catch (error) {
          alert("Failed to cancel.");
          console.error("❌ Cancel error:", error);
        }
      }
    });
  });

  // Complete button logic
document.querySelectorAll('.complete-btn').forEach(button => {
  button.addEventListener('click', async (e) => {
    const id = e.target.getAttribute('data-id');
    if (confirm("Mark this appointment as completed on blockchain?")) {
      try {
        const tx = await consultationInstance.methods.completeAppointment(id).send({ from: currentAccount });
        console.log("✅ Appointment completed on-chain:", tx);
        alert("Appointment marked as completed!");

        await loadDoctorAppointments(); // refresh
      } catch (error) {
        alert("Failed to complete appointment.");
        console.error("❌ Complete error (on-chain):", error);
      }
    }
  });
});

}



function loadDoctorListForAppointment() {
    const doctorSelect = document.getElementById('doctor-select');
    doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
  
    fetch("http://localhost:5000/api/doctors")
      .then(res => res.json())
      .then(doctors => {
        doctors.forEach(doc => {
          const option = document.createElement("option");
          option.value = doc.address;
          option.textContent = `Dr. ${doc.name} - ${doc.specialization}`;
          doctorSelect.appendChild(option);
        });
      })
      .catch(err => {
        console.error("Failed to load doctors:", err);
      });
  }
  
// Load correct data depending on the current dashboard
window.addEventListener('load', () => {
  const waitForAccount = setInterval(() => {
    if (currentAccount) {
      clearInterval(waitForAccount);
      console.log("✅ consultation.js got currentAccount:", currentAccount);

      const path = window.location.pathname;

      if (document.getElementById('appointment-form')) {
        document.getElementById('appointment-form')
          .addEventListener('submit', handleAppointmentSubmission);
        loadDoctorListForAppointment();
      }

      if (path.includes("doctor-dashboard.html")) {
        loadDoctorAppointments();
      }

      if (path.includes("patient-dashboard.html")) {
        loadPatientAppointments();
      }
    } else {
      console.log("⏳ Waiting for currentAccount...");
    }
  }, 200); // check every 200ms
});
