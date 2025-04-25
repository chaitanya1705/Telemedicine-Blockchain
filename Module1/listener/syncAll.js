// syncAll.js - Bulk sync from blockchain to SQL using safe UPSERT (no REPLACE)

require("dotenv").config();
const Web3 = require("web3");
const mysql = require("mysql2/promise");
const UserManagement = require("../build/contracts/UserManagement.json");

const web3 = new Web3("http://localhost:7545");

const contract = new web3.eth.Contract(
  UserManagement.abi,
  process.env.CONTRACT_USER_MANAGEMENT
);

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log("✅ Connected to SQL DB");

  const doctorEvents = await contract.getPastEvents("DoctorRegistered", {
    fromBlock: 0,
    toBlock: "latest",
  });

  for (const event of doctorEvents) {
    const { doctorAddress, name, specialization, licenseNumber } = event.returnValues;
    console.log("🩺 Sync doctor:", name);

    await db.execute(
      `INSERT INTO doctors (address, name, specialization, licenseNumber, isVerified)
       VALUES (?, ?, ?, ?, false)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         specialization = VALUES(specialization),
         licenseNumber = VALUES(licenseNumber)`
      ,
      [
        doctorAddress || null,
        name || null,
        specialization || null,
        licenseNumber || null
      ]
    );
  }

  const patientEvents = await contract.getPastEvents("PatientRegistered", {
    fromBlock: 0,
    toBlock: "latest",
  });

  for (const event of patientEvents) {
    const { patientAddress, name, age, medicalHistoryHash } = event.returnValues;
    console.log("👤 Sync patient:", name);

    await db.execute(
      `INSERT INTO patients (address, name, age, medicalHistory)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         age = VALUES(age),
         medicalHistory = VALUES(medicalHistory)`
      ,
      [
        patientAddress || null,
        name || null,
        age || 0,
        medicalHistoryHash || null
      ]
    );
  }

  console.log("✅ Sync complete.");
  await db.end();
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
});