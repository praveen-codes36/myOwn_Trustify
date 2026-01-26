
import { useState, useEffect, useMemo } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  
  // History States
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Source States
  const [sourceUrl, setSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [showSource, setShowSource] = useState(false); // NEW STATE for Right Sidebar

  const sessionId = useMemo(() => Math.random().toString(36).substring(7), []);

  // 1. Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('trustifyHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2. Save search history
  const saveToHistory = (query, response) => {
    const newHistory = [
      { 
        query, 
        response, 
        timestamp: new Date().toLocaleString() 
      },
      ...searchHistory
    ].slice(0, 10); 
    
    setSearchHistory(newHistory);
    localStorage.setItem('trustifyHistory', JSON.stringify(newHistory));
  };

  // 3. Load a search from history
  const loadFromHistory = (historyItem) => {
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

  // 5. Handle Chat Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    const currentMessage = input; 
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await response.json();
      const botResponse = data.reply || data.error || JSON.stringify(data);
      
      setMessages((prev) => [...prev, { role: "assistant", content: botResponse }]);
      saveToHistory(currentMessage, botResponse);

    } catch (error) {
      console.error("Frontend Error:", error);
      const errorMessage = "Error: Could not connect to server.js (Is it running on port 3000?)";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
      saveToHistory(currentMessage, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Handle Add Source
  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    setIsAddingSource(true);
    try {
      const response = await fetch("http://localhost:3000/add-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
        sessionId: sessionId,
      });
      const data = await response.json();
      alert(data.message || data.error);
      setSourceUrl("");
      setShowSource(false); // Close sidebar on success
    } catch (error) {
      alert("Failed to add source.");
    } finally {
      setIsAddingSource(false);
    }
  };

  return (
    <div className="app-wrapper">
      
      {/* --- LEFT SIDEBAR: HISTORY --- */}
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
          <p className="no-history">No search history yet.</p>
        )}
      </div>

      {/* LEFT TOGGLE BUTTON */}
      <button 
        className="history-toggle-btn"
        onClick={() => setShowHistory(!showHistory)}
        title="View search history"
      >
        📜
      </button>


      {/* --- RIGHT SIDEBAR: ADD SOURCE (NEW) --- */}
      <div className={`source-sidebar ${showSource ? 'show' : ''}`}>
        <div className="history-header" style={{ borderBottomColor: 'rgba(255, 100, 100, 0.3)' }}>
          <h3 className="history-title">➕ Add Source</h3>
          <button className="close-history" onClick={() => setShowSource(false)}>✕</button>
        </div>

        <div className="source-content">
          <p className="source-description">
            Paste a URL to a news article or document. Trustify will scrape it, create vectors, and add it to the verified database.
          </p>
          
          <input 
            type="text"
            className="source-input"
            placeholder="https://example.com/article..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          
          <button 
            className="btn-verify" 
            onClick={handleAddSource}
            disabled={isAddingSource}
            style={{ 
              background: 'linear-gradient(135deg, #FF6B6B 0%, #E73C7E 100%)', // Red/Pink theme for this button
              marginTop: '10px'
            }}
          >
            {isAddingSource ? 'Indexing Content...' : 'Add to Database'}
          </button>
        </div>
      </div>

      {/* RIGHT TOGGLE BUTTON (NEW) */}
      <button 
        className="source-toggle-btn"
        onClick={() => setShowSource(!showSource)}
        title="Add Custom Source"
      >
        ➕
      </button>


      {/* --- MAIN CONTENT --- */}
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

        {/* CHAT DISPLAY */}
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
