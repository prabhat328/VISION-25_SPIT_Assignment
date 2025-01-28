import google.generativeai as genai

genai.configure(api_key="AIzaSyDc3Q5b-Im6e5jFon-oHBcSzB2WaCi61j4")

def get_tag_suggestions(content: str):
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f"Suggest relevant tags for: {content}. Only return comma separated tags in the response.")
    return response.text.split(", ")  # Splitting tags by commas
