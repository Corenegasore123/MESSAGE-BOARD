// App.jsx
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
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    message: "Connect your wallet to continue"
  });
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
          
          // Set connection status
          setConnectionStatus({
            connected: true,
            message: `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`
          });
          
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = contractABI.networks[networkId];

          if (deployedNetwork) {
            const contractInstance = new web3Instance.eth.Contract(
              contractABI.abi,
              deployedNetwork.address
            );
            setContract(contractInstance);
            fetchMessage(contractInstance);
            showNotification("Wallet connected successfully!", "success");
          } else {
            showNotification("Contract not deployed on the detected network.", "error");
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          showNotification("Failed to connect to MetaMask", "error");
        }
      } else {
        setConnectionStatus({
          connected: false,
          message: "MetaMask not detected. Please install MetaMask extension."
        });
      }
    };

    initWeb3();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Added a flag to track if this is the first fetch
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  const fetchMessage = async (contractInstance) => {
    if (!contractInstance) return;
    
    try {
      setIsLoading(true);
      const message = await contractInstance.methods.getMessage().call();
      if (message && message.trim() !== "") {
        setCurrentMessage(message);
      } else {
        setCurrentMessage("This Is My Initial Message");
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      setCurrentMessage("This Is My Initial Message");
      
      // Only show error notification if it's not the initial fetch
      if (!isInitialFetch) {
        showNotification("Error fetching message from blockchain", "error");
      }
      
      // Reset the flag after first fetch attempt
      if (isInitialFetch) {
        setIsInitialFetch(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMessage = async () => {
    if (!contract || !account || newMessage.trim() === "") return;
    
    try {
      setIsLoading(true);
      
      await contract.methods
        .setMessage(newMessage)
        .send({ from: account });
      
      setCurrentMessage(newMessage);
      setNewMessage("");
      showNotification("Message updated successfully!", "success");
    } catch (error) {
      console.error("Error updating message:", error);
      showNotification("Failed to update message", "error");
      fetchMessage(contract);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setNewMessage("");
    if (contract) {
      // Create a wrapper function that won't show error notifications
      const refreshMessage = async () => {
        try {
          setIsLoading(true);
          const message = await contract.methods.getMessage().call();
          if (message && message.trim() !== "") {
            setCurrentMessage(message);
          } else {
            setCurrentMessage("This Is My Initial Message");
          }
          showNotification("Message refreshed", "info");
        } catch (error) {
          // Silently handle any errors during refresh
          console.error("Error during refresh:", error);
          setCurrentMessage("This Is My Initial Message");
        } finally {
          setIsLoading(false);
        }
      };
      
      refreshMessage();
    }
  };

  const characterCount = newMessage.length;
  const maxLength = 250; // Set a reasonable character limit

  return (
    <div className="app-container">
      <div className="connection-status" data-connected={connectionStatus.connected}>
        <span className="status-indicator"></span>
        {connectionStatus.message}
      </div>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="container">
        <h1 className="title">
          <span className="emoji">📝</span> Blockchain Message Board
        </h1>
        
        <div className="card message-display">
          <h2>Current Message</h2>
          <div className="message-content">
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Loading from blockchain...</span>
              </div>
            ) : (
              <p>{currentMessage}</p>
            )}
          </div>
        </div>
        
        <div className="card input-section">
          <h2>Update Message</h2>
          <div className="input-group">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.slice(0, maxLength))}
              placeholder="What's on your mind? Type your message here..."
              className="input-box"
              disabled={isLoading || !connectionStatus.connected}
            />
            <div className="character-count">
              <span className={characterCount > maxLength * 0.8 ? "near-limit" : ""}>
                {characterCount}
              </span>
              /{maxLength} characters
            </div>
          </div>
          
          <div className="button-container">
            <button 
              onClick={handleUpdateMessage} 
              className="update-btn"
              disabled={isLoading || newMessage.trim() === "" || !connectionStatus.connected}
            >
              {isLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Updating...
                </>
              ) : (
                <>
                  Update Message
                </>
              )}
            </button>
            
            <button 
              onClick={handleRefresh} 
              className="refresh-btn"
              disabled={isLoading || !connectionStatus.connected}
            >
              Refresh
            </button>
          </div>
        </div>
        
        <footer className="app-footer">
          <p>Built with React and Web3 • Powered by Ethereum Blockchain</p>
        </footer>
      </div>
    </div>
  );
}

export default App;