from flask import Flask, request, jsonify, render_template
import joblib
import pandas as pd
import numpy as np
from flask_cors import CORS

app = Flask(__name__, template_folder='template')
CORS(app)

# ✅ LOAD MODELS
try:
    pipeline = joblib.load("ml/model.pkl")
    le = joblib.load("ml/labelencoder.pkl")
    feature_cols = joblib.load("ml/featurecols.pkl")
    print("✅ Models and Pipeline loaded successfully")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    pipeline = le = feature_cols = None


@app.route("/")
def home():
    return "Pet Disease Prediction API is running!"


def clean_units(val):
    if pd.isna(val) or val == 'No' or val == '': return 0.0
    val = str(val).replace('°C', '').replace(' days', '').replace(' day', '').replace(' week', '').replace(' weeks', '').replace(' years', '').replace(' year', '')
    try: return float(val)
    except: return 0.0

@app.route("/predict", methods=["POST"])
def predict():
    if pipeline is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.json
        
        # Create a DataFrame with a single row
        # Ensure all expected columns are present, default to sensible values
        input_data = {}
        for col in feature_cols:
            val = data.get(col)
            if val is None:
                # Default values for missing columns
                if col in ['Age', 'Weight', 'Body_Temperature', 'Heart_Rate', 'Duration']:
                    input_data[col] = [0.0]
                else:
                    input_data[col] = ["No"] # Default for binary/categorical symptoms
            else:
                # Apply cleaning for numeric columns
                if col in ['Age', 'Weight', 'Body_Temperature', 'Heart_Rate', 'Duration']:
                    input_data[col] = [clean_units(val)]
                else:
                    input_data[col] = [val]

        df = pd.DataFrame(input_data)

        # Make prediction using the pipeline
        prediction_idx = pipeline.predict(df)[0]
        prediction_name = le.inverse_transform([prediction_idx])[0]

        confidence = 0
        if hasattr(pipeline, "predict_proba"):
            probs = pipeline.predict_proba(df)
            confidence = float(np.max(probs) * 100)

        return jsonify({
            "prediction": prediction_name,
            "confidence": round(confidence, 2),
            "status": "success"
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    # Hugging Face Spaces port is 7860
    app.run(debug=False, port=7860, host='0.0.0.0')



