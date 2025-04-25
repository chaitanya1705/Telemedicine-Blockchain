// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";

contract Authentication {
    UserManagement private userManagement;
    
    // Events
    event LoggedIn(address userAddress, uint256 timestamp);
    
    // Modifiers
    modifier onlyRegisteredUser() {
        require(
            userManagement.isPatient(msg.sender) || userManagement.isDoctor(msg.sender),
            "User not registered"
        );
        _;
    }
    
    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
    }
    
    // Function to authenticate a user
    function login() external onlyRegisteredUser returns (bool) {
        emit LoggedIn(msg.sender, block.timestamp);
        return true;
    }
    
    // Function to check if an address belongs to a doctor
    function isDoctor(address _address) external view returns (bool) {
        return userManagement.isDoctor(_address);
    }
    
    // Function to check if an address belongs to a patient
    function isPatient(address _address) external view returns (bool) {
        return userManagement.isPatient(_address);
    }
}