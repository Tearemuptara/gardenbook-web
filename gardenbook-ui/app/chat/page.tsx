"use client";

import { useState, useEffect } from 'react';

interface Message {
  content: string;
  isUser: boolean;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  userId: string;
  user_timezone?: string;
}

// Default user ID - in a real app, this would come from authentication
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Load timezone from localStorage when the component mounts
  useEffect(() => {
    const storedLocationEnabled = localStorage.getItem('locationEnabled');
    if (storedLocationEnabled === 'true') {
      setLocationEnabled(true);
      const storedTimezone = localStorage.getItem('userTimezone');
      setUserTimezone(storedTimezone);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessage: Message = { content: inputMessage, isUser: true };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format messages for the API
      const apiMessages: ChatMessage[] = messages.concat(newMessage).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // Prepare the request body
      const requestBody: ChatRequestBody = {
        messages: apiMessages,
        userId: DEFAULT_USER_ID
      };

      // Add timezone if available and location is enabled
      if (locationEnabled && userTimezone) {
        requestBody.user_timezone = userTimezone;
      }

      // Call the API
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add assistant message from response
      setMessages(prev => [...prev, {
        content: data.response,
        isUser: false
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      setMessages(prev => [...prev, {
        content: "Sorry, I couldn't connect to the server. Please try again later.",
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900">
      <div className="flex flex-col h-full bg-gray-900 border border-purple-900/50 pr-24">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
          {messages.length === 0 && (
            <div className="flex justify-center items-center h-full text-purple-300/50">
              <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-purple-900/20 max-w-md">
                <h2 className="text-xl font-semibold mb-3">Welcome to Gardenbook Chat</h2>
                <p className="mb-4">Ask me anything about your plants and garden!</p>
                {locationEnabled && userTimezone && (
                  <p className="text-sm text-green-400">
                    Using your timezone: {userTimezone}
                  </p>
                )}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 shadow-lg ${
                  message.isUser
                    ? 'bg-purple-900/80 text-purple-100 border border-purple-800/50'
                    : 'bg-gray-800 text-purple-100 border border-purple-900/30'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 shadow-lg bg-gray-800 text-purple-100 border border-purple-900/30">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your plants..."
              className="flex-1 p-2 border border-purple-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800/50 bg-gray-800 text-purple-100 placeholder-purple-400/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-4 py-2 bg-purple-900/80 text-purple-100 rounded-lg transition-colors border border-purple-800/50 shadow-lg ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-purple-800/80 hover:shadow-purple-900/20'
              }`}
              disabled={isLoading}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 