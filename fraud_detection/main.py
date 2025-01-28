from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pickle
import pandas as pd
import sqlite3

load_dotenv()

app = FastAPI()

# Load the trained model
with open("fraud_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("type_encoder.pkl", "rb") as f:
    encoder = pickle.load(f)

# Connect to the SQLite database
conn = sqlite3.connect("transactions.db", check_same_thread=False)
cursor = conn.cursor()

# Create transactions table if not exists
cursor.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    amount REAL,
    isFraud BOOLEAN,
    timestamp TEXT
)
""")

# Pydantic schema for incoming transaction data
class Transaction(BaseModel):
    type: str
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float

@app.post("/transaction")
async def process_transaction(transaction: Transaction):
    print("Received transaction data:")
    print(transaction.dict())

    # Convert transaction data into a DataFrame
    transaction_data = pd.DataFrame([transaction.dict()])

    # Log the columns to verify if they match the model's expected columns
    print("Input Columns:", transaction_data.columns)

    # Align the column names with those used during training
    expected_columns = [
        'step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig',
        'oldbalanceDest', 'newbalanceDest'
    ]

    # Add a 'step' column (can be incremented or set to a placeholder value for testing)
    transaction_data['step'] = 1  # Placeholder, set to 1 for now; you can modify this if needed

    # Ensure the column names match the model's expected columns
    try:
        transaction_data = transaction_data[expected_columns]
    except KeyError as e:
        print(f"Column mismatch error: {e}")
        return {"error": f"Column mismatch error: {e}"}

    # Log the final columns after alignment
    print("Aligned Columns:", transaction_data.columns)

    # Apply LabelEncoding to the 'type' column, using the encoder loaded from disk
    try:
        transaction_data['type'] = encoder.transform(transaction_data['type'])
    except Exception as e:
        print(f"Error encoding 'type' column: {e}")
        return {"error": f"Error encoding 'type' column: {e}"}

    # Log the transformed data
    print("Transformed Transaction Data:", transaction_data)

    # Predict fraud status
    try:
        is_fraud = model.predict(transaction_data)[0]
    except Exception as e:
        print(f"Error during prediction: {e}")
        return {"error": f"Error during prediction: {e}"}

    # Insert transaction into the database
    try:
        cursor.execute("""
        INSERT INTO transactions (type, amount, isFraud, timestamp)
        VALUES (?, ?, ?, ?)
        """, (transaction.type, transaction.amount, bool(is_fraud), datetime.now()))
        conn.commit()
    except Exception as e:
        print(f"Error inserting into database: {e}")
        return {"error": f"Error inserting into database: {e}"}

    # If fraud, send an email
    if is_fraud:
        send_email_to_admin(transaction)

    return {"message": "Transaction processed", "isFraud": bool(is_fraud)}

# Function to send an email to the admin if fraud is detected
def send_email_to_admin(transaction):
    try:
        # Setup email content
        sender_email = "your_email@example.com"
        receiver_email = "admin_email@example.com"
        subject = "Fraudulent Transaction Alert"
        body = f"A fraudulent transaction has been detected:\n\n{transaction.dict()}"

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Setup email server (you can use Gmail or any SMTP server)
        server = smtplib.SMTP('smtp.example.com', 587)  # Adjust SMTP server and port
        server.starttls()
        server.login(sender_email, 'your_email_password')
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        print("Fraud alert email sent successfully.")
    except Exception as e:
        print(f"Error sending email: {e}")


@app.get("/transactions")
async def get_transactions(limit: int = 100):
    try:
        # Modify SQL query to accept dynamic limits
        cursor.execute(f"SELECT * FROM transactions ORDER BY timestamp DESC LIMIT {limit}")
        transactions = cursor.fetchall()

        # Convert the transactions to a list of dictionaries
        transactions_list = [
            {
                "id": t[0],
                "type": t[1],
                "amount": t[2],
                "isFraud": t[3],
                "timestamp": t[4],
                # Add any other fields here as needed, e.g., 'step'
            }
            for t in transactions
        ]
        return transactions_list
    except Exception as e:
        print(f"Error retrieving transactions: {e}")
        return {"error": "Failed to fetch transactions"}


@app.get("/dashboard-data")
async def get_dashboard_data():
    try:
        cursor.execute("""
        SELECT 
            COUNT(*) AS total_transactions,
            SUM(CASE WHEN isFraud = 1 THEN 1 ELSE 0 END) AS fraudulent_transactions,
            SUM(amount) AS total_amount
        FROM transactions
        """)
        result = cursor.fetchone()

        # If no result found, return defaults
        if result is None:
            return {
                "total_transactions": 0,
                "fraudulent_transactions": 0,
                "total_amount": 0
            }

        return {
            "total_transactions": result[0],
            "fraudulent_transactions": result[1],
            "total_amount": result[2],  # Include total amount
        }
    
    except Exception as e:
        print(f"Error retrieving dashboard data: {e}")
        return {"error": "Failed to fetch dashboard data"}


def send_email_to_admin(transaction):
    sender_email = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    receiver_email = os.getenv("EMAIL_RECEIVER")

    subject = "Fraud Alert: Transaction Detected"
    body = f"""
    A fraudulent transaction has been detected:
    Type: {transaction.type}
    Amount: {transaction.amount}
    """

    # Create email message
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    # Send email
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
            print("Email sent to admin.")
    except Exception as e:
        print(f"Failed to send email: {e}")
