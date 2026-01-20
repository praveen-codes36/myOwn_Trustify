import { useState } from 'react';
import './App.css'; // Imports the animations we just added

function App() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Hello! I am Trustify. Ask me to verify a rumor or news headline." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. UI: Add user message immediately
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    // Store input for API call, then clear
    const currentMessage = input;
    setInput("");
    setIsLoading(true);

    try {
      // 2. LOGIC: Connect to Backend
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await response.json();
      
      // 3. LOGIC: Handle Response
      let botResponse = data.reply || data.error || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "assistant", content: botResponse }]);

    } catch (error) {
      console.error("Frontend Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Could not connect to server.js (Is it running on port 3000?)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Inline Styles for Specific Components ---
  const interactionBoxStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass effect
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '15px',
    color: 'white',
    width: '100%',
    maxWidth: '800px'
  };

  const inputContainerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    color: 'black',
    maxWidth: "600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  };

  return (
    <div className="app-wrapper">
        <div className="container my-3" style={{ maxWidth: '900px' }}>
          
          <h1 className="trustify-title">Trustify 🛡️</h1>
          
          <h2 className="text-center pulse-animation" style={{ color: "#C9E4EB", fontSize: '1.5rem' }}>
            Know what to trust.
          </h2>
          
          <h2 className="text-center pulse-animation" style={{ color: "#00d2ff", fontSize: '1.5rem' }}>
            Before you believe.
          </h2>
          
          <p className="text-center mb-5 pulse-animation" style={{ color: "white", opacity: 0.9 }}>
            Trustify helps you critically evaluate online information using transparent credibility signals.
          </p>

          {/* CHAT HISTORY */}
          <div className="history-list mt-4 mb-5 d-flex flex-column align-items-center">
            {messages.reduce((acc, m, i) => {
              if (m.role === 'user') {
                const nextMessage = messages[i + 1]; 
                acc.push(
                  <div key={i} style={interactionBoxStyle}>
                    <div className="mb-3">
                      <strong style={{ color: '#00d2ff', display: 'block', marginBottom: '5px' }}>You:</strong>
                      <span style={{ fontSize: '1.1rem' }}>{m.content}</span>
                    </div>

                    {nextMessage && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                        <strong style={{ color: '#005eff', display: 'block', marginBottom: '5px' }}>Trustify:</strong>
                        <span style={{ lineHeight: '1.6' }}>
                          {typeof nextMessage.content === 'string' ? nextMessage.content : JSON.stringify(nextMessage.content)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return acc;
            }, [])}
            {isLoading && <div className="text-white spinner-border text-info" role="status"></div>}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSubmit} className="text-center">
            <div style={inputContainerStyle}>
              <label style={{ color: "#C9E4EB", fontWeight: "bold" }}>Type a news headline or rumor...</label>
              
              <input
                className="form-control"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ fontWeight: "bold" }}
                placeholder="Ex: Did the US invade Venezuela?"
              />
              
              <button
                className="btn btn-info w-100"
                type="submit"
                disabled={isLoading}
                style={{ fontWeight: "bold", color: "white", background: "linear-gradient(135deg, #004e92, #00d2ff)", border: "none" }}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}

export default App;
