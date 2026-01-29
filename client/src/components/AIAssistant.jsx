import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function AIAssistant({ aiAdvice }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Convert markdown to safe HTML
  const renderMarkdown = (markdownText) => {
    if (!markdownText) return '';
    try {
      // Use marked synchronously
      const rawHtml = marked(markdownText);
      return DOMPurify.sanitize(rawHtml);
    } catch (error) {
      console.error('Markdown rendering error:', error);
      // Fallback to plain text if markdown parsing fails
      return DOMPurify.sanitize(markdownText.replace(/\n/g, '<br>'));
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      console.log('Sending message to chatbot:', userMessage);

      const response = await fetch('/api/gemini-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userMessage,
          context: true
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.answer) {
        console.log('Creating AI message with content length:', data.answer.length);
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.answer,
          timestamp: new Date(),
          model: data.model
        };
        console.log('Adding AI message to state');
        setMessages(prev => [...prev, aiMessage]);
        console.log('AI message added successfully');
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      let errorMsg = 'Sorry, I encountered an error. ';

      if (error.message.includes('Failed to fetch')) {
        errorMsg += 'Cannot connect to the server. Please ensure the backend is running on port 3000.';
      } else if (error.message.includes('Gemini')) {
        errorMsg += 'The Gemini API is not configured. Please add GEMINI_API_KEY to the backend .env file.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: errorMsg,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  return (
    <div id="aiAssistantContent" style={{ display: 'block' }}>
      {/* AI Recommendations Section */}
      {aiAdvice && (
        <div className="section-card" style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <h2><i className="fa-solid fa-lightbulb"></i> AI-Powered Recommendations</h2>
          </div>
          <div
            className="ai-recommendations-content"
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(aiAdvice) }}
          />
        </div>
      )}

      {/* Chatbot Section */}
      <div className="section-card">
        <div className="section-header">
          <h2><i className="fa-solid fa-robot"></i> AI Assistant Chatbot</h2>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: '8px 0 0 0' }}>
            Ask me anything about AWS cost optimization, your infrastructure, or cloud best practices
          </p>
        </div>

        {/* Chat Messages */}
        <div
          className="chat-messages"
          style={{
            height: '400px',
            overflowY: 'auto',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <i className="fa-solid fa-comments" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              <p style={{ margin: 0 }}>Start a conversation! Ask me about:</p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                width: '100%',
                maxWidth: '600px'
              }}>
                <button
                  onClick={() => setInputMessage('How can I reduce my AWS costs?')}
                  style={{
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  💰 Reduce AWS costs
                </button>
                <button
                  onClick={() => setInputMessage('What are Reserved Instances?')}
                  style={{
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  📊 Reserved Instances
                </button>
                <button
                  onClick={() => setInputMessage('Best practices for EC2 optimization')}
                  style={{
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  ⚡ EC2 optimization
                </button>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.3s ease-in'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.type === 'user'
                      ? 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)'
                      : message.type === 'error'
                        ? '#fee'
                        : 'white',
                    color: message.type === 'user' ? 'white' : '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}
                >
                  {message.type === 'ai' && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#FF9900',
                      marginBottom: '6px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="fa-solid fa-robot"></i>
                      AI Assistant {message.model && `(${message.model})`}
                    </div>
                  )}
                  {message.type === 'user' && (
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.9,
                      marginBottom: '6px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="fa-solid fa-user"></i>
                      You
                    </div>
                  )}
                  <div
                    className="message-content"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.type === 'ai' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    marginTop: '6px',
                    textAlign: 'right'
                  }}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-robot" style={{ color: '#FF9900' }}></i>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about AWS cost optimization..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '1rem',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#FF9900'}
            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '12px 24px',
              background: inputMessage.trim() && !isLoading
                ? 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)'
                : '#dee2e6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              minHeight: '50px'
            }}
            onMouseOver={(e) => {
              if (inputMessage.trim() && !isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 153, 0, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Thinking...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
