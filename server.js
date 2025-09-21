require('dotenv').config();
const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Enhanced logging
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
};

// Translation function
async function translateText(text) {
    try {
        log('Starting translation process', { textLength: text.length });
        
        // First, detect the language and translate if needed using Gemini Pro
        const translationRequest = {
            model: 'google/gemini-2.5-pro',
            messages: [
                {
                    role: 'user',
                    content: `You are a professional translator specializing in West African languages, particularly Twi (Akan) from Ghana. You have deep cultural understanding and linguistic expertise.

TASK: Analyze and translate this Twi text to natural, fluent English.

INSTRUCTIONS:
1. Recognize this is Twi/Akan language from Ghana
2. Provide a high-quality English translation that:
   - Captures the exact meaning and intent
   - Uses natural, conversational English
   - Preserves cultural context and nuances
   - Maintains the original tone and style

3. If somehow the text is already in English, return it as-is

IMPORTANT: Focus on meaning over literal word-for-word translation. Make it sound natural in English while preserving the original message.

Respond in this exact JSON format:
{
  "language": "Twi (Akan)",
  "isEnglish": false,
  "translation": "your_natural_english_translation_here"
}

Twi text to translate: "${text}"`
                }
            ],
            temperature: 0.2,
            max_tokens: 8000
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Audio Transcriber'
            },
            body: JSON.stringify(translationRequest)
        });

        if (response.ok) {
            const data = await response.json();
            const responseText = data.choices?.[0]?.message?.content;
            
            if (responseText) {
                try {
                    // Try to parse JSON response
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        log('Translation successful', {
                            language: result.language,
                            isEnglish: result.isEnglish,
                            originalLength: text.length,
                            translationLength: result.translation ? result.translation.length : 0
                        });
                        
                        return {
                            language: result.language,
                            translation: result.isEnglish ? null : result.translation
                        };
                    }
                } catch (parseError) {
                    log('JSON parsing failed, using fallback', parseError.message);
                }
                
                // Fallback: simple heuristic
                const isEnglish = /^[a-zA-Z\s.,!?'"()-]+$/.test(text.trim());
                if (isEnglish) {
                    return { language: 'English', translation: null };
                } else {
                    // Simple translation request
                    return await simpleTranslate(text);
                }
            }
        }
        
        log('Translation API failed, using fallback');
        return { language: 'Unknown', translation: null };
        
    } catch (error) {
        log('Translation error:', error);
        return { language: 'Unknown', translation: null };
    }
}

// Fallback simple translation
async function simpleTranslate(text) {
    try {
        const translationRequest = {
            model: 'google/gemini-2.5-pro',
            messages: [
                {
                    role: 'user',
                    content: `You are a professional Twi (Akan) to English translator with deep knowledge of Ghanaian culture and language nuances.

TASK: Translate this Twi text to natural, fluent English.

GUIDELINES:
- Focus on conveying the meaning and intent, not literal word-for-word translation
- Use natural, conversational English that flows well
- Preserve the tone and cultural context
- Make it sound like something a native English speaker would naturally say

Twi text: "${text}"

Provide ONLY the English translation (no explanations, no additional text):`
                }
            ],
            temperature: 0.2,
            max_tokens: 8000
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Audio Transcriber'
            },
            body: JSON.stringify(translationRequest)
        });

        if (response.ok) {
            const data = await response.json();
            const translation = data.choices?.[0]?.message?.content;
            
            if (translation) {
                log('Fallback translation successful', {
                    originalLength: text.length,
                    translationLength: translation.trim().length
                });
                return { language: 'Twi (Akan)', translation: translation.trim() };
            }
        }
        
        return { language: 'Unknown', translation: null };
    } catch (error) {
        log('Simple translation error:', error);
        return { language: 'Unknown', translation: null };
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/transcribe', async (req, res) => {
    log('Transcription request received');
    
    try {
        const form = new formidable.IncomingForm({
            maxFileSize: 50 * 1024 * 1024, // 50MB limit
            keepExtensions: true,
            multiples: false
        });
        
        form.parse(req, async (err, fields, files) => {
            if (err) {
                log('Form parsing error:', err);
                return res.status(500).json({ 
                    error: 'Error parsing form data',
                    details: err.message 
                });
            }

            log('Form parsed successfully', { fields, files: Object.keys(files) });

            // Handle different formidable versions
            const audioFile = files.audio?.[0] || files.audio;
            
            if (!audioFile) {
                log('No audio file found in request');
                return res.status(400).json({ error: 'No audio file provided' });
            }

            log('Audio file details:', {
                originalFilename: audioFile.originalFilename,
                mimetype: audioFile.mimetype,
                size: audioFile.size,
                filepath: audioFile.filepath
            });

            try {
                // Read the audio file
                const audioData = fs.readFileSync(audioFile.filepath);
                const base64Audio = audioData.toString('base64');
                
                // Determine MIME type more accurately
                let mimeType = audioFile.mimetype;
                if (!mimeType) {
                    const ext = path.extname(audioFile.originalFilename || '').toLowerCase();
                    switch (ext) {
                        case '.mp3': mimeType = 'audio/mpeg'; break;
                        case '.wav': mimeType = 'audio/wav'; break;
                        case '.m4a': mimeType = 'audio/mp4'; break;
                        case '.ogg': mimeType = 'audio/ogg'; break;
                        default: mimeType = 'audio/mpeg';
                    }
                }

                log('Preparing API request', {
                    mimeType,
                    audioSizeBytes: audioData.length,
                    base64Length: base64Audio.length
                });

                // Try different API request formats based on research
                // Format 1: OpenAI standard format
                let requestBody = {
                    model: 'openai/gpt-4o-audio-preview',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { 
                                    type: 'text', 
                                    text: 'Please transcribe this audio file accurately. Return only the transcribed text.' 
                                },
                                { 
                                    type: 'input_audio',
                                    input_audio: {
                                        data: base64Audio,
                                        format: getAudioFormat(mimeType)
                                    }
                                }
                            ]
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 4000
                };

                // Helper function to get correct audio format
                function getAudioFormat(mimeType) {
                    switch (mimeType) {
                        case 'audio/mpeg':
                        case 'audio/mp3': return 'mp3';
                        case 'audio/wav': return 'wav';
                        case 'audio/mp4':
                        case 'audio/m4a': return 'm4a';
                        case 'audio/ogg': return 'ogg';
                        case 'audio/webm': return 'webm';
                        default: return 'mp3';
                    }
                }

                // Try multiple request formats
                const requestFormats = [
                    // Format 1: Standard OpenAI format
                    {
                        model: 'google/gemini-2.5-pro',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { 
                                        type: 'text', 
                                        text: 'Please transcribe this entire audio file completely and accurately. Make sure to transcribe every word from beginning to end. Return only the complete transcribed text with no truncation.' 
                                    },
                                    { 
                                        type: 'input_audio',
                                        input_audio: {
                                            data: base64Audio,
                                            format: getAudioFormat(mimeType)
                                        }
                                    }
                                ]
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 8000
                    },
                    // Format 2: Alternative format with audio type
                    {
                        model: 'google/gemini-2.5-pro',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { 
                                        type: 'text', 
                                        text: 'Transcribe this entire audio file completely from start to finish. Include every word spoken.' 
                                    },
                                    { 
                                        type: 'audio',
                                        audio: {
                                            data: base64Audio,
                                            format: getAudioFormat(mimeType)
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    // Format 3: Data URL format
                    {
                        model: 'google/gemini-2.5-pro',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: 'Transcribe this entire audio file completely. Include all spoken words from beginning to end.' },
                                    { 
                                        type: 'audio',
                                        data: `data:${mimeType};base64,${base64Audio}`
                                    }
                                ]
                            }
                        ]
                    }
                ];

                let lastError = null;
                
                for (let i = 0; i < requestFormats.length; i++) {
                    log(`Trying API request format ${i + 1}/${requestFormats.length}`);
                    
                    try {
                        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'http://localhost:3000',
                                'X-Title': 'Audio Transcriber'
                            },
                            body: JSON.stringify(requestFormats[i])
                        });

                        log(`API response received for format ${i + 1}`, { 
                            status: response.status, 
                            statusText: response.statusText 
                        });

                        if (response.ok) {
                            const data = await response.json();
                            log('API response data:', data);

                            const transcription = data.choices?.[0]?.message?.content;
                            
                            if (transcription) {
                                log('Transcription successful', { 
                                    transcriptionLength: transcription.length,
                                    formatUsed: i + 1
                                });

                                // Clean up temporary file
                                try {
                                    fs.unlinkSync(audioFile.filepath);
                                } catch (cleanupError) {
                                    log('File cleanup error (non-critical):', cleanupError.message);
                                }

                                // New: Translate if not English
                                const translationResult = await translateText(transcription);

                                return res.json({ 
                                    transcription, 
                                    translation: translationResult.translation, 
                                    language: translationResult.language 
                                });
                            }
                        } else {
                            const errorText = await response.text();
                            lastError = {
                                format: i + 1,
                                status: response.status,
                                error: errorText
                            };
                            log(`Format ${i + 1} failed:`, lastError);
                        }
                    } catch (fetchError) {
                        lastError = {
                            format: i + 1,
                            error: fetchError.message
                        };
                        log(`Format ${i + 1} fetch error:`, lastError);
                    }
                }

                // If all formats failed
                log('All API request formats failed:', lastError);
                return res.status(lastError?.status || 500).json({ 
                    error: 'All API request formats failed',
                    details: lastError,
                    allFormatsFailed: true
                });

            } catch (error) {
                log('Transcription processing error:', error);
                res.status(500).json({ 
                    error: 'Error processing audio',
                    details: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        });
    } catch (error) {
        log('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!process.env.OPENAI_API_KEY
    });
});

// Test API connection endpoint
app.get('/test-api', async (req, res) => {
    try {
        log('Testing OpenRouter API connection');
        
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Audio Transcriber'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const audioModels = data.data?.filter(model => 
                model.id.includes('audio') || model.id.includes('gpt-4o')
            ) || [];
            
            log('API connection successful', { 
                totalModels: data.data?.length || 0,
                audioModels: audioModels.length 
            });
            
            res.json({
                status: 'API connection successful',
                totalModels: data.data?.length || 0,
                audioModelsFound: audioModels.length,
                targetModel: 'google/gemini-2.5-pro',
                targetModelAvailable: audioModels.some(m => m.id === 'google/gemini-2.5-pro')
            });
        } else {
            const errorText = await response.text();
            log('API connection failed', { status: response.status, error: errorText });
            res.status(response.status).json({
                status: 'API connection failed',
                error: errorText
            });
        }
    } catch (error) {
        log('API test error:', error);
        res.status(500).json({
            status: 'API test failed',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    log(`Server is running on http://localhost:${PORT}`);
    log('Environment check:', {
        nodeVersion: process.version,
        apiKeyConfigured: !!process.env.OPENAI_API_KEY,
        apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    });
});
