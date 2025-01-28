import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import pickle

# Load the dataset
data = pd.read_csv("creditcard.csv")  # Replace with your dataset path

# Data preprocessing
X = data.drop(columns=["Class"])  # Features
y = data["Class"]  # Target (1 = Fraudulent, 0 = Legitimate)

# Split the data into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest model
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save the model
with open("fraud_model.pkl", "wb") as f:
    pickle.dump(model, f)
