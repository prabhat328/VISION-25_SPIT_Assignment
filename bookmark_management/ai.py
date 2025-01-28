import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get the API key from the environment
api_key = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=api_key)

def get_tag_suggestions(content: str):
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f"Suggest relevant tags for: {content}. Only return comma separated tags in the response.")
    return response.text.split(", ")  # Splitting tags by commas
