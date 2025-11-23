import joblib
import os

class MLModel:
    def __init__(self, model_path='backend/model.pkl'):
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = None
            print(f"Warning: Model not found at {model_path}")

    def predict(self, text, confidence_threshold=0.7):
        """
        Predict attack type with confidence threshold to reduce false positives.
        If confidence is below threshold, classify as Benign.
        """
        if not self.model:
            return "Benign", 1.0  # Default fallback
        
        # Get prediction probabilities
        try:
            proba_array = self.model.predict_proba([text])[0]
            # For Pipeline, access classes from the classifier step
            if hasattr(self.model, 'named_steps') and 'classifier' in self.model.named_steps:
                classes = self.model.named_steps['classifier'].classes_
            elif hasattr(self.model, 'classes_'):
                classes = self.model.classes_
            else:
                # Fallback: get classes from predict
                prediction = self.model.predict([text])[0]
                return prediction, 0.8  # Assume high confidence if we can't get probabilities
            
            max_proba = proba_array.max()
            max_index = proba_array.argmax()
            prediction = classes[max_index]
            
            # If confidence is too low, default to Benign to reduce false positives
            if max_proba < confidence_threshold:
                # Check if Benign class exists
                if 'Benign' in classes:
                    benign_index = list(classes).index('Benign')
                    benign_proba = proba_array[benign_index]
                    # If Benign probability is reasonable, use it
                    if benign_proba > 0.3:
                        return "Benign", benign_proba
                # Otherwise, still return Benign but with lower confidence
                return "Benign", max_proba
            
            return prediction, max_proba
        except Exception as e:
            print(f"Error in prediction: {e}")
            # Fallback to simple prediction if predict_proba fails
            prediction = self.model.predict([text])[0]
            return prediction, 0.5  # Low confidence fallback
