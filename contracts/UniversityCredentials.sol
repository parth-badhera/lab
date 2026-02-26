// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UniversityCredentials {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    struct Credential {
        string name;
        string course;
        string hash;
        uint256 issuedOn;
    }

    mapping(address => Credential[]) private credentials;

    event CredentialAdded(address indexed student, string name, string course, uint256 issuedOn);
    event CredentialUpdated(address indexed student, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    function addCredential(
        address student,
        string memory name,
        string memory course,
        string memory docHash
    ) public onlyAdmin {
        credentials[student].push(
            Credential(name, course, docHash, block.timestamp)
        );

        emit CredentialAdded(student, name, course, block.timestamp);
    }

    function getCredentials(address student) public view returns (Credential[] memory) {
        return credentials[student];
    }

    function updateCredential(
        address student,
        uint256 index,
        string memory newHash
    ) public onlyAdmin {
        require(index < credentials[student].length, "Invalid index");
        credentials[student][index].hash = newHash;
        emit CredentialUpdated(student, block.timestamp);
    }
}