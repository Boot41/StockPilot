import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';

// Define your API base URL
const API_BASE_URL = 'http://localhost:8000';

const Dashboard = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi there! I'm StockPilot AI. Ask me about:
- Product counts
- Stock levels
- Sales trends
- Revenue metrics
- Recent orders
- Demand forecasts
- Inventory health`
    }
  ]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/`);
      if (!response.ok) {
        const text = await response.text();
        console.error('Fetch error:', response.status, text);
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  };

  const getChatbotResponse = async (userQuery) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: userQuery }
              ]
            }
          ]
        }),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('Error in /chatbot/:', response.status, errText);
        throw new Error('Chatbot API request failed');
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      return 'An error occurred while processing your request.';
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: messages.length + 1, sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsBotTyping(true);

    try {
      // Fetch the chatbot response from the backend
      const botResponse = await getChatbotResponse(userMessage.text);
      
      const botMessage = { id: messages.length + 2, sender: 'bot', text: botResponse.answer || botResponse };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing query:", error);
    }
    setIsBotTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-blue-900 to-gray-900 text-white min-h-screen p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-lg animate-pulse">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <h2 className="text-2xl font-bold">Welcome to StockPilot!</h2>
                <p className="mt-2 text-lg">Set Your Inventory on Autopilot</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">StockPilot AI Assistant</h2>
            <div ref={chatContainerRef} className="h-[250px] overflow-y-auto mb-4 p-4 bg-gray-700 rounded-xl">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 p-3 rounded-xl ${message.sender === 'bot' 
                    ? 'bg-blue-900 text-blue-100' 
                    : 'bg-purple-900 text-white ml-8'}`}
                >
                  {message.text.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                  ))}
                </div>
              ))}
              {isBotTyping && (
                <div className="text-blue-300 italic">
                  StockPilot is analyzing your request...
                </div>
              )}
            </div>
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask StockPilot..."
                className="flex-1 p-3 rounded-l-lg border-none outline-none bg-gray-600 text-white shadow-lg"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:bg-gradient-to-l p-3 rounded-r-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
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
