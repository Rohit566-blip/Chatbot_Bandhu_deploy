document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-btn');
    const voiceButton = document.getElementById('voice-btn');
    const chatMessages = document.getElementById('chat-messages');
    const logoutButton = document.getElementById('logoutBtn');

    // Initialize speech synthesis
    const synth = window.speechSynthesis;
    
    // Use sessionStorage to track welcome message across page reloads
    const welcomeMessageShown = sessionStorage.getItem('welcomeMessageShown');

    function getSentimentEmoji(sentiment) {
        switch(sentiment.toLowerCase()) {
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

    function speakMessage(text) {
        // Remove emojis from text before speaking
        const textWithoutEmojis = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0FF}]/gu, '');
        const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synth.speak(utterance);
    }

    function addMessage(message, isUser = false, sentiment = null) {
        const messageContainer = document.createElement('div');
        messageContainer.className = isUser ? 'message user-message' : 'message bot-message';
        
        // Add sentiment indicator for bot messages
        if (!isUser && sentiment) {
            const sentimentEmoji = getSentimentEmoji(sentiment);
            const sentimentClass = `sentiment-${sentiment.toLowerCase()}`;
            messageContainer.classList.add(sentimentClass);
            
            messageContainer.innerHTML = `
                <div class="message-content">
                    <div class="sentiment-badge" title="Sentiment: ${sentiment}">
                        <span class="sentiment-indicator">${sentimentEmoji}</span>
                        <span class="sentiment-text">${sentiment}</span>
                    </div>
                    <span class="message-text">${message}</span>
                </div>`;
        } else {
            messageContainer.innerHTML = `<div class="message-content">${message}</div>`;
        }
        
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Speak bot messages
        if (!isUser) {
            speakMessage(message);
        }
    }

    function handleBotResponse(userMessage) {
        // Show loading animation
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot-message loading';
        loadingMessage.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(loadingMessage);

        fetch('/get_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading animation
            chatMessages.removeChild(loadingMessage);
            
            if (data.error) {
                addMessage('Sorry, I encountered an error. Please try again.');
                console.error('Error:', data.error);
                return;
            }

            // Add bot's response with sentiment
            addMessage(data.response, false, data.sentiment);
        })
        .catch(error => {
            // Remove loading animation
            chatMessages.removeChild(loadingMessage);
            addMessage('Sorry, I encountered an error. Please try again.');
            console.error('Error:', error);
        });
    }

    // Handle message sending
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        messageInput.value = '';

        // Send message to server
        handleBotResponse(message);
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle voice input
    voiceButton.addEventListener('click', function() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = function(event) {
                const message = event.results[0][0].transcript;
                messageInput.value = message;
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    });

    // Handle logout
    logoutButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored session data
            localStorage.clear();
            sessionStorage.clear();
            // Redirect to home page
            window.location.href = '/';
        }
    });

    // Initialize chat when the page loads - only show welcome message if not shown before
    if (!welcomeMessageShown) {
        addMessage('Hi, welcome to Bandhu! Go ahead and send me a message. 😊');
        sessionStorage.setItem('welcomeMessageShown', 'true');
    }
}); 