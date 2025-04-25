const PrescriptionSystem = artifacts.require("PrescriptionSystem");

module.exports = function(deployer) {
  deployer.deploy(PrescriptionSystem);
};