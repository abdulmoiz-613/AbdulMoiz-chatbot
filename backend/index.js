const express = require('express');
const cors = require('cors');
const { Groq } = require('groq-sdk');
const multer = require('multer');
require('dotenv').config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Configure CORS to allow frontend connection
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.get('/', (req, res) => {
  res.send('Abdul Moiz\'s Voice Chatbot Backend');
});

app.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messages = [
      ...context,
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';
    res.json({ reply, context: [...messages, { role: 'assistant', content: reply }] });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ error: 'Failed to get response from Groq API. Check your API key.' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ message: `File ${req.file.originalname} uploaded successfully.` });
});

app.listen(5000, () => {
  console.log('Abdul Moiz\'s Voice Chatbot Backend running on port 5000');
});