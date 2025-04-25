const UserManagement = artifacts.require("UserManagement");
const Authentication = artifacts.require("Authentication");
const Consultation = artifacts.require("Consultation");
const Prescription = artifacts.require("Prescription");

module.exports = async function(deployer) {
  await deployer.deploy(UserManagement);
  const userManagementInstance = await UserManagement.deployed();
  
  await deployer.deploy(Authentication, userManagementInstance.address);
  
  await deployer.deploy(Consultation, userManagementInstance.address);
  const consultationInstance = await Consultation.deployed();
  
  await deployer.deploy(
    Prescription, 
    userManagementInstance.address, 
    consultationInstance.address
  );
};
