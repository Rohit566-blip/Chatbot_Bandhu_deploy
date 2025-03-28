import os
import nltk
import pickle
import numpy as np
import requests
import json
import random
from keras.models import load_model
from flask import Flask, render_template, request, jsonify
import mysql.connector
from nltk.stem import WordNetLemmatizer
from bs4 import BeautifulSoup
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Download necessary NLTK data
nltk.download('popular')

# Initialize the lemmatizer
lemmatizer = WordNetLemmatizer()

# Google Drive file links (keeping only necessary ones)
MODEL_URL = "https://drive.google.com/uc?id=1QMySi59lofY2zJFOD4PqCDipw0Le9EH9"
LABELS_URL = "https://drive.google.com/uc?id=1YZIFB--oQVvUsJZOQUtbrhHdq_Lu1xWA"
TEXTS_URL = "https://drive.google.com/uc?id=1BdDCmrdzS9scIBmbS7YKyfQg_oZq29gD"
DATA_URL = "https://drive.google.com/uc?id=1ChW3P16BGe2PCjt6HOBNdEZ-HlAcfD4j"

# Define file paths (matching training.py)
MODEL_PATH = os.path.join(os.getcwd(), 'chatbot', 'model.h5')
DATA_PATH = os.path.join(os.getcwd(), 'data.json')
LABELS_PATH = os.path.join(os.getcwd(), 'chatbot', 'labels.pkl')
TEXTS_PATH = os.path.join(os.getcwd(), 'chatbot', 'texts.pkl')
TRAINING_INFO_PATH = os.path.join(os.getcwd(), 'chatbot', 'training_info.json')

# Ensure chatbot directory exists
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# Download VADER lexicon
nltk.download('vader_lexicon')

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

def download_file(url, path, file_desc):
    """Download a file from Google Drive and save it locally."""
    try:
        print(f"Downloading {file_desc}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
        
        print(f"{file_desc} download complete.")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {file_desc}: {e}")

# Download required files if missing (excluding data.json)
if not os.path.exists(MODEL_PATH):
    download_file(MODEL_URL, MODEL_PATH, "model.h5")

if not os.path.exists(LABELS_PATH):
    download_file(LABELS_URL, LABELS_PATH, "labels.pkl")

if not os.path.exists(TEXTS_PATH):
    download_file(TEXTS_URL, TEXTS_PATH, "texts.pkl")

# Check if model and necessary files exist
def check_model_files():
    required_files = {
        'Model': MODEL_PATH,
        'Data': DATA_PATH,
        'Labels': LABELS_PATH,
        'Words': TEXTS_PATH
    }
    
    missing_files = []
    for file_desc, file_path in required_files.items():
        if not os.path.exists(file_path):
            missing_files.append(file_desc)
    
    if missing_files:
        print(f"Error: Missing required files: {', '.join(missing_files)}")
        print("Please run training.py first to generate these files.")
        return False
    return True

# Verify training completion
def verify_training():
    try:
        if os.path.exists(TRAINING_INFO_PATH):
            with open(TRAINING_INFO_PATH, 'r') as f:
                training_info = json.load(f)
            if training_info.get('training_complete'):
                print(f"Training verification successful:")
                print(f"- Documents processed: {training_info['num_documents']}")
                print(f"- Classes: {training_info['num_classes']}")
                print(f"- Vocabulary size: {training_info['num_words']}")
                return True
    except Exception as e:
        print(f"Training verification failed: {e}")
    return False

# Check files and training before proceeding
if not check_model_files() or not verify_training():
    print("Error: Required files missing or training incomplete.")
    print("Please run training.py first.")
    exit(1)

# Load the model
try:
    model = load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

# Load data.json
try:
    with open('data.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
        # Extract intents from the data structure
        intents = data[0] if isinstance(data, list) else data
    print("Data loaded successfully from data.json")
except Exception as e:
    print(f"Error loading data.json: {e}")
    intents = {'intents': []}

# Load words and classes
try:
    words = pickle.load(open(TEXTS_PATH, 'rb'))
    classes = pickle.load(open(LABELS_PATH, 'rb'))
    print("Words and classes loaded successfully")
except Exception as e:
    print(f"Error loading words and classes: {e}")
    exit(1)

# MySQL database connection configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Rohit41'),
    'database': os.getenv('DB_NAME', 'chatbot')
}

def connect_db():
    try:
        conn = mysql.connector.connect(**db_config)
        print("Database connection established.")
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words):
    sentence_words = clean_up_sentence(sentence)
    bag = [1 if w in sentence_words else 0 for w in words]
    return np.array(bag)

def predict_class(sentence):
    try:
        # Clean and prepare the sentence
        p = bow(sentence, words)
        
        # Get prediction from model
        res = model.predict(np.array([p]))[0]
        
        # Set error threshold for intent matching
        ERROR_THRESHOLD = 0.25
        
        # Get all results above threshold
        results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
        
        # Sort results by probability
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Return the highest probability intent if any found
        if results:
            intent = classes[results[0][0]]
            confidence = results[0][1]
            print(f"\nIntent Prediction:")
            print(f"- Input: {sentence}")
            print(f"- Predicted intent: {intent}")
            print(f"- Confidence: {confidence:.2f}")
            return intent
        
        print(f"\nNo intent matched above threshold for: {sentence}")
        return None
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        return None

def getResponse(msg, model, words, labels):
    try:
        # Preprocess the message
        s = [0] * len(words)
        s_words = nltk.word_tokenize(msg.lower())
        s_words = [lemmatizer.lemmatize(word) for word in s_words]
        
        # Create bag of words
        for se_word in s_words:
            for i, word in enumerate(words):
                if word == se_word:
                    s[i] = 1
        
        # Get prediction
        results = model.predict(np.array([s]))[0]
        results_index = np.argmax(results)
        tag = labels[results_index]
        
        # Find the matching intent from data.json
        matching_intent = None
        for intent in intents['intents']:
            if intent['tag'] == tag:
                matching_intent = intent
                break
        
        if matching_intent:
            # Return a random response from the matching intent
            response = random.choice(matching_intent['responses'])
            print(f"Selected response from intent '{tag}': {response}")
            return response
        else:
            print(f"No matching intent found for tag: {tag}")
            return "I'm sorry, I don't understand that."
            
    except Exception as e:
        print(f"Error in getResponse: {e}")
        return "I'm sorry, I encountered an error processing your request."

def chatbot_response(msg):
    try:
        # Get the predicted intent
        intent = predict_class(msg)
        
        # Get the response for the intent
        response = getResponse(msg, model, words, classes)
        
        # Log the complete interaction
        print("\n=== Chatbot Interaction ===")
        print(f"User message: {msg}")
        print(f"Matched intent: {intent}")
        print(f"Bot response: {response}")
        print("========================\n")
        
        return response
    except Exception as e:
        print(f"Error in chatbot_response: {e}")
        return "I'm sorry, I encountered an error processing your message."

def analyze_sentiment(text):
    sentiment_scores = sia.polarity_scores(text)
    compound_score = sentiment_scores['compound']
    
    if compound_score >= 0.05:
        return 'positive'
    elif compound_score <= -0.05:
        return 'negative'
    else:
        return 'neutral'

# Initialize Flask app
app = Flask(__name__, 
    static_folder='static',
    static_url_path='/static',
    template_folder='templates'
)

# Prevent caching during development
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

# Configure MIME type for SVG files
@app.after_request
def add_svg_mime_type(response):
    if response.mimetype == 'application/octet-stream' and response.path and response.path.endswith('.svg'):
        response.mimetype = 'image/svg+xml'
    return response

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/chat')
def chat():
    return render_template('chatbox.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'})
        
        # Get chatbot response
        bot_response = getResponse(user_message, model, words, classes)
        
        # Verify response exists in data.json
        response_verified = False
        for intent in intents['intents']:
            if bot_response in intent['responses']:
                response_verified = True
                break
        
        if not response_verified:
            print(f"Warning: Response '{bot_response}' not found in data.json")
        
        # Get sentiment analysis
        sentiment = analyze_sentiment(user_message)
        
        # Log the API response details
        print("\nAPI Response Details:")
        print(f"User Message: {user_message}")
        print(f"Bot Response: {bot_response}")
        print(f"Response Verified: {response_verified}")
        print(f"Sentiment Analysis: {sentiment}")
        
        return jsonify({
            'response': bot_response,
            'sentiment': sentiment,
            'verified': response_verified
        })
        
    except Exception as e:
        print(f"Error in get_response route: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/check_db_connection', methods=['GET'])
def check_db_connection():
    conn = connect_db()
    if conn:
        conn.close()
        return jsonify({"status": "success", "message": "Database connection is healthy."}), 200
    else:
        return jsonify({"status": "error", "message": "Failed to connect to the database."}), 500

@app.route("/debug-static")
def debug_static():
    static_file = os.path.join(app.static_folder, 'styles.css')
    if os.path.exists(static_file):
        with open(static_file, 'r') as f:
            content = f.read()
        return f"Static file exists and contains {len(content)} characters"
    return "Static file not found", 404

# Ensure templates directory exists and copy chatbox.html
def setup_templates():
    templates_dir = os.path.join(os.getcwd(), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Check if chatbox.html already exists in templates directory
    template_path = os.path.join(templates_dir, 'chatbox.html')
    if os.path.exists(template_path):
        print("Chatbox template already exists in templates directory.")
        return
    
    # If not in templates, try to copy from root
    src_path = os.path.join(os.getcwd(), 'chatbox.html')
    if os.path.exists(src_path):
        import shutil
        shutil.copy2(src_path, template_path)
        print("Chatbox template copied to templates directory.")
    else:
        print("Warning: chatbox.html not found in root directory, but may exist in templates directory.")

if __name__ == "__main__":
    setup_templates()
    print("Server is running at http://localhost:5000")
    app.run(debug=True)
