import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_text(prompt, model_name="gemini-1.5-flash"):
    """Function to get AI-generated text response."""
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise Exception(f"Failed to generate analytics: {str(e)}")
    