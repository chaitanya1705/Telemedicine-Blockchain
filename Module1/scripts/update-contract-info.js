// scripts/update-contract-info.js
const fs = require('fs');
const path = require('path');

// Load contract artifacts
const UserManagement = require('../build/contracts/UserManagement.json');
const Authentication = require('../build/contracts/Authentication.json');
const Consultation = require('../build/contracts/Consultation.json');
const Prescription = require('../build/contracts/Prescription.json');

// Get the network ID
const networkId = process.argv[2] || '5777';

console.log(`Updating contract info for network ID: ${networkId}`);

const addresses = {
    userManagement: UserManagement.networks[networkId]?.address,
    authentication: Authentication.networks[networkId]?.address,
    consultation: Consultation.networks[networkId]?.address,
    prescription: Prescription.networks[networkId]?.address
};

if (!addresses.userManagement || !addresses.authentication || 
    !addresses.consultation || !addresses.prescription) {
    console.error('Error: One or more contract addresses are undefined.');
    console.error('Make sure all contracts are deployed to the network.');
    console.error('Current addresses:', addresses);
    process.exit(1);
}

// Update contract-addresses.js
const addressesContent = `// contract-addresses.js
// Export contract addresses - Auto-generated, do not edit manually!

const contractAddresses = ${JSON.stringify(addresses, null, 4)};

// Make available for import
contractAddresses;`;
fs.writeFileSync(path.join(__dirname, '../public/js/contract-addresses.js'), addressesContent);
console.log("✅ Updated contract-addresses.js");

// Update ABI files
const abiDir = path.join(__dirname, '../public/js/abi');
if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });

function writeAbiFile(name, artifact) {
    const abiContent = `// ${name}ABI.js
// Export ${name} contract ABI - Auto-generated, do not edit manually!

const ${name}ABI = ${JSON.stringify(artifact.abi, null, 4)};

// Make available for import
${name}ABI;`;
    fs.writeFileSync(path.join(abiDir, `${name}ABI.js`), abiContent);
    console.log(`✅ ${name} ABI written`);
}
writeAbiFile("UserManagement", UserManagement);
writeAbiFile("Authentication", Authentication);
writeAbiFile("Consultation", Consultation);
writeAbiFile("Prescription", Prescription);

// Update contract-addresses.node.js
const exportNode = `exports.contractAddresses = ${JSON.stringify(addresses, null, 2)};`;
fs.writeFileSync("public/js/contract-addresses.node.js", exportNode);
console.log("✅ Wrote contract-addresses.node.js for backend");

// Update .env
const envPath = path.join(__dirname, "../.env");
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

function setOrUpdateEnvVar(envContent, key, value) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (envContent.match(regex)) {
        return envContent.replace(regex, `${key}=${value}`);
    } else {
        return envContent.trim() + `\n${key}=${value}`;
    }
}

env = setOrUpdateEnvVar(env, "CONTRACT_USER_MANAGEMENT", addresses.userManagement);
env = setOrUpdateEnvVar(env, "CONTRACT_CONSULTATION", addresses.consultation);
env = setOrUpdateEnvVar(env, "CONTRACT_PRESCRIPTION", addresses.prescription);

fs.writeFileSync(envPath, env);
console.log("✅ .env file updated with contract addresses");