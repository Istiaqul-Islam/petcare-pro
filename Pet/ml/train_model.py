import pandas as pd
import joblib
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingClassifier

# Load dataset
df = pd.read_csv('dataset/cleaned_animal_disease_prediction.csv')

# -----------------------------
# 1. FEATURES & TARGET
# -----------------------------
feature_cols = [
    'Animal_Type','Breed','Age','Gender','Weight',
    'Symptom_1','Symptom_2','Symptom_3','Symptom_4',
    'Duration','Diarrhea','Coughing','Labored_Breathing',
    'Lameness','Skin_Lesions','Nasal_Discharge',
    'Eye_Discharge','Body_Temperature','Heart_Rate'
]

target_col = 'Disease_Prediction'

# -----------------------------
# 2. DATA CLEANING (CRITICAL)
# -----------------------------
def clean_units(val):
    if pd.isna(val) or val == 'No': return 0.0
    val = str(val).replace('°C', '').replace(' days', '').replace(' day', '').replace(' week', '').replace(' weeks', '').replace(' years', '').replace(' year', '')
    try: return float(val)
    except: return 0.0

df['Body_Temperature'] = df['Body_Temperature'].apply(clean_units)
df['Age'] = df['Age'].apply(clean_units)
df['Weight'] = df['Weight'].apply(clean_units)
df['Heart_Rate'] = df['Heart_Rate'].apply(clean_units)
df['Duration'] = df['Duration'].apply(clean_units)

# -----------------------------
# 3. REMOVE RARE CLASSES
# -----------------------------
min_samples = 5 # Back to 5 for stability
valid_classes = df[target_col].value_counts()[df[target_col].value_counts() >= min_samples].index
df = df[df[target_col].isin(valid_classes)]

X = df[feature_cols].copy()
y = df[target_col].copy()

# -----------------------------
# 3. ENCODE TARGET
# -----------------------------
le = LabelEncoder()
y = le.fit_transform(y)

# -----------------------------
# 4. COLUMN TYPES
# -----------------------------
categorical_cols = X.select_dtypes(include=['object']).columns
numeric_cols = X.select_dtypes(exclude=['object']).columns

# -----------------------------
# 5. PREPROCESSING
# -----------------------------
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_cols),
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), categorical_cols)
    ]
)

# -----------------------------
# 6. MODEL (STRONG & FAST)
# -----------------------------
model = HistGradientBoostingClassifier(
    random_state=42,
    max_iter=200,
    max_depth=10,
    learning_rate=0.1
)

# -----------------------------
# 7. PIPELINE
# -----------------------------
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', model)
])

# -----------------------------
# 8. TRAIN-TEST SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# 9. TRAIN MODEL
# -----------------------------
pipeline.fit(X_train, y_train)

# -----------------------------
# 10. EVALUATION
# -----------------------------
accuracy = pipeline.score(X_test, y_test)
print(f"Accuracy: {accuracy:.4f}")
print(f"Total Rows Used: {len(df)}")
print(f"Diseases Modeled: {len(le.classes_)}")

# -----------------------------
# 11. SAVE MODEL
# -----------------------------
os.makedirs('ml', exist_ok=True)
joblib.dump(pipeline, 'ml/model.pkl')
joblib.dump(le, 'ml/labelencoder.pkl')
joblib.dump(feature_cols, 'ml/featurecols.pkl')