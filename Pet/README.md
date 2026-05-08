---
title: Pet Disease Predictor
emoji: 🐾
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Pet Disease Predictor ML Service

This is a specialized Machine Learning service for the PetCare Pro platform. It uses a **Random Forest / Gradient Boosting** model trained on clinical animal disease data to predict potential health issues based on 19 distinct features.

## 🚀 Features

- **High-Performance Inference**: Powered by Scikit-Learn and Flask.
- **Robust Preprocessing**: Automatically handles units (Celsius, days, weeks) and missing data.
- **Docker Ready**: Pre-configured for deployment on Hugging Face Spaces or any cloud provider.

## 🛠️ Tech Stack

- **Python 3.9**
- **Flask** & **Flask-CORS**
- **Scikit-Learn**
- **Pandas** & **NumPy**
- **Joblib** (Model Serialization)

## 📁 Directory Structure

- `app.py`: Flask API server.
- `ml/train_model.py`: Training pipeline and data cleaning logic.
- `ml/model.pkl`: Serialized inference pipeline.
- `dataset/`: Training data (CSV).
- `Dockerfile`: Container configuration.

## 🌐 API Usage

### Predict Disease

- **Endpoint**: `POST /predict`
- **Payload**:

```json
{
  "Animal_Type": "Dog",
  "Breed": "Labrador",
  "Age": "4",
  "Gender": "Male",
  "Weight": "25.0",
  "Symptom_1": "Fever",
  "Symptom_2": "Lethargy",
  "Body_Temperature": "39.5°C",
  "Heart_Rate": "120",
  "Diarrhea": "Yes"
  ... (Up to 19 features)
}
```

## 🚢 Deployment (Hugging Face Spaces)

1. Create a new **Docker Space** on Hugging Face.
2. Upload the contents of this folder.
3. The space will automatically build and expose the API on port 7860.

---

_Note: This model is for educational and diagnostic support purposes. Always consult a certified veterinarian for official medical advice._
