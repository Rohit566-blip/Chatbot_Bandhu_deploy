import os
import nltk
import json
import pickle
import numpy as np
import random
from nltk.stem import WordNetLemmatizer
from keras.models import Sequential
from keras.layers import Dense, Activation, Dropout
from keras.optimizers import SGD

# Download necessary NLTK data
nltk.download('punkt')
nltk.download('wordnet')

# Initialize the lemmatizer
lemmatizer = WordNetLemmatizer()

# Define file paths to match app.py
MODEL_PATH = os.path.join(os.getcwd(), 'chatbot', 'model.h5')
DATA_PATH = os.path.join(os.getcwd(), 'data.json')  # Updated to match app.py
LABELS_PATH = os.path.join(os.getcwd(), 'chatbot', 'labels.pkl')
TEXTS_PATH = os.path.join(os.getcwd(), 'chatbot', 'texts.pkl')

# Ensure chatbot directory exists
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# Load data.json
try:
    with open(DATA_PATH, 'r', encoding='utf-8') as file:
        data = json.load(file)
        # Extract intents from the data structure
        intents = data[0] if isinstance(data, list) else data
    
    # Verify data structure
    if not isinstance(intents, dict) or 'intents' not in intents:
        raise ValueError("Invalid data structure in data.json. Expected a dictionary with 'intents' key.")
    if not intents['intents']:
        raise ValueError("No intents found in data.json")
    
    print("Data loaded successfully from data.json")
    print(f"Found {len(intents['intents'])} intents")
    print("\nAvailable intents and their patterns:")
    for intent in intents['intents']:
        print(f"\nIntent: {intent['tag']}")
        print(f"Patterns: {intent['patterns']}")
        print(f"Responses: {intent['responses']}")
except FileNotFoundError:
    print(f"Error: data.json not found at {DATA_PATH}")
    print("Please ensure data.json is in the root directory of the project")
    exit(1)
except json.JSONDecodeError:
    print("Error: Invalid JSON format in data.json")
    print("Please check if the JSON file is properly formatted")
    exit(1)
except Exception as e:
    print(f"Error loading data: {e}")
    exit(1)

# Preprocessing data
words = []
classes = []
documents = []
ignore_words = ['?', '!', '.', ',', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}']

print("\nProcessing training data...")
for intent in intents['intents']:
    # Skip timetable_data intent as it contains data instead of patterns
    if intent['tag'] == 'timetable_data':
        print(f"Skipping timetable_data intent as it contains timetable information")
        continue
        
    for pattern in intent['patterns']:
        # Tokenize each pattern
        w = nltk.word_tokenize(pattern)
        words.extend(w)
        documents.append((w, intent['tag']))
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

# Lemmatize words
words = [lemmatizer.lemmatize(w.lower()) for w in words if w not in ignore_words]
words = sorted(list(set(words)))
classes = sorted(list(set(classes)))

print(f"\nTraining Data Summary:")
print(f"- Total documents: {len(documents)}")
print(f"- Total classes: {len(classes)}")
print(f"- Classes: {classes}")
print(f"- Total unique words: {len(words)}")

# Save words and classes
try:
    pickle.dump(words, open(TEXTS_PATH, 'wb'))
    pickle.dump(classes, open(LABELS_PATH, 'wb'))
    print("\nWords and classes saved successfully")
except Exception as e:
    print(f"Error saving words and classes: {e}")
    exit(1)

# Creating training data
print("\nCreating training data...")
training = []
output_empty = [0] * len(classes)

for doc in documents:
    bag = [0] * len(words)
    pattern_words = [lemmatizer.lemmatize(word.lower()) for word in doc[0]]
    
    for pattern_word in pattern_words:
        for i, w in enumerate(words):
            if w == pattern_word:
                bag[i] = 1
    
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    training.append([bag, output_row])

random.shuffle(training)
training = np.array(training, dtype=object)
train_x = np.array(list(training[:, 0]), dtype=float)
train_y = np.array(list(training[:, 1]), dtype=float)

print("Training data created successfully")

# Build model
print("\nBuilding neural network model...")
model = Sequential()
model.add(Dense(128, input_shape=(len(train_x[0]),), activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(len(train_y[0]), activation='softmax'))

# Compile model
sgd = SGD(learning_rate=0.01, decay=1e-6, momentum=0.9, nesterov=True)
model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])

# Train and save model
print("\nTraining model...")
hist = model.fit(train_x, train_y, epochs=200, batch_size=5, verbose=1)

# Save the model
try:
    model.save(MODEL_PATH, hist)
    print(f"\nModel saved successfully to {MODEL_PATH}")
except Exception as e:
    print(f"Error saving model: {e}")
    exit(1)

# Save training info for verification
training_info = {
    'num_documents': len(documents),
    'num_classes': len(classes),
    'num_words': len(words),
    'classes': classes,
    'training_complete': True,
    'model_accuracy': float(hist.history['accuracy'][-1]),
    'model_loss': float(hist.history['loss'][-1])
}

try:
    with open(os.path.join(os.getcwd(), 'chatbot', 'training_info.json'), 'w') as f:
        json.dump(training_info, f, indent=4)
    print("\nTraining information saved successfully")
except Exception as e:
    print(f"Error saving training info: {e}")
    exit(1)

print("\nTraining completed successfully!")
print(f"Final accuracy: {training_info['model_accuracy']:.2%}")
print(f"Final loss: {training_info['model_loss']:.4f}")
print("\nThe model is ready to be used by app.py")
