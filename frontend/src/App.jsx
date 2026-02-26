import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { CONTRACT_ADDRESS } from "./config";

const HARDHAT_CHAIN_ID = "0x7A69"; // 31337 in hex

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [studentAddress, setStudentAddress] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [hash, setHash] = useState("");
  const [credentials, setCredentials] = useState([]);
  const [events, setEvents] = useState([]);
  const [network, setNetwork] = useState("");

  // 🔥 Force Hardhat Network + Connect Wallet (FIXES YOUR ISSUE)
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
      }

      // Check current chain
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      // If not Hardhat (31337), switch automatically
      if (currentChainId !== HARDHAT_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: HARDHAT_CHAIN_ID }],
          });
        } catch (switchError) {
          // If Hardhat network not added, add it automatically
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: HARDHAT_CHAIN_ID,
                  chainName: "Hardhat Localhost",
                  rpcUrls: ["http://127.0.0.1:8545"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
          } else {
            console.error("Network switch failed:", switchError);
            alert("Please switch to Hardhat Localhost network");
            return;
          }
        }
      }

      // Request account AFTER correct network
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const networkData = await provider.getNetwork();
      setNetwork(`Chain ID: ${networkData.chainId}`);

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      setAccount(accounts[0]);
      setContract(contractInstance);
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Connection failed. Check Hardhat node & MetaMask network.");
    }
  };

  // 🛠 Admin: Add Credential
  const addCredential = async () => {
    try {
      if (!contract) {
        alert("Connect wallet first");
        return;
      }

      if (!studentAddress || !name || !course || !hash) {
        alert("Fill all fields");
        return;
      }

      const tx = await contract.addCredential(
        studentAddress,
        name,
        course,
        hash
      );

      await tx.wait();
      alert("Credential Added Successfully!");
    } catch (error) {
      console.error("Add credential error:", error);
      alert("Transaction failed (Are you using Admin account?)");
    }
  };

  // 📄 Student: Fetch Credentials
  const getCredentials = async () => {
    try {
      if (!contract) {
        alert("Connect wallet first");
        return;
      }

      if (!studentAddress) {
        alert("Enter student address");
        return;
      }

      const data = await contract.getCredentials(studentAddress);
      setCredentials(data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Error fetching credentials");
    }
  };

  // 📢 Event Listener (Audit Trail - Required in Lab)
  useEffect(() => {
    if (!contract) return;

    const handleAdded = (student, name, course) => {
      setEvents((prev) => [
        ...prev,
        `Credential Added → ${name} (${course}) for ${student}`,
      ]);
    };

    const handleUpdated = (student, timestamp) => {
      setEvents((prev) => [
        ...prev,
        `Credential Updated → ${student} at ${new Date(
          Number(timestamp) * 1000
        ).toLocaleString()}`,
      ]);
    };

    contract.on("CredentialAdded", handleAdded);
    contract.on("CredentialUpdated", handleUpdated);

    return () => {
      contract.off("CredentialAdded", handleAdded);
      contract.off("CredentialUpdated", handleUpdated);
    };
  }, [contract]);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🎓 University Credentials DApp (Hardhat Localhost)</h1>

      {/* Wallet Section */}
      <button onClick={connectWallet}>🔗 Connect MetaMask</button>
      <p><b>Connected Account:</b> {account || "Not Connected"}</p>
      <p><b>Network:</b> {network}</p>

      <hr />

      {/* Admin Panel */}
      <h2>🛠 Admin Panel (Add Credential)</h2>
      <input
        placeholder="Student Address"
        onChange={(e) => setStudentAddress(e.target.value)}
      /><br /><br />
      <input
        placeholder="Student Name"
        onChange={(e) => setName(e.target.value)}
      /><br /><br />
      <input
        placeholder="Course"
        onChange={(e) => setCourse(e.target.value)}
      /><br /><br />
      <input
        placeholder="Document Hash"
        onChange={(e) => setHash(e.target.value)}
      /><br /><br />
      <button onClick={addCredential}>➕ Add Credential</button>

      <hr />

      {/* Student Dashboard */}
      <h2>📄 Student Dashboard (View Credentials)</h2>
      <input
        placeholder="Enter Student Address"
        onChange={(e) => setStudentAddress(e.target.value)}
      />
      <button onClick={getCredentials}>📥 Get Credentials</button>

      <ul>
        {credentials.length === 0 ? (
          <p>No credentials found</p>
        ) : (
          credentials.map((cred, index) => (
            <li key={index}>
              <b>Name:</b> {cred.name} | <b>Course:</b> {cred.course} |{" "}
              <b>Hash:</b> {cred.hash}
            </li>
          ))
        )}
      </ul>

      <hr />

      {/* Event Logs (Auditability - Lab Requirement) */}
      <h2>📢 Event Logs (Audit Trail)</h2>
      <ul>
        {events.length === 0 ? (
          <p>No events yet</p>
        ) : (
          events.map((event, index) => <li key={index}>{event}</li>)
        )}
      </ul>
    </div>
  );
}

export default App;