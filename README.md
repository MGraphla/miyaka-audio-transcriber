# Miyaka twi Audio Transcriber with Google Gemini

transcribes audio files to text 

## ✨ Features

- **Audio Transcription**: Supports MP3, WAV, M4A, OGG, WebM, and more audio formats
- **Automatic Translation**: Detects language and provides English translation if needed
- **Side-by-Side Display**: Shows original transcription and English translation together
- **Language Detection**: Identifies the language of the transcribed text
- **Real-time Feedback**: Loading states, progress indicators, and detailed error messages
- **Comprehensive Logging**: Detailed server-side logging for debugging
- **Modern UI**: Clean, responsive design with excellent UX

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)



## 🎯 Usage

1. **Upload Audio**: Click "Choose File" and select an audio file
2. **Transcribe**: Click the "Transcribe" button
3. **View Results**: The transcribed text will appear below
4. **Language Detection**: The app automatically detects the language
5. **Translation**: If the audio is not in English, an English translation appears side-by-side
6. **Copy/Use**: Copy either the original transcription or translation for your needs

## 📋 Supported Audio Formats

| Format | Extension | MIME Type | Status |
|--------|-----------|-----------|--------|
| MP3 | .mp3 | audio/mpeg | ✅ Supported |
| WAV | .wav | audio/wav | ✅ Supported |
| M4A | .m4a | audio/mp4 | ✅ Supported |
| OGG | .ogg | audio/ogg | ✅ Supported |
| WebM | .webm | audio/webm | ✅ Supported |



### Server Features
- **Multiple Format Attempts**: Tries 3 different API request formats
- **Automatic Cleanup**: Removes temporary files after processing
- **File Size Limit**: 50MB maximum file size
- **CORS Enabled**: Cross-origin requests supported
