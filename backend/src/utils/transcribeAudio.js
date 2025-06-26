require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      stream: false,
    });
    return transcription;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
}

module.exports = { transcribeAudio }; 