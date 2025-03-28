document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-btn');
    const voiceButton = document.querySelector('.voice-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const logoutButton = document.querySelector('.logout-btn');

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    // Initialize speech synthesis
    const synth = window.speechSynthesis;
    let isListening = false;

    // Welcome message
    

    // Send message function
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            addUserMessage(message);
            messageInput.value = '';
            
            // Simulate bot thinking with typing indicator
            showTypingIndicator();
            
            // Simulate bot response after a delay
            setTimeout(() => {
                removeTypingIndicator();
                handleBotResponse(message);
            }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
        }
    }

    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">${escapeHtml(message)}</div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    // Add bot message to chat
    function addBotMessage(response) {
        const message = response.text;
        const sentiment = response.sentiment;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="message-content ${sentiment}">
                ${message}
                <div class="message-footer">
                    <span class="sentiment-indicator">
                        ${getSentimentEmoji(sentiment)}
                        ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </span>
                    <button class="speak-btn" aria-label="Listen to response">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();

        // Add click event for the speak button
        const speakBtn = messageElement.querySelector('.speak-btn');
        speakBtn.addEventListener('click', () => {
            speakText(message);
        });

        // Automatically speak the response
        speakText(message);
    }

    // Get sentiment emoji
    function getSentimentEmoji(sentiment) {
        switch (sentiment) {
            case 'positive':
                return '😊';
            case 'negative':
                return '😔';
            case 'neutral':
                return '😐';
            default:
                return '';
        }
    }

    // Text to Speech function
    function speakText(text) {
        // Cancel any ongoing speech
        synth.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
        synth.speak(utterance);
    }

    // Voice recognition functions
    function startListening() {
        recognition.start();
        isListening = true;
        updateVoiceButtonState();
    }

    function stopListening() {
        recognition.stop();
        isListening = false;
        updateVoiceButtonState();
    }

    function updateVoiceButtonState() {
        voiceButton.classList.toggle('listening', isListening);
        voiceButton.innerHTML = isListening ? 
            '<i class="fas fa-microphone-slash"></i>' : 
            '<i class="fas fa-microphone"></i>';
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Handle bot response
    async function handleBotResponse(userMessage) {
        try {
            const response = await fetch('/get_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (data.error) {
                addBotMessage({
                    text: data.error,
                    sentiment: "negative"
                });
            } else {
                addBotMessage({
                    text: data.response,
                    sentiment: data.sentiment
                });
            }
        } catch (error) {
            console.error('Error:', error);
            addBotMessage({
                text: "I'm sorry, I'm having trouble processing your request right now.",
                sentiment: "negative"
            });
        }
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    voiceButton.addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });

    // Speech recognition event handlers
    recognition.onstart = () => {
        messageInput.placeholder = 'Listening...';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        stopListening();
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        messageInput.placeholder = 'Enter your message...';
    };

    recognition.onend = () => {
        stopListening();
        messageInput.placeholder = 'Enter your message...';
    };

    logoutButton.addEventListener('click', () => {
        // Show confirmation dialog
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored session data if needed
            localStorage.removeItem('userSession');
            sessionStorage.removeItem('userSession');
            
            // Redirect to index page
            window.location.href = '/';
        }
    });

    // Update the style with sentiment colors
    const style = document.createElement('style');
    style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            background-color: #00E5FF;
            border-radius: 50%;
            animation: typing 1s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        .voice-btn {
            background: none;
            border: none;
            color: #00E5FF;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }

        .voice-btn.listening {
            background-color: rgba(255, 0, 0, 0.2);
            animation: pulse 1.5s infinite;
        }

        .speak-btn {
            background: none;
            border: none;
            color: #00E5FF;
            cursor: pointer;
            padding: 4px 8px;
            margin-left: 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
        }

        .speak-btn:hover {
            background-color: rgba(0, 229, 255, 0.1);
        }

        .message-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-top: 8px;
            gap: 12px;
        }

        .sentiment-indicator {
            font-size: 0.9em;
            padding: 4px 8px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .message-content.positive {
            border-left: 3px solid #4CAF50;
        }

        .message-content.negative {
            border-left: 3px solid #f44336;
        }

        .message-content.neutral {
            border-left: 3px solid #9e9e9e;
        }

        .positive .sentiment-indicator {
            background-color: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
        }

        .negative .sentiment-indicator {
            background-color: rgba(244, 67, 54, 0.1);
            color: #f44336;
        }

        .neutral .sentiment-indicator {
            background-color: rgba(158, 158, 158, 0.1);
            color: #9e9e9e;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
            }
        }
    `;
    document.head.appendChild(style);
}); 