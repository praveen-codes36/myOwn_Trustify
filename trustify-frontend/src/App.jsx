import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 1. Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('trustifyHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2. Save search history to localStorage
  // Now accepts both the user's query and the AI's response
  const saveToHistory = (query, response) => {
    const newHistory = [
      { 
        query, 
        response, // Store the answer here
        timestamp: new Date().toLocaleString() 
      },
      ...searchHistory
    ].slice(0, 10); // Keep only last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('trustifyHistory', JSON.stringify(newHistory));
  };

  // 3. Load a search from history
  const loadFromHistory = (historyItem) => {
    // This immediately shows the old conversation in the chat window
    setMessages([
      { role: "user", content: historyItem.query },
      { role: "assistant", content: historyItem.response }
    ]);
    
    setShowHistory(false);
  };

  // 4. Clear all history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('trustifyHistory');
    setShowHistory(false);
  };

  // 5. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Show user message immediately
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    const currentMessage = input; 
    setInput("");
    setIsLoading(true);

    // Note: We DO NOT save to history here yet. We wait for the result.

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await response.json();
      
      // Extract the correct response string
      const botResponse = data.reply || data.error || JSON.stringify(data);
      
      // Update Chat UI
      setMessages((prev) => [...prev, { role: "assistant", content: botResponse }]);

      // SUCCESS: Save Query + Real Response to history
      saveToHistory(currentMessage, botResponse);

    } catch (error) {
      console.error("Frontend Error:", error);
      
      const errorMessage = "Error: Could not connect to server.js (Is it running on port 3000?)";
      
      // Update Chat UI with Error
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);

      // ERROR: Save Query + Error Message to history so user knows it failed
      saveToHistory(currentMessage, errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      {/* History Sidebar */}
      <div className={`history-sidebar ${showHistory ? 'show' : ''}`}>
        <div className="history-header">
          <h3 className="history-title">📋 Search History</h3>
          <button className="close-history" onClick={() => setShowHistory(false)}>✕</button>
        </div>
        
        {searchHistory.length > 0 ? (
          <>
            <ul className="history-items">
              {searchHistory.map((item, idx) => (
                <li key={idx} className="history-item">
                  <div className="history-item-content">
                    <p className="history-query">{item.query}</p>
                    <span className="history-time">{item.timestamp}</span>
                  </div>
                  <button 
                    className="history-use-btn"
                    // IMPORTANT FIX: Passing the whole 'item' object, not just the query string
                    onClick={() => loadFromHistory(item)}
                    title="Load this conversation"
                  >
                    ↻
                  </button>
                </li>
              ))}
            </ul>
            <button className="clear-history-btn" onClick={clearHistory}>
              🗑️ Clear History
            </button>
          </>
        ) : (
          <p className="no-history">No search history yet. Start verifying facts!</p>
        )}
      </div>

      {/* History Toggle Button */}
      <button 
        className="history-toggle-btn"
        onClick={() => setShowHistory(!showHistory)}
        title="View search history"
      >
        📜
      </button>

      <div className="container" style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
        
        {/* Logo + Title Section */}
        <div className="logo-title-section">
          <img 
            src="https://png.pngtree.com/png-vector/20250422/ourmid/pngtree-blue-shield-badge-clipart-illustration-png-image_16042877.png" 
            alt="Trustify Logo" 
            className="logo-image-inline"
            loading="lazy"
  
          />
          <h1 className="trustify-title">TRUSTIFY</h1>
        </div>
        
        <h2 className="pulse-animation" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
          Know what to trust.
        </h2>
        
        <h2 className="pulse-animation" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
          Before you believe.
        </h2>
        
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: '1.1rem', marginBottom: '50px', lineHeight: '1.8', animation: 'slideInUp 1s ease-out 0.3s both', maxWidth: '700px', margin: '0 auto 50px' }}>
          Trustify helps you critically evaluate online information using transparent credibility signals. Verify rumors, fact-check headlines, and find the truth with AI-powered analysis.
        </p>

        {/* CHAT HISTORY */}
        <div className="history-list" style={{ marginBottom: '50px', width: '100%' }}>
          {messages.map((m, i) => (
            m.role === 'system' ? (
              <div key={i} style={{ marginBottom: '20px', animation: 'slideInUp 0.6s ease-out' }}>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
                <div className={`message-bubble ${m.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  {m.content}
                </div>
              </div>
            )
          ))}
          {isLoading && (
            <div style={{ textAlign: 'center', marginTop: '30px', animation: 'fadeIn 0.5s ease-out' }}>
              <div className="spinner-border text-white" role="status" style={{ width: '40px', height: '40px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block' }}></div>
              <p style={{ color: 'white', marginTop: '15px', fontWeight: 500 }}>Verifying information...</p>
            </div>
          )}
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="input-wrapper">
          <div className="input-container">
            <label>Enter a news headline or rumor to verify:</label>
            
            <input
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: Did the US land on the moon?"
            />
            
            <button
              className="btn-verify"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Claim'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '80px', marginBottom: '40px', opacity: 0.8, animation: 'fadeIn 1.5s ease-out 0.8s both' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', letterSpacing: '1px' }}>
            Trusted by thousands | Powered by AI | 100% Secure
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;