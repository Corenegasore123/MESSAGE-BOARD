const MessageBoard = artifacts.require("MessageBoard");

module.exports = ((deployer) => {
    deployer.deploy(MessageBoard);
});