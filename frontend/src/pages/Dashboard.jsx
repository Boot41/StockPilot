import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';

const Dashboard = () => {
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! How can I help you today? Try asking: "What is my current product count?" or "What is electronics stock?"'
    }
  ]);
  const [input, setInput] = useState('');

  // Ref for auto-scrolling the chat container
  const chatContainerRef = useRef(null);
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  // Send message handler
  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: input.trim()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate a bot response after a short delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: `Let me check that for you: "${userMessage.text}"`
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  // Send on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-blue-900 to-gray-900 text-white min-h-screen p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
          
          {/* Wow Moment Animated Welcome Banner */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-lg animate-pulse">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <h2 className="text-2xl font-bold">Welcome to StockPilot!</h2>
                <p className="mt-2 text-lg">Set Your Inventory on Autopilot</p>
              </div>
            </div>
          </div>

          {/* Chat Box Section */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">StockPilot Chat Assistant</h2>
            <div ref={chatContainerRef} className="h-64 overflow-y-auto mb-4 p-2 bg-gray-700 rounded">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-2 ${message.sender === 'bot' ? 'text-blue-300' : 'text-white text-right'}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask StockPilot..."
                className="flex-1 p-2 rounded-l-lg border-none outline-none bg-gray-600 text-white"
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 hover:bg-blue-600 p-2 rounded-r-lg transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
