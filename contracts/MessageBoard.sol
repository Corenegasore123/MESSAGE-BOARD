// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageBoard {
    string private message;

    // Function to set the message
    function setMessage(string memory newMessage) public {
        message = newMessage;
    }

    // Function to get the message
    function getMessage() public view returns (string memory) {
        return message;
    }
}