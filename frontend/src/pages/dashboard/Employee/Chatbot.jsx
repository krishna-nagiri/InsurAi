import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = ({ employeeData = { name: 'Employee', claims: [], policies: [] } }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your InsurAI assistant. Ask me anything about your claims or policies. 🤖", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Local small talk & greetings
  const getLocalResponse = (input) => {
    if (!input) return null;
    const text = input.toLowerCase().trim();

    if (["hi", "hello", "hey"].includes(text)) 
      return `Hello 👋 ${employeeData.name}! How can I assist you today — claims, policies, or support?`;

    if (text.includes("thank")) 
      return "You're welcome! 😊";

    if (text.includes("bye")) 
      return "Goodbye! Have a great day 👋";

    if (text.includes("how are you")) 
      return "I'm doing great, thank you! How about you?";

    return null; // forward other queries to backend AI
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    const localReply = getLocalResponse(inputValue);
    if (localReply) {
      setMessages(prev => [...prev, { text: localReply, sender: 'bot' }]);
      setLoading(false);
      return;
    }

    // Get JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      setMessages(prev => [...prev, { text: "⚠️ Please log in to use InsurAI.", sender: 'bot' }]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8077/employee/chatbot',
        { message: userMessage.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reply = response?.data?.response || "🤖 Sorry, I didn't catch that.";
      const formattedReply = reply.split("\n").map(line => line.trim()).join("\n");

      setMessages(prev => [...prev, { text: formattedReply, sender: 'bot' }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      let msg = "⚠️ Unable to reach InsurAI. Please try again later.";
      if (error.response?.status === 401) msg = "⚠️ Authentication failed. Please log in.";
      else if (error.response?.status === 403) msg = "⚠️ Access forbidden. Please check your permissions.";
      setMessages(prev => [...prev, { text: msg, sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage(e);
  };

  // Updated styles with employee theme
  const styles = {
    chatIcon: {
      position: 'fixed',
      bottom: '25px',
      right: '25px',
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #1b262c 0%, #206c95 100%)',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(27, 38, 44, 0.3)',
      zIndex: 1000,
      border: '2px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease'
    },
    chatWindow: {
      position: 'fixed',
      bottom: '100px',
      right: '25px',
      width: '380px',
      height: '500px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(27, 38, 44, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000,
      border: '1px solid rgba(32, 108, 149, 0.1)'
    },
    header: {
      background: 'linear-gradient(135deg, #1b262c 0%, #206c95 100%)',
      color: 'white',
      padding: '1.2rem',
      fontWeight: '600',
      textAlign: 'center',
      fontSize: '1.1rem',
      letterSpacing: '0.5px'
    },
    body: {
      flex: 1,
      padding: '1.2rem',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%)'
    },
    message: {
      marginBottom: '1rem',
      maxWidth: '85%',
      padding: '0.8rem 1rem',
      borderRadius: '18px',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
      fontSize: '0.95rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    },
    botMessage: {
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
      color: '#1b262c',
      alignSelf: 'flex-start',
      border: '1px solid rgba(32, 108, 149, 0.1)'
    },
    userMessage: {
      background: 'linear-gradient(135deg, #1b262c 0%, #206c95 100%)',
      color: 'white',
      marginLeft: 'auto',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    footer: {
      padding: '0.8rem',
      borderTop: '1px solid rgba(32, 108, 149, 0.1)',
      background: 'white'
    },
    form: {
      display: 'flex',
      gap: '0.6rem',
      alignItems: 'center'
    },
    input: {
      flex: 1,
      padding: '0.8rem 1rem',
      border: '1px solid rgba(32, 108, 149, 0.2)',
      borderRadius: '24px',
      outline: 'none',
      fontSize: '0.95rem',
      background: '#f8fafc',
      transition: 'all 0.3s ease',
      color: '#1b262c', // Fixed: Added text color
      fontFamily: 'inherit'
    },
    button: {
      padding: '0.8rem 1.2rem',
      border: 'none',
      background: 'linear-gradient(135deg, #1b262c 0%, #206c95 100%)',
      color: 'white',
      borderRadius: '24px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 6px rgba(27, 38, 44, 0.2)'
    },
    loading: {
      fontStyle: 'italic',
      color: '#206c95',
      marginBottom: '1rem',
      padding: '0.8rem',
      background: 'rgba(32, 108, 149, 0.1)',
      borderRadius: '12px',
      textAlign: 'center',
      fontSize: '0.9rem'
    }
  };

  return (
    <>
      <div 
        style={styles.chatIcon} 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(27, 38, 44, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(27, 38, 44, 0.3)';
        }}
      >
        {isOpen ? '✕' : '💬'}
      </div>

      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            🎨 InsurAI Assistant
          </div>
          <div style={styles.body} ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex' }}>
                <div style={{ 
                  ...styles.message, 
                  ...(msg.sender === 'bot' ? styles.botMessage : styles.userMessage) 
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.loading}>
                🎨 InsurAI is thinking...
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <form onSubmit={handleSendMessage} style={styles.form}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.input}
                placeholder="Ask about claims, policies..."
                onFocus={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#206c95';
                  e.target.style.boxShadow = '0 0 0 2px rgba(32, 108, 149, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = 'rgba(32, 108, 149, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button 
                type="submit" 
                style={styles.button}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 10px rgba(27, 38, 44, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 6px rgba(27, 38, 44, 0.2)';
                  }
                }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;