# Abdul Moiz's Voice Bot

A full-stack AI voice chatbot application with React frontend and Node.js backend, powered by Groq API.

## Features

- 🎤 Voice input with speech recognition
- 🔊 Voice output with speech synthesis
- 💬 Text-based chat interface
- 📁 File upload functionality
- 🌙 Dark/Light mode toggle
- 🤖 AI responses powered by Groq API

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Groq API key

## Setup Instructions

### 1. Install Dependencies

#### Option A: Install all at once
```bash
npm run install-all
```

#### Option B: Manual installation
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_PROJECT_ID=your_project_id_here
```

### 3. Running the Application

#### Option A: Using the batch file (Windows)
Double-click `start-dev.bat` or run it from command prompt

#### Option B: Using npm scripts
```bash
# Run both frontend and backend together
npm run dev

# Or run them separately:
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run frontend
```

#### Option C: Manual startup
```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend
cd frontend
npm start
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Usage

1. **Text Chat**: Type your message and press Enter or click Send
2. **Voice Input**: Click the microphone button and speak
3. **File Upload**: Select a file and click Upload
4. **Dark Mode**: Click the Dark/Light mode toggle in the sidebar
5. **New Chat**: Click "New Chat" to clear conversation history

## Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 5000
- Check that your Groq API key is valid
- Verify the .env file is in the backend directory

### Voice Features Not Working
- Ensure you're using HTTPS or localhost
- Grant microphone permissions when prompted
- Check browser compatibility (Chrome/Edge recommended)

### UI Text Not Visible in Light Mode
- The app now properly handles dark/light mode switching
- Custom colors are defined in tailwind.config.js

## Technical Details

### Backend Stack
- Node.js + Express
- Groq SDK for AI responses
- Multer for file uploads
- CORS enabled for frontend connection

### Frontend Stack
- React 18
- Tailwind CSS for styling
- Web Speech API for voice features
- Responsive design with dark/light modes

## API Endpoints

- `GET /` - Health check
- `POST /chat` - Send message to AI
- `POST /upload` - Upload files

## Browser Compatibility

- **Voice Recognition**: Chrome, Edge (recommended)
- **Speech Synthesis**: All modern browsers
- **General UI**: All modern browsers

## Support

If you encounter any issues:
1. Check that both servers are running
2. Verify your Groq API key is valid
3. Ensure microphone permissions are granted
4. Try refreshing the page
5. Check browser console for errors
