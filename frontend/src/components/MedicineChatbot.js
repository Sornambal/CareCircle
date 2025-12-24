import React, { useState, useEffect, useRef } from 'react';
import './MedicineChatbot.css';

const MedicineChatbot = ({ elderlyId }) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);

  console.log('MedicineChatbot rendered with elderlyId:', elderlyId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error, event);
    setIsListening(false);
    
    // Don't show error messages for common non-critical errors
    if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'audio-capture') {
      const errorMessage = { 
        type: 'bot', 
        text: `Speech error: ${event.error}. Please check microphone permissions or use the text input below.` 
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const sendMessage = async (questionText) => {
    if (!questionText.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: questionText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Check if elderlyId is available
    if (!elderlyId) {
      const errorMessage = { 
        type: 'bot', 
        text: 'Please log in again to use the chatbot.' 
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    // Send to backend
    try {
      console.log('Sending to backend:', { question: questionText, elderlyId });
      
      const response = await fetch('http://localhost:5000/api/chat/medicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          elderlyId: elderlyId,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        const botMessage = { type: 'bot', text: data.answer };
        setMessages((prev) => [...prev, botMessage]);

        // Speak the response
        speakText(data.answer);
      } else {
        const errorMessage = { 
          type: 'bot', 
          text: data.message || 'Sorry, I could not understand. Please try again.' 
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        type: 'bot', 
        text: 'Sorry, something went wrong. Please check if the backend server is running.' 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechResult = async (event) => {
    const transcript = event.results[0][0].transcript;
    await sendMessage(transcript);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        const errorMessage = { 
          type: 'bot', 
          text: 'Could not start microphone. Please refresh and allow microphone access.' 
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
    } else {
      console.error('Speech recognition not supported');
    }
  }, []);

  const speakText = (text) => {
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.8; // Slower rate for elderly users
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    // Clear old messages when opening
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].text.includes('could not hear')) {
      setMessages([]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleSendClick = () => {
    sendMessage(inputText);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button 
        className="chatbot-toggle" 
        onClick={toggleChatbot}
        title="Medicine Assistant"
        aria-label="Open medicine chatbot"
      >
        💊
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Medicine Assistant</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {messages.length > 0 && (
                <button 
                  className="clear-btn" 
                  onClick={clearMessages}
                  title="Clear chat"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: '18px',
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              )}
              <button className="close-btn" onClick={toggleChatbot}>
                ×
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 Hello! I'm your medicine assistant.</p>
                <p>You can type your question or use voice input.</p>
                <p className="example-text">
                  Examples:<br />
                  • When should I take my medicine?<br />
                  • Should I take it before or after food?<br />
                  • Which medicine is scheduled now?
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-controls">
            <div className="input-container">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                className="text-input"
                disabled={isLoading || isSpeaking}
              />
              <button
                className="send-btn"
                onClick={handleSendClick}
                disabled={!inputText.trim() || isLoading || isSpeaking}
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
            
            <div className="voice-controls">
              {isSpeaking && (
                <button className="stop-speaking-btn" onClick={stopSpeaking}>
                  🔇 Stop Speaking
                </button>
              )}

              {!isSpeaking && (
                <button
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isSpeaking || isLoading}
                  style={{ fontSize: '14px', padding: '12px 16px' }}
                >
                  {isListening ? '🎤 Listening...' : '🎤 Speak'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicineChatbot;
