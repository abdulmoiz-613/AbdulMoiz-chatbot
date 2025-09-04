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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false); // Track if last input was voice
  const [speakingMessageId, setSpeakingMessageId] = useState(null); // Track which message is being spoken
  const [currentUtterance, setCurrentUtterance] = useState(null); // Track current speech synthesis

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  // Test microphone access
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream
      setMessages((prev) => [...prev, { text: '✅ Microphone access granted! You can now use voice input.', sender: 'bot' }]);
      return true;
    } catch (error) {
      setMessages((prev) => [...prev, { text: '❌ Microphone access denied. Please allow microphone access in your browser settings.', sender: 'bot' }]);
      return false;
    }
  };

  // Test speech output
  const testSpeechOutput = () => {
    const testMessage = "Hello! This is a test of the speech output. If you can hear this, voice output is working correctly.";
    setMessages((prev) => [...prev, { text: 'Testing speech output: "' + testMessage + '"', sender: 'bot' }]);
    speakResponse(testMessage);
  };



  // Ultra-simple speech recognition function with improved sensitivity
  const startSimpleListening = async () => {
    // Prevent multiple instances
    if (isListening) {
      return;
    }

    // Quick silent microphone access check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
    } catch (error) {
      setMessages((prev) => [...prev, { text: '❌ Microphone access denied. Please allow microphone access in your browser settings.', sender: 'bot' }]);
      return;
    }

    // Check if browser supports speech recognition
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      setMessages((prev) => [...prev, { text: 'Speech recognition not supported. Please use Chrome, Edge, or Safari.', sender: 'bot' }]);
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // More sensitive configuration for better detection
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true; // Changed to true for better detection
      recognition.maxAlternatives = 3; // Increased alternatives
      
      // Add these for better sensitivity
      if (recognition.serviceURI !== undefined) {
        recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
      }

      let finalTranscript = '';
      let interimTranscript = '';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setMessages((prev) => [...prev, { text: '🎤 Listening... Speak clearly and loudly!', sender: 'system' }]);
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result received:', event);
        
        interimTranscript = '';
        finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Final:', finalTranscript, 'Interim:', interimTranscript);
        
        // Update input field with interim results for feedback
        if (interimTranscript) {
          setInput(finalTranscript + interimTranscript);
        }
        
        // If we have final results, process them
        if (finalTranscript.trim()) {
          console.log('Processing final transcript:', finalTranscript);
          setIsListening(false);
          
          // Remove listening message
          setMessages((prev) => prev.filter(msg => !msg.text.includes('🎤 Listening')));
          
          setInput(finalTranscript.trim());
          
          // Auto-send the message
          setTimeout(() => {
            const userMessage = { text: finalTranscript.trim(), sender: 'user' };
            setMessages((prev) => [...prev, userMessage]);
            setLastInputWasVoice(true); // Mark that this input was voice
            handleApiCall(finalTranscript.trim());
          }, 300);
        }
      };

      recognition.onspeechstart = () => {
        console.log('Speech detected');
        setMessages((prev) => prev.filter(msg => !msg.text.includes('🎤 Listening')));
        setMessages((prev) => [...prev, { text: '🔊 Speech detected! Keep talking...', sender: 'system' }]);
      };

      recognition.onspeechend = () => {
        console.log('Speech ended');
        setMessages((prev) => prev.filter(msg => msg.text.includes('🔊 Speech detected')));
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Remove listening messages
        setMessages((prev) => prev.filter(msg => !msg.text.includes('🎤 Listening') && !msg.text.includes('🔊 Speech detected')));
        
        // Show specific error messages
        let errorMsg = 'Speech recognition failed. ';
        switch (event.error) {
          case 'no-speech':
            errorMsg = '🎤 No speech detected. Try speaking louder, closer to the microphone, or in a quieter environment.';
            break;
          case 'audio-capture':
            errorMsg = '❌ Microphone error. Please check your microphone connection.';
            break;
          case 'not-allowed':
            errorMsg = '❌ Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMsg = '🌐 Network error. Please check your internet connection.';
            break;
          case 'aborted':
            errorMsg = '⏹️ Speech recognition was stopped.';
            break;
          default:
            errorMsg = `❌ Speech recognition error: ${event.error}. Please try again.`;
        }
        
        setMessages((prev) => [...prev, { text: errorMsg, sender: 'bot' }]);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        // Clean up any remaining listening messages
        setMessages((prev) => prev.filter(msg => !msg.text.includes('🎤 Listening') && !msg.text.includes('🔊 Speech detected')));
        
        // If we didn't get any final results, show a helpful message
        if (!finalTranscript.trim()) {
          setTimeout(() => {
            setMessages((prev) => [...prev, { text: '💡 Tips: Speak clearly, avoid background noise, speak within 5 seconds of clicking the microphone.', sender: 'system' }]);
          }, 1000);
        }
      };

      // Start recognition
      recognition.start();
      
    } catch (error) {
      console.error('Failed to create speech recognition:', error);
      setIsListening(false);
      setMessages((prev) => [...prev, { text: 'Failed to start speech recognition. Please try refreshing the page.', sender: 'bot' }]);
    }
  };

  const handleApiCall = async (message) => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.reply) {
        const messageId = Date.now(); // Simple unique ID
        const botMessage = { 
          text: data.reply, 
          sender: 'bot', 
          id: messageId,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, botMessage]);
        setContext(data.context || [...context, { role: 'assistant', content: data.reply }]);
        
        // Auto-speak the response only if the last input was voice and voice is enabled
        if (voiceEnabled && lastInputWasVoice) {
          speakMessage(data.reply, messageId);
        }
        
        // Reset the voice input flag after handling the response
        setLastInputWasVoice(false);
      } else if (data.error) {
        setMessages((prev) => [...prev, { text: `Error: ${data.error}`, sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { text: 'Error: Failed to connect to server. Make sure backend is running on port 5000.', sender: 'bot' }]);
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
      setLastInputWasVoice(false); // Mark that this input was text
      await handleApiCall(currentInput);
    }
  };

  // Stop current speech
  const stopSpeaking = () => {
    // Stop the specific utterance if available
    if (currentUtterance) {
      try {
        window.speechSynthesis.cancel();
        currentUtterance.onend = null; // Remove the onend handler to prevent state updates
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
    } else if (window.speechSynthesis) {
      // Fallback to canceling all speech
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setCurrentUtterance(null);
  };

  // Speak a specific message with ID tracking
  const speakMessage = (text, messageId) => {
    if (!voiceEnabled) {
      console.log('Voice output disabled');
      return;
    }

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      // Stop any ongoing speech
      stopSpeaking();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech parameters
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      
      // Set voice and speak
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        if (voices.length > 0) {
          // Try to find a good English voice
          let selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && (
              voice.name.toLowerCase().includes('female') || 
              voice.name.toLowerCase().includes('zira') ||
              voice.name.toLowerCase().includes('hazel') ||
              voice.name.toLowerCase().includes('samantha') ||
              voice.name.toLowerCase().includes('karen') ||
              voice.gender === 'female'
            )
          );
          
          // Fallback to any English voice
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
          }
          
          // Final fallback to first available voice
          if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Selected voice:', selectedVoice.name);
          }
          
          utterance.onstart = () => {
            console.log('Speech synthesis started for message:', messageId);
            setSpeakingMessageId(messageId);
            setCurrentUtterance(utterance);
          };
          
          utterance.onend = () => {
            console.log('Speech synthesis ended for message:', messageId);
            setSpeakingMessageId(null);
            setCurrentUtterance(null);
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            setSpeakingMessageId(null);
            setCurrentUtterance(null);
          };
          
          // Speak the text
          try {
            window.speechSynthesis.speak(utterance);
            console.log('Speaking message:', messageId, text.substring(0, 50) + '...');
          } catch (error) {
            console.error('Error during speech synthesis:', error);
            setSpeakingMessageId(null);
            setCurrentUtterance(null);
          }
        } else {
          // Retry after a short delay if voices are not loaded yet
          console.log('Voices not loaded yet, retrying...');
          setTimeout(setVoiceAndSpeak, 100);
        }
      };
      
      // Check if voices are already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        // Wait for voices to be loaded
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null; // Remove listener after first use
        };
        // Also try after a short delay as backup
        setTimeout(setVoiceAndSpeak, 100);
      } else {
        setVoiceAndSpeak();
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setSpeakingMessageId(null);
      setCurrentUtterance(null);
    }
  };

  // Format message text to preserve formatting and handle lists
  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Split by lines and process each line
    const lines = text.split('\n');
    const formattedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines but preserve spacing
      if (trimmedLine === '') {
        formattedLines.push(<div key={`br-${i}`} className="h-2" />);
        continue;
      }
      
      // Check for various bullet point patterns
      const bulletPatterns = [
        { pattern: /^[•·▪▫‣⁃]\s*(.+)$/, type: 'bullet' },           // Unicode bullets
        { pattern: /^[-*+]\s*(.+)$/, type: 'bullet' },              // Dash, asterisk, plus
        { pattern: /^(\d+)[.)]\s*(.+)$/, type: 'numbered' },        // Numbered lists (1. or 1))
        { pattern: /^([a-zA-Z])[.)]\s*(.+)$/, type: 'lettered' },   // Letter lists (a. or a))
        { pattern: /^([ivxIVX]+)[.)]\s*(.+)$/, type: 'roman' },     // Roman numerals
      ];
      
      let isListItem = false;
      let content = trimmedLine;
      let listMarker = '';
      
      // Check each pattern
      for (const { pattern, type } of bulletPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          isListItem = true;
          if (type === 'numbered') {
            listMarker = `${match[1]}.`;
            content = match[2];
          } else if (type === 'lettered') {
            listMarker = `${match[1]}.`;
            content = match[2];
          } else if (type === 'roman') {
            listMarker = `${match[1]}.`;
            content = match[2];
          } else {
            listMarker = '•';
            content = match[1];
          }
          break;
        }
      }
      
      // Check for headers (lines that end with :)
      const isHeader = trimmedLine.endsWith(':') && !isListItem && trimmedLine.length > 1;
      
      if (isListItem) {
        formattedLines.push(
          <div key={`line-${i}`} className="flex items-start mb-2 ml-2">
            <span className="mr-3 mt-0.5 text-sm font-medium opacity-80 min-w-[1.5rem]">
              {listMarker}
            </span>
            <span className="flex-1 leading-relaxed">{content}</span>
          </div>
        );
      } else if (isHeader) {
        formattedLines.push(
          <div key={`line-${i}`} className="font-semibold mb-2 mt-3 first:mt-0">
            {trimmedLine}
          </div>
        );
      } else {
        // Regular paragraph line with preserved indentation
        const leadingSpaces = line.length - line.trimStart().length;
        const indentClass = leadingSpaces > 0 ? `ml-${Math.min(leadingSpaces, 8)}` : '';
        
        formattedLines.push(
          <div key={`line-${i}`} className={`mb-1 leading-relaxed ${indentClass}`}>
            {trimmedLine}
          </div>
        );
      }
    }
    
    return <div className="space-y-0">{formattedLines}</div>;
  };

  // Legacy function for simple speech (like test)
  const speakResponse = (text) => {
    if (!voiceEnabled) {
      console.log('Voice output disabled');
      return;
    }

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      setMessages((prev) => [...prev, { text: '❌ Speech output not supported in this browser.', sender: 'system' }]);
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech parameters
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      
      // Set voice and speak
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        if (voices.length > 0) {
          // Try to find a good English voice
          let selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && (
              voice.name.toLowerCase().includes('female') || 
              voice.name.toLowerCase().includes('zira') ||
              voice.name.toLowerCase().includes('hazel') ||
              voice.name.toLowerCase().includes('samantha') ||
              voice.name.toLowerCase().includes('karen') ||
              voice.gender === 'female'
            )
          );
          
          // Fallback to any English voice
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
          }
          
          // Final fallback to first available voice
          if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Selected voice:', selectedVoice.name);
          }
          
          utterance.onstart = () => {
            console.log('Speech synthesis started');
          };
          
          utterance.onend = () => {
            console.log('Speech synthesis ended');
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            setMessages((prev) => [...prev, { text: '❌ Speech output error. Please try again.', sender: 'system' }]);
          };
          
          // Speak the text
          try {
            window.speechSynthesis.speak(utterance);
            console.log('Speaking:', text.substring(0, 50) + '...');
          } catch (error) {
            console.error('Error during speech synthesis:', error);
            setMessages((prev) => [...prev, { text: '❌ Speech output error. Please try again.', sender: 'system' }]);
          }
        } else {
          // Retry after a short delay if voices are not loaded yet
          console.log('Voices not loaded yet, retrying...');
          setTimeout(setVoiceAndSpeak, 100);
        }
      };
      
      // Check if voices are already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        // Wait for voices to be loaded
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null; // Remove listener after first use
        };
        // Also try after a short delay as backup
        setTimeout(setVoiceAndSpeak, 100);
      } else {
        setVoiceAndSpeak();
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setMessages((prev) => [...prev, { text: '❌ Speech output error. Please try again.', sender: 'system' }]);
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
        const response = await fetch(`${API_BASE_URL}/upload`, {
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

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
                <div className="space-y-3">
                  <div className="flex space-x-2 justify-center">
                    <button
                      onClick={testMicrophone}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition duration-300 flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 6 6 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 115 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      Test Microphone
                    </button>
                    <button
                      onClick={testSpeechOutput}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition duration-300 flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M13.828 7.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 4.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Test Voice Output
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Test microphone input and voice output before chatting</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`p-3 rounded-xl max-w-[70%] shadow-lg animate-fade-in relative ${
                msg.sender === 'user'
                  ? 'bg-am-blue text-white ml-auto'
                  : msg.sender === 'system'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mx-auto text-center'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              }`}
            >
              <div className={`${msg.sender === 'bot' ? 'pr-12' : ''} ${msg.sender === 'bot' ? 'leading-relaxed' : ''}`}>
                {msg.sender === 'bot' ? formatMessageText(msg.text) : msg.text}
              </div>
              
              {/* Voice controls for bot messages */}
              {msg.sender === 'bot' && voiceEnabled && (
                <div className="absolute top-2 right-2 flex space-x-1">
                  {speakingMessageId === msg.id ? (
                    // Stop button when speaking
                    <button
                      onClick={stopSpeaking}
                      className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                      title="Stop voice"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : (
                    // Play button when not speaking
                    <button
                      onClick={() => speakMessage(msg.text, msg.id)}
                      className="p-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      title="Listen to this message"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
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
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 115 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-3 py-2 rounded-lg transition duration-300 flex items-center ${
                voiceEnabled 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
              title={voiceEnabled ? 'Voice output enabled - Click to disable' : 'Voice output disabled - Click to enable'}
            >
              {voiceEnabled ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M13.828 7.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 4.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM7.293 15.293L18 4.586a1 1 0 111.414 1.414L8.707 16.707a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
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
