import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
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


  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    setIsAddingSource(true);
    try {
      const response = await fetch("http://localhost:3000/add-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
     });
      const data = await response.json();
      alert(data.message || data.error);
      setSourceUrl("");
    }catch (error) {
      alert("Failed to add source.");
    } finally {
      setIsAddingSource(false);
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


          {/* ADD SOURCE SECTION */}
{/* <div className="source-manager" style={{ 
  marginBottom: '40px', 
  padding: '25px', 
  background: 'rgba(255,255,255,0.1)', // Slightly brighter background for the container
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  textAlign: 'center'
}}>
  <h4 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
    <span style={{ fontSize: '1.2rem' }}>➕</span> Add Custom Source to Database
  </h4>
  
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <input 
      type="text"
      className="form-control"
      placeholder="Paste a URL (e.g., https://example.com/news)"
      value={sourceUrl}
      onChange={(e) => setSourceUrl(e.target.value)}
      style={{ 
        width: '100%', 
        padding: '14px 15px', 
        borderRadius: '30px', // Rounded edges to match your "Add Source" button
        border: '1px solid rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Solid light background so you can see it
        color: '#333',
        fontSize: '1rem',
        outline: 'none'
      }}
    />
    <button 
      className="btn-verify" 
      onClick={handleAddSource}
      disabled={isAddingSource}
      style={{ 
        width: '100%',
        padding: '14px',
        borderRadius: '30px',
        fontWeight: 'bold',
        cursor: isAddingSource ? 'not-allowed' : 'pointer',
        backgroundColor: '#6e57e0', // Adjust this color to match your theme
        color: 'white',
        border: 'none'
      }}
    >
      {isAddingSource ? '⏳ Indexing Content...' : 'Add Source'}
    </button>
  </div>
</div> */}


      {/* WRAPPER TO POSITION ON THE RIGHT */}
<div className="right-sidebar-container" style={{
  position: 'fixed',
  top: '5px', // Adjust based on your logo height
  right: '20px',
  width: '260px', // Narrower width
  zIndex: 100,
  animation: 'slideInRight 0.8s ease-out'
}}>
  <div className="source-manager" style={{ 
    padding: '20px', 
    background: 'rgba(255,255,255,0.1)', 
    borderRadius: '20px',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.2)',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '300px' // Increased height
  }}>
    <h4 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.4' }}>
      <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '8px' }}>➕</span> 
      Add Custom Source
    </h4>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1, justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textAlign: 'left', margin: '0 5px' }}>
        Paste URL to index:
      </p>
      <input 
        type="text"
        className="form-control"
        placeholder="https://..."
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '12px', 
          borderRadius: '12px', 
          border: 'none',
          backgroundColor: 'white',
          color: '#333',
          fontSize: '0.9rem'
        }}
      />
      <button 
        className="btn-verify" 
        onClick={handleAddSource}
        disabled={isAddingSource}
        style={{ 
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          fontWeight: 'bold',
          cursor: isAddingSource ? 'not-allowed' : 'pointer',
          backgroundColor: '#6e57e0',
          color: 'white',
          border: 'none',
          marginTop: 'auto' // Pushes button to bottom
        }}
      >
        {isAddingSource ? 'Indexing...' : 'Add Source'}
      </button>
    </div>
  </div>
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