# Miyaka twi Audio Transcriber with Google Gemini

A robust web application that transcribes audio files to text using the OpenRouter API with Google Gemini 2.5 Pro model. Features comprehensive error handling, multiple API format attempts, automatic translation, and detailed logging.

## ✨ Features

- **Audio Transcription**: Supports MP3, WAV, M4A, OGG, WebM, and more audio formats
- **Automatic Translation**: Detects language and provides English translation if needed
- **Side-by-Side Display**: Shows original transcription and English translation together
- **Language Detection**: Identifies the language of the transcribed text
- **Smart Error Handling**: Tries multiple API request formats for maximum compatibility
- **Real-time Feedback**: Loading states, progress indicators, and detailed error messages
- **Comprehensive Logging**: Detailed server-side logging for debugging
- **Modern UI**: Clean, responsive design with excellent UX
- **API Testing**: Built-in endpoint to test OpenRouter API connection

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- An OpenRouter API key (get one at [OpenRouter](https://openrouter.ai/keys))

## 🚀 Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your API key:**
   - Your API key is already configured in `.env`
   - Model: `google/gemini-2.5-pro`

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🎯 Usage

1. **Upload Audio**: Click "Choose File" and select an audio file
2. **Transcribe**: Click the "Transcribe" button
3. **View Results**: The transcribed text will appear below
4. **Language Detection**: The app automatically detects the language
5. **Translation**: If the audio is not in English, an English translation appears side-by-side
6. **Copy/Use**: Copy either the original transcription or translation for your needs

## 🔧 API Testing

Test your OpenRouter API connection:
- Visit: `http://localhost:3000/test-api`
- Or check health: `http://localhost:3000/health`

## 📋 Supported Audio Formats

| Format | Extension | MIME Type | Status |
|--------|-----------|-----------|--------|
| MP3 | .mp3 | audio/mpeg | ✅ Supported |
| WAV | .wav | audio/wav | ✅ Supported |
| M4A | .m4a | audio/mp4 | ✅ Supported |
| OGG | .ogg | audio/ogg | ✅ Supported |
| WebM | .webm | audio/webm | ✅ Supported |

## 🛠️ Advanced Configuration

### Environment Variables
```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

### Server Features
- **Multiple Format Attempts**: Tries 3 different API request formats
- **Automatic Translation**: Uses GPT-4o-mini for language detection and translation
- **Automatic Cleanup**: Removes temporary files after processing
- **File Size Limit**: 50MB maximum file size
- **CORS Enabled**: Cross-origin requests supported

### Translation Features
- **Language Detection**: Automatically identifies the language of transcribed text
- **Smart Translation**: Only translates if the text is not already in English
- **Fallback Handling**: Multiple translation approaches for reliability
- **Side-by-Side Display**: Shows original and translated text together
- **Visual Indicators**: Color-coded sections and language badges

## 🐛 Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check server logs in terminal
   - Verify API key is correct
   - Ensure audio file is valid format

2. **API Connection Failed**
   - Test connection: `http://localhost:3000/test-api`
   - Check OpenRouter API status
   - Verify API key has sufficient credits

3. **File Upload Issues**
   - Ensure file size is under 50MB
   - Check file format is supported
   - Try a different audio file

### Debug Mode
The application runs in development mode with detailed logging. Check the terminal for:
- File upload details
- API request/response information
- Error stack traces
- Processing steps

### Server Logs
Monitor the terminal for detailed logs:
```
[2025-09-19T11:37:54.065Z] Server is running on http://localhost:3000
[2025-09-19T11:37:54.065Z] Environment check: {...}
[2025-09-19T11:38:34.425Z] API connection successful
```

## 🔍 Technical Details

### API Request Formats
The application tries multiple request formats for maximum compatibility:

1. **Standard OpenAI Format**: `input_audio` with format specification
2. **Alternative Format**: `audio` type with data/format
3. **Data URL Format**: Base64 data URL approach

### Error Recovery
- Automatic retry with different formats
- Detailed error reporting
- Graceful fallback handling
- Temporary file cleanup

## 📊 Performance

- **File Processing**: Handles files up to 50MB
- **Response Time**: Depends on file size and API response
- **Memory Usage**: Optimized with streaming and cleanup
- **Concurrent Requests**: Supports multiple simultaneous transcriptions

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
