// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Consultation {
    uint256 public appointmentCounter;

    enum AppointmentStatus { Scheduled, Completed, Cancelled }

    struct Appointment {
        uint256 id;
        address doctor;
        address patient;
        uint256 timestamp;
        uint256 duration;
        string symptomDescription;
        AppointmentStatus status;
    }

    mapping(uint256 => Appointment) public appointments;
    mapping(address => uint256[]) public doctorAppointments;
    mapping(address => uint256[]) public patientAppointments;

    event AppointmentScheduled(
        uint256 appointmentId,
        address doctor,
        address patient,
        uint256 timestamp,
        uint256 duration,
        string symptomDescription
    );

    event AppointmentCompleted(uint256 appointmentId);
    event AppointmentCancelled(uint256 appointmentId);

    function scheduleAppointment(
        address doctor,
        uint256 timestamp,
        uint256 duration,
        string memory symptomDescription
    ) public {
        appointmentCounter++;
        appointments[appointmentCounter] = Appointment(
            appointmentCounter,
            doctor,
            msg.sender,
            timestamp,
            duration,
            symptomDescription,
            AppointmentStatus.Scheduled
        );

        doctorAppointments[doctor].push(appointmentCounter);
        patientAppointments[msg.sender].push(appointmentCounter);

        emit AppointmentScheduled(
            appointmentCounter,
            doctor,
            msg.sender,
            timestamp,
            duration,
            symptomDescription
        );
    }

    function completeAppointment(uint256 appointmentId) public {
        require(
            msg.sender == appointments[appointmentId].doctor,
            "Only the doctor can mark as completed"
        );
        appointments[appointmentId].status = AppointmentStatus.Completed;
        emit AppointmentCompleted(appointmentId);
    }

    function cancelAppointment(uint256 appointmentId) public {
        require(
            msg.sender == appointments[appointmentId].patient || msg.sender == appointments[appointmentId].doctor,
            "Only the patient or doctor can cancel"
        );
        appointments[appointmentId].status = AppointmentStatus.Cancelled;
        emit AppointmentCancelled(appointmentId);
    }

    function getAppointmentDetails(uint256 appointmentId) public view returns (
        address doctor,
        address patient,
        uint256 timestamp,
        uint256 duration,
        string memory symptomDescription,
        AppointmentStatus status
    ) {
        Appointment memory appt = appointments[appointmentId];
        return (
            appt.doctor,
            appt.patient,
            appt.timestamp,
            appt.duration,
            appt.symptomDescription,
            appt.status
        );
    }

    function getDoctorAppointments() public view returns (uint256[] memory) {
        return doctorAppointments[msg.sender];
    }

    function getPatientAppointments() public view returns (uint256[] memory) {
        return patientAppointments[msg.sender];
    }
}