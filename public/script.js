document.addEventListener('DOMContentLoaded', () => {
    const audioFileInput = document.getElementById('audioFile');
    const transcribeBtn = document.getElementById('transcribeBtn');
    const resultContainer = document.getElementById('resultContainer');
    const transcriptionElement = document.getElementById('transcription');
    const translationElement = document.getElementById('translation');
    const translationSection = document.getElementById('translationSection');
    const languageInfo = document.getElementById('languageInfo');
    const languageBadge = document.getElementById('languageBadge');
    const originalTitle = document.getElementById('originalTitle');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const errorDetailsElement = document.getElementById('errorDetails');

    // Handle file selection
    audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            transcribeBtn.disabled = false;
        } else {
            transcribeBtn.disabled = true;
        }
    });

    // Handle transcription button click
    transcribeBtn.addEventListener('click', async () => {
        const file = audioFileInput.files[0];
        
        if (!file) {
            showError('Please select an audio file first.');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            showError('Please upload an audio file (e.g., .mp3, .wav, .m4a)');
            return;
        }

        // Show loading state
        loadingElement.style.display = 'block';
        resultContainer.style.display = 'none';
        errorElement.style.display = 'none';
        transcribeBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to transcribe audio');
            }

            const data = await response.json();
            
            // Display the transcription
            transcriptionElement.textContent = data.transcription;
            
            // Handle language detection and translation
            if (data.language) {
                languageBadge.textContent = `Detected Language: ${data.language}`;
                languageInfo.style.display = 'block';
                
                if (data.translation) {
                    // Show translation
                    translationElement.textContent = data.translation;
                    translationSection.style.display = 'block';
                    originalTitle.textContent = `Original Text (${data.language})`;
                } else {
                    // Hide translation section if not needed
                    translationSection.style.display = 'none';
                    originalTitle.textContent = 'Transcription';
                }
            } else {
                // Hide language info if not available
                languageInfo.style.display = 'none';
                translationSection.style.display = 'none';
                originalTitle.textContent = 'Transcription';
            }
            
            resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            showError('Network or processing error', error.message);
        } finally {
            loadingElement.style.display = 'none';
            transcribeBtn.disabled = false;
        }
    });

    // Helper function to show error messages
    function showError(message, details = '') {
        errorDetailsElement.textContent = details || message;
        errorElement.style.display = 'block';
        resultContainer.style.display = 'none';
    }
});

// Copy to clipboard function
async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const button = elementId === 'transcription' ? 
            document.getElementById('copyOriginalBtn') : 
            document.getElementById('copyTranslationBtn');
        
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.classList.add('copied');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
        
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Visual feedback for fallback
        const button = elementId === 'transcription' ? 
            document.getElementById('copyOriginalBtn') : 
            document.getElementById('copyTranslationBtn');
        
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }
}
