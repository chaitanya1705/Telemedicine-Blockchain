
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//  Create a MySQL pool for queries
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// 
app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT address, name, specialization FROM doctors WHERE isVerified = true"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching doctors:", err);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// ✅ Fetch all patients
app.get("/api/patients", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ✅ Create a new appointment
app.post("/api/appointments", async (req, res) => {
  const { doctorAddress, patientAddress, timestamp, duration, symptomDescription } = req.body;
  try {
    await pool.query(
      "INSERT INTO appointments (doctorAddress, patientAddress, timestamp, duration, symptomDescription, status) VALUES (?, ?, ?, ?, ?, 'Scheduled')",
      [doctorAddress, patientAddress, timestamp, duration, symptomDescription]
    );
    res.status(201).json({ message: "Appointment created" });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// ✅ Get appointments for a patient
app.get("/api/appointments/patient/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM appointments WHERE patientAddress = ?", [address]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// ✅ Get appointments for a doctor
app.get("/api/appointments/doctor/:doctorAddress", async (req, res) => {
  const { doctorAddress } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE doctorAddress = ?",
      [doctorAddress]
    );
    res.json(rows);
    console.log("🧠 Doctor Appointments Response:", rows);

  } catch (err) {
    console.error("❌ Failed to fetch doctor appointments:", err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }

});


// ✅ Update appointment status (Completed/Cancelled)
app.put("/api/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend API running at http://localhost:${PORT}`);
});
