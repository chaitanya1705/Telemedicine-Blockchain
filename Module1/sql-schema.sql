-- doctors table
CREATE TABLE IF NOT EXISTS doctors (
  address VARCHAR(42) PRIMARY KEY,
  name VARCHAR(100),
  specialization VARCHAR(100),
  isVerified BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- patients table
CREATE TABLE IF NOT EXISTS patients (
  address VARCHAR(42) PRIMARY KEY,
  name VARCHAR(100),
  age INT,
  medicalHistory TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
