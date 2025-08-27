import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [context, setContext] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Simple speech recognition function
  const startSimpleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setMessages((prev) => [...prev, { text: 'Speech recognition not supported. Please use Chrome browser.', sender: 'bot' }]);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setMessages((prev) => [...prev, { text: '🎤 Listening...', sender: 'system' }]);
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setMessages((prev) => prev.filter(msg => msg.text !== '🎤 Listening...'));
      setInput(result);
      setIsListening(false);
      
      // Auto-send the message
      setTimeout(() => {
        if (result.trim()) {
          const userMessage = { text: result, sender: 'user' };
          setMessages((prev) => [...prev, userMessage]);
          handleApiCall(result);
        }
      }, 500);
    };

    recognition.onerror = () => {
      setMessages((prev) => prev.filter(msg => msg.text !== '🎤 Listening...'));
      setMessages((prev) => [...prev, { text: 'Speech recognition error. Please try again.', sender: 'bot' }]);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setMessages((prev) => prev.filter(msg => msg.text !== '🎤 Listening...'));
    };

    recognition.start();
  };

  const handleApiCall = async (message) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.reply) {
        const botMessage = { text: data.reply, sender: 'bot' };
        setMessages((prev) => [...prev, botMessage]);
        setContext(data.context || [...context, { role: 'assistant', content: data.reply }]);
        speakResponse(data.reply);
      } else if (data.error) {
        setMessages((prev) => [...prev, { text: `Error: ${data.error}`, sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { text: 'Error: Failed to connect to server.', sender: 'bot' }]);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: 'user' };
      setMessages((prev) => [...prev, userMessage]);
      const currentInput = input;
      setInput('');
      await handleApiCall(currentInput);
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setMessages((prev) => [...prev, { text: data.message || 'File uploaded successfully.', sender: 'bot' }]);
        setSelectedFile(null);
      } catch (error) {
        setMessages((prev) => [...prev, { text: 'Error: Failed to upload file.', sender: 'bot' }]);
      }
    }
  };

  useEffect(() => {
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen flex font-inter ${isDarkMode ? 'dark bg-gradient-to-br from-gray-900 to-black text-white' : 'bg-am-gray text-gray-900'}`}>
      {/* Sidebar */}
      <div className="w-64 bg-gray-900/95 p-5 flex flex-col shadow-2xl border-r border-gray-800/60">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-am-blue text-white flex items-center justify-center rounded-full font-bold">AM</div>
          <h1 className="text-xl font-semibold ml-3 text-white">Abdul Moiz's AI</h1>
        </div>
        <button 
          onClick={() => {
            setMessages([]);
            setContext([]);
          }}
          className="bg-am-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mb-6 transition duration-300"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0zm10-7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 100-2h-3V4a1 1 0 00-1-1z"/>
          </svg>
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
          <p className="text-gray-400 text-sm mb-3">Recent Chats</p>
          <ul>
            <li className="p-2 text-gray-400 hover:bg-gray-800/70 rounded-lg cursor-pointer transition duration-300">
              {messages.length > 0 ? 'Current Chat' : 'No chats yet'}
            </li>
          </ul>
        </div>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mt-6 transition duration-300 flex items-center justify-center"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              Light Mode
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              Dark Mode
            </>
          )}
        </button>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-am-blue dark:text-blue-400">Abdul Moiz's Voice AI</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Powered by advanced AI</p>
          </div>
          {isConnecting && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-am-blue mr-2"></div>
              Connecting...
            </div>
          )}
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4 chat-window bg-white dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-am-blue/10 dark:bg-am-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-am-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to Abdul Moiz's AI</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Start a conversation or use voice input to chat with the AI</p>
              </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl max-w-[70%] shadow-lg animate-fade-in ${
                msg.sender === 'user'
                  ? 'bg-am-blue text-white ml-auto'
                  : msg.sender === 'system'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mx-auto text-center'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isConnecting && handleSend()}
              disabled={isConnecting}
              className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-am-blue transition-colors ${
                isDarkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
              } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Ask Abdul Moiz's AI..."
            />
            <button
              onClick={handleSend}
              disabled={isConnecting || !input.trim()}
              className={`bg-am-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center ${
                (isConnecting || !input.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
            <button
              onClick={startSimpleListening}
              disabled={isListening}
              className={`px-4 py-2 rounded-lg transition duration-300 flex items-center ${
                isListening 
                  ? 'animate-pulse bg-red-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isListening ? 'Listening...' : 'Start voice input'}
            >
              {isListening ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  <span className="text-xs">Listening</span>
                </>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <input
              type="file"
              onChange={handleFileChange}
              className={`text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600' 
                  : 'text-gray-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              }`}
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile}
              className={`bg-am-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center ${
                !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
