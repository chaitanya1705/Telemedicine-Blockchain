/**
 * This script automatically updates the frontend with the latest contract ABI and address
 * Run this after deploying contracts with Truffle
 */

const fs = require('fs');
const path = require('path');

// Path configurations
const CONTRACT_BUILD_PATH = path.join(__dirname, 'build', 'contracts');
const WEB3_SETUP_PATH = path.join(__dirname, 'src', 'js', 'web3setup.js');
const OUTPUT_PATH = path.join(__dirname, 'src');

// Contract name
const CONTRACT_NAME = 'PrescriptionSystem';

async function updateContractInfo() {
  try {
    console.log('Updating contract information...');
    
    // Read the contract build file
    const contractBuildPath = path.join(CONTRACT_BUILD_PATH, `${CONTRACT_NAME}.json`);
    if (!fs.existsSync(contractBuildPath)) {
      throw new Error(`Contract build file not found at ${contractBuildPath}. Make sure to run truffle compile and truffle migrate first.`);
    }
    
    const contractBuild = JSON.parse(fs.readFileSync(contractBuildPath, 'utf8'));
    
    // Extract ABI and networks
    const { abi, networks } = contractBuild;
    
    if (!abi) {
      throw new Error('ABI not found in contract build file');
    }
    
    // Find the latest deployed network
    const networkIds = Object.keys(networks || {});
    if (networkIds.length === 0) {
      throw new Error('No networks found in contract build file. Make sure to run truffle migrate first.');
    }
    
    // By default, take the most recently deployed network (usually the last one)
    const latestNetworkId = networkIds[networkIds.length - 1];
    const contractAddress = networks[latestNetworkId].address;
    
    if (!contractAddress) {
      throw new Error('Contract address not found for the selected network');
    }
    
    // Create contract JSON file for the frontend
    const contractInfo = {
      abi,
      networks: {
        [latestNetworkId]: {
          address: contractAddress
        }
      }
    };
    
    // Save the contract JSON file
    const outputFilePath = path.join(OUTPUT_PATH, `${CONTRACT_NAME}.json`);
    fs.writeFileSync(outputFilePath, JSON.stringify(contractInfo, null, 2));
    console.log(`Contract JSON saved to ${outputFilePath}`);
    
    // Update web3setup.js file to include network ID information
    if (fs.existsSync(WEB3_SETUP_PATH)) {
      let web3SetupContent = fs.readFileSync(WEB3_SETUP_PATH, 'utf8');
      
      // Check if we need to update the network ID in the file
      const networkIdRegex = /contractJson\.networks\["(\d+)"\]\.address/;
      const match = web3SetupContent.match(networkIdRegex);
      
      if (match) {
        // Replace the network ID with the latest one
        web3SetupContent = web3SetupContent.replace(
          networkIdRegex,
          `contractJson.networks["${latestNetworkId}"].address`
        );
        fs.writeFileSync(WEB3_SETUP_PATH, web3SetupContent);
        console.log(`Updated network ID in ${WEB3_SETUP_PATH}`);
      }
    }
    
    console.log(`
======================================================
🎉 Contract information updated successfully! 🎉
------------------------------------------------------
Contract Name: ${CONTRACT_NAME}
Network ID: ${latestNetworkId}
Contract Address: ${contractAddress}
ABI Items: ${abi.length}
------------------------------------------------------
Frontend files have been updated with the latest contract information.
======================================================
    `);
    
  } catch (error) {
    console.error('❌ Error updating contract information:', error.message);
    process.exit(1);
  }
}

// Execute the update function
updateContractInfo();