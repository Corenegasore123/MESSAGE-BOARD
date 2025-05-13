import React, { useState, useEffect } from "react";
import Web3 from "web3";
import contractABI from "./MessageBoard.json";
import "./styles.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("This Is My Initial Message");
  const [newMessage, setNewMessage] = useState("");
  const [account, setAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = contractABI.networks[networkId];

          if (deployedNetwork) {
            const contractInstance = new web3Instance.eth.Contract(
              contractABI.abi,
              deployedNetwork.address
            );
            setContract(contractInstance);
            fetchMessage(contractInstance);
          } else {
            console.error("Contract not deployed on the detected network.");
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.error("MetaMask not detected.");
      }
    };

    initWeb3();
  }, []);

  const fetchMessage = async (contractInstance) => {
    if (!contractInstance) return;
    
    try {
      setCurrentMessage("Loading.......");
      const message = await contractInstance.methods.getMessage().call();
      if (message && message.trim() !== "") {
        setCurrentMessage(message);
      } else {
        setCurrentMessage("This Is My Initial Message");
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      setCurrentMessage("This Is My Initial Message");
    }
  };

  const handleUpdateMessage = async () => {
    if (!contract || !account || newMessage.trim() === "") return;
    
    try {
      setIsLoading(true);
      setCurrentMessage("Loading.......");
      
      await contract.methods
        .setMessage(newMessage)
        .send({ from: account });
      
      setCurrentMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error updating message:", error);
      fetchMessage(contract);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setNewMessage("");
  };

  return (
    <div className="container">
      <h1 className="title">🎮 Blockchain Message Board</h1>
      <div className="message-display">
        <h2>Current Message: {currentMessage}</h2>
      </div>
      
      <div className="input-group">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter new message"
          className="input-box"
          disabled={isLoading}
        />
        
        <div className="button-container">
          <button 
            onClick={handleUpdateMessage} 
            className="update-btn"
            disabled={isLoading || newMessage.trim() === ""}
          >
            Update Message
          </button>
          
          <button 
            onClick={handleRefresh} 
            className="refresh-btn"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;