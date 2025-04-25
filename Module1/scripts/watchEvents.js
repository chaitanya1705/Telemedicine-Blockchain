// watchEvents.js - Real-time sync for Doctors, Patients, Appointments, and Prescriptions

require("dotenv").config();
const Web3 = require("web3");
const mysql = require("mysql2/promise");

// Load ABIs
const UserManagement = require("../build/contracts/UserManagement.json");
const Consultation = require("../build/contracts/Consultation.json");
const Prescription = require("../build/contracts/Prescription.json");

const web3 = new Web3("ws://localhost:7545"); // Must be WebSocket provider

// Load contract addresses from .env
const userManagementAddr = process.env.CONTRACT_USER_MANAGEMENT || "REPLACE_USER_MGMT_ADDRESS";
const consultationAddr = process.env.CONTRACT_CONSULTATION || "REPLACE_CONSULTATION_ADDRESS";
const prescriptionAddr = process.env.CONTRACT_PRESCRIPTION || "REPLACE_PRESCRIPTION_ADDRESS";

const userContract = new web3.eth.Contract(UserManagement.abi, userManagementAddr);
const consultationContract = new web3.eth.Contract(Consultation.abi, consultationAddr);
const prescriptionContract = new web3.eth.Contract(Prescription.abi, prescriptionAddr);

async function startSync() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  console.log("📡 Listening for registration, appointment, and prescription events...");

  // Doctor Registered
  userContract.events.DoctorRegistered({ fromBlock: "latest" })
    .on("data", async (event) => {
      const { doctorAddress, name, specialization, licenseNumber } = event.returnValues;
      console.log("🩺 DoctorRegistered:", name);
      await db.execute(`
        INSERT IGNORE INTO doctors (address, name, specialization, licenseNumber, isVerified)
        VALUES (?, ?, ?, ?, false)
      `, [
        doctorAddress || null,
        name || null,
        specialization || null,
        licenseNumber || null
      ]);
    }).on("error", console.error);
  // Doctor Verified
  userContract.events.DoctorVerified({ fromBlock: "latest" })
    .on("data", async (event) => {
      const { doctorAddress } = event.returnValues;
      console.log("✔️ DoctorVerified:", doctorAddress);
      await db.execute(`
        UPDATE doctors SET isVerified = true WHERE address = ?
      `, [doctorAddress]);
  }).on("error", console.error);

  // Patient Registered
  userContract.events.PatientRegistered({ fromBlock: "latest" })
    .on("data", async (event) => {
      const { patientAddress, name, age, medicalHistoryHash } = event.returnValues;
      console.log("👤 PatientRegistered:", name);
      await db.execute(`
        INSERT IGNORE INTO patients (address, name, age, medicalHistory)
        VALUES (?, ?, ?, ?)
      `, [
        patientAddress || null,
        name || null,
        age || 0,
        medicalHistoryHash || null
      ]);
    }).on("error", console.error);

  // Appointment Scheduled
consultationContract.events.AppointmentScheduled({ fromBlock: "latest" })
.on("data", async (event) => {
  const { appointmentId, doctor, patient, timestamp, duration, symptomDescription } = event.returnValues;
  console.log("📅 AppointmentScheduled:", appointmentId);

  await db.execute(`
    INSERT IGNORE INTO appointments (id, doctorAddress, patientAddress, timestamp, duration, symptomDescription, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
  `, [
    appointmentId || 0,
    doctor || null,
    patient || null,
    timestamp || 0,
    duration || 0,
    symptomDescription || null
  ]);
}).on("error", console.error);

// Appointment Completed
consultationContract.events.AppointmentCompleted({ fromBlock: "latest" })
.on("data", async (event) => {
  const { appointmentId } = event.returnValues;
  console.log("✅ AppointmentCompleted:", appointmentId);

  await db.execute(`
    UPDATE appointments SET status = 'Completed' WHERE id = ?
  `, [appointmentId || 0]);
}).on("error", console.error);

// Appointment Cancelled
consultationContract.events.AppointmentCancelled({ fromBlock: "latest" })
.on("data", async (event) => {
  const { appointmentId } = event.returnValues;
  console.log("❌ AppointmentCancelled:", appointmentId);

  await db.execute(`
    UPDATE appointments SET status = 'Cancelled' WHERE id = ?
  `, [appointmentId || 0]);
}).on("error", console.error);


  // Prescription Issued
  prescriptionContract.events.PrescriptionIssued({ fromBlock: "latest" })
    .on("data", async (event) => {
      const {
        prescriptionId,
        appointmentId,
        doctor,
        patient,
        medicationDetails,
        dosage,
        frequency,
        duration,
        additionalNotes,
        expiryDate,
        signature
      } = event.returnValues;

      console.log("💊 PrescriptionIssued:", prescriptionId);
      await db.execute(`
        INSERT IGNORE INTO prescriptions (
          id, appointmentId, doctorAddress, patientAddress, medicationDetails, dosage,
          frequency, duration, additionalNotes, expiryDate, signature
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?)
      `, [
        prescriptionId || 0,
        appointmentId || 0,
        doctor || null,
        patient || null,
        medicationDetails || null,
        dosage || null,
        frequency || null,
        duration || null,
        additionalNotes || null,
        expiryDate || 0,
        signature || null
      ]);
    }).on("error", console.error);
}

startSync().catch((err) => {
  console.error("❌ Failed to start event listener:", err);
});
