import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import joblib
import random

# Synthetic Data Generation
def generate_sqli():
    patterns = [
        "' OR 1=1 --",
        "' OR 'a'='a",
        "admin' --",
        "UNION SELECT null, null, null",
        "1; DROP TABLE users",
        "' OR 1=1 #",
        "' AND 1=1",
        "admin' #",
        "' OR '1'='1'",
        "1' ORDER BY 1 --+"
    ]
    return [p for p in patterns]

def generate_xss():
    patterns = [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "<svg/onload=alert(1)>",
        "javascript:alert(1)",
        "\"><script>alert('XSS')</script>",
        "<body onload=alert(1)>",
        "<iframe src=javascript:alert(1)>",
        "<input onfocus=alert(1) autofocus>"
    ]
    return [p for p in patterns]

def generate_benign():
    patterns = [
        "hello world",
        "search query",
        "user input",
        "login",
        "password123",
        "john.doe@example.com",
        "123 Main St",
        "product id 55",
        "contact us",
        "about page"
    ]
    return [p for p in patterns]

import os

# ... (Synthetic functions remain the same)

def load_kaggle_data():
    data = []
    
    # Check for SQLi Dataset
    if os.path.exists('backend/sqli.csv'):
        print("Loading SQLi dataset from backend/sqli.csv...")
        for encoding in ['utf-8', 'utf-16', 'latin-1']:
            try:
                df_sqli = pd.read_csv('backend/sqli.csv', encoding=encoding)
                # Assuming column 'Sentence' or 'text' exists. Adjust as needed based on actual CSV.
                col = 'Sentence' if 'Sentence' in df_sqli.columns else 'text'
                if col in df_sqli.columns:
                    for text in df_sqli[col]:
                        data.append({'text': str(text), 'label': 'SQLi'})
                print(f"Successfully loaded SQLi with encoding: {encoding}")
                break
            except Exception as e:
                print(f"Failed with {encoding}: {e}")

    # Check for XSS Dataset
    if os.path.exists('backend/xss.csv'):
        print("Loading XSS dataset from backend/xss.csv...")
        for encoding in ['utf-8', 'utf-16', 'latin-1']:
            try:
                df_xss = pd.read_csv('backend/xss.csv', encoding=encoding)
                col = 'Sentence' if 'Sentence' in df_xss.columns else 'text'
                if col in df_xss.columns:
                    for text in df_xss[col]:
                        data.append({'text': str(text), 'label': 'XSS'})
                print(f"Successfully loaded XSS with encoding: {encoding}")
                break
            except Exception as e:
                print(f"Failed with {encoding}: {e}")

    return data

# Generate or Load Dataset
kaggle_data = load_kaggle_data()

if kaggle_data:
    print(f"Loaded {len(kaggle_data)} samples from CSV files.")
    # Count existing samples to balance dataset
    label_counts = {}
    for item in kaggle_data:
        label = item['label']
        label_counts[label] = label_counts.get(label, 0) + 1
    
    # Add more benign data to balance the dataset (aim for at least 30% benign)
    # Generate more diverse benign samples
    benign_data = generate_benign() * 500  # Increase benign samples significantly
    # Add more realistic benign patterns
    additional_benign = [
        "user@example.com", "john.doe@gmail.com", "test123", "password", "login",
        "search", "query", "submit", "cancel", "back", "next", "previous",
        "username", "email", "phone", "address", "city", "state", "zip",
        "product", "item", "cart", "checkout", "payment", "order",
        "home", "about", "contact", "help", "support", "faq"
    ] * 50
    benign_data.extend(additional_benign)
    
    for item in benign_data:
        kaggle_data.append({'text': item, 'label': 'Benign'})
    
    df = pd.DataFrame(kaggle_data)
else:
    print("CSV files not found. Using synthetic data.")
    sqli_data = generate_sqli() * 50
    xss_data = generate_xss() * 50
    benign_data = generate_benign() * 100

    data = []
    for item in sqli_data:
        data.append({'text': item, 'label': 'SQLi'})
    for item in xss_data:
        data.append({'text': item, 'label': 'XSS'})
    for item in benign_data:
        data.append({'text': item, 'label': 'Benign'})
    df = pd.DataFrame(data)

df = df.sample(frac=1).reset_index(drop=True)  # Shuffle

print(f"Dataset size: {len(df)}")
print(df['label'].value_counts())

# Train Model
X = df['text']
y = df['label']

# Split data for evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Create model with better parameters to reduce false positives
# Using min_df=2 to filter out rare words that might cause false positives
# Using max_features to limit vocabulary size
vectorizer = CountVectorizer(
    ngram_range=(1, 3), 
    max_features=5000, 
    min_df=2,  # Ignore words that appear in less than 2 documents
    max_df=0.95  # Ignore words that appear in more than 95% of documents
)
nb_classifier = MultinomialNB(alpha=1.0, fit_prior=True)

# Fit vectorizer and transform
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Fit model
nb_classifier.fit(X_train_vec, y_train)

# Evaluate model
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
y_pred = nb_classifier.predict(X_test_vec)
print("\n=== Model Evaluation ===")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Test on some edge cases to check for false positives
print("\n=== False Positive Check ===")
benign_test_cases = ["hello", "password", "admin", "test123", "user@email.com", "search query"]
for test_case in benign_test_cases:
    test_vec = vectorizer.transform([test_case])
    pred = nb_classifier.predict(test_vec)[0]
    proba = nb_classifier.predict_proba(test_vec)[0]
    classes = nb_classifier.classes_
    max_proba = proba.max()
    max_idx = proba.argmax()
    pred_class = classes[max_idx]
    print(f"'{test_case}' -> {pred_class} (confidence: {max_proba:.4f})")

# Create pipeline for production use
from sklearn.pipeline import Pipeline
model = Pipeline([
    ('vectorizer', vectorizer),
    ('classifier', nb_classifier)
])

# Save Model
joblib.dump(model, 'backend/model.pkl')
print("Model saved to backend/model.pkl")

# Test with confidence scores
test_samples = ["<script>alert('test')</script>", "' OR 1=1", "hello there", "password123", "admin", "SELECT * FROM users"]
print("\n=== Test Predictions ===")
for sample in test_samples:
    pred = model.predict([sample])[0]
    try:
        proba = model.predict_proba([sample])
        classes = model.classes_
        max_proba = proba[0].max()
        max_idx = proba[0].argmax()
        print(f"'{sample}' -> {pred} (confidence: {max_proba:.4f})")
    except:
        print(f"'{sample}' -> {pred}")
