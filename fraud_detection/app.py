import streamlit as st
import requests
import pandas as pd

API_BASE_URL = "http://127.0.0.1:8000"

# Set the page configuration
st.set_page_config(
    page_title="Fraud Detection Dashboard",
    page_icon="🛡️",
    layout="wide"
)

# Transaction Input Form
st.header("Add Transaction")
with st.form(key="transaction_form"):
    transaction_type = st.selectbox("Transaction Type", ["TRANSFER", "CASH-IN", "CASH-OUT", "DEBIT", "PAYMENT"])
    amount = st.number_input("Amount", min_value=0.0, step=0.1)
    oldbalanceOrg = st.number_input("Old Balance (Origin)", min_value=0.0, step=0.1)
    newbalanceOrig = st.number_input("New Balance (Origin)", min_value=0.0, step=0.1)
    oldbalanceDest = st.number_input("Old Balance (Destination)", min_value=0.0, step=0.1)
    newbalanceDest = st.number_input("New Balance (Destination)", min_value=0.0, step=0.1)

    submit_button = st.form_submit_button("Add Transaction")

    if submit_button:
        transaction_data = {
            "type": transaction_type,
            "amount": amount,
            "oldbalanceOrg": oldbalanceOrg,
            "newbalanceOrig": newbalanceOrig,
            "oldbalanceDest": oldbalanceDest,
            "newbalanceDest": newbalanceDest
        }

        # Ensure all required fields are present
        if all(transaction_data.values()):
            try:
                response = requests.post(f"{API_BASE_URL}/transaction", json=transaction_data)
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get("isFraud"):
                        st.warning(f"Fraudulent Transaction Detected! Amount: {amount}")
                    else:
                        st.success("Transaction added successfully!")
                else:
                    st.error(f"Failed to add transaction. Status Code: {response.status_code}. Message: {response.json().get('detail')}")
            except Exception as e:
                st.error(f"Error while sending transaction: {e}")
        else:
            st.error("Please fill all fields")

# Fetch and display transaction data
st.header("Transaction Data")
try:
    response = requests.get(f"{API_BASE_URL}/transactions")
    if response.status_code == 200:
        # Load data into a DataFrame
        transaction_data = pd.DataFrame(response.json())

        # Sort data by timestamp to ensure the most recent transactions appear first
        if not transaction_data.empty:
            transaction_data["timestamp"] = pd.to_datetime(transaction_data["timestamp"])
            transaction_data = transaction_data.sort_values(by="timestamp", ascending=False)

            # Add a serial number column starting from 1 at the beginning of the DataFrame
            transaction_data.insert(0, 'SR No.', transaction_data.index + 1)

            # Reset index to avoid the default pandas index column being shown
            transaction_data.reset_index(drop=True, inplace=True)

        # Display the data in the app with the SR No. column at the start
        st.dataframe(transaction_data)

        # Fraud Trends visualization
        st.header("Fraud Trends")
        if not transaction_data.empty:
            try:
                fraud_trends = transaction_data.groupby(transaction_data["timestamp"].dt.date)["isFraud"].sum()
                st.line_chart(fraud_trends)
            except Exception as e:
                st.error(f"Error in generating fraud trends: {e}")
    else:
        st.error(f"Failed to fetch transaction data. Status Code: {response.status_code}")
except Exception as e:
    st.error(f"Error fetching transactions: {e}")
