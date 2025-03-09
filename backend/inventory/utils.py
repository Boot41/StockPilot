import os
import json
import datetime
import requests
import logging
from dotenv import load_dotenv

# Configure logger
logger = logging.getLogger(__name__)
from django.db.models import Sum, Count
from .models import Product, Order, InventoryTransaction

# Load environment variables
load_dotenv()

# Gemini API setup (loaded from .env)
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")


# ✅ Function to handle inventory-related queries
def process_inventory_query(user_query):
    """
    Processes user queries related to inventory, sales, and restocking.
    Uses direct database queries when possible, otherwise sends to AI.
    """
    user_query = user_query.lower().strip()  # Normalize user query

    # ✅ 1. Direct Database Queries (Quick Responses)
    if "total product count" in user_query:
        count = Product.objects.count()
        return {"success": True, "response": {"answer": f"Total product count: {count}"}}

    elif "today's total sales" in user_query or "today's revenue" in user_query:
        today = datetime.date.today()
        total_sales = Order.objects.filter(created_at__date=today).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        return {"success": True, "response": {"answer": f"Total sales for today: ${total_sales:.2f}"}}

    elif "which products need restocking" in user_query or "low stock products" in user_query:
        low_stock_products = Product.objects.filter(quantity__lte=5).values("name", "quantity")
        if not low_stock_products:
            return {"success": True, "response": {"answer": "All products are well-stocked."}}

        product_list = [f"{p['name']} (Stock: {p['quantity']})" for p in low_stock_products]
        return {"success": True, "response": {"answer": "Products that need restocking: " + ", ".join(product_list)}}

    elif "total revenue last month" in user_query:
        last_month = datetime.date.today().replace(day=1) - datetime.timedelta(days=1)
        total_revenue = Order.objects.filter(created_at__month=last_month.month).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        return {"success": True, "response": {"answer": f"Total revenue for last month: ${total_revenue:.2f}"}}

    elif "most sold product" in user_query or "best selling product" in user_query:
        top_product = (
            Order.objects.values("orderitem__product__name")
            .annotate(total_sold=Sum("orderitem__quantity"))
            .order_by("-total_sold")
            .first()
        )
        if top_product:
            return {"success": True, "response": {"answer": f"Best-selling product: {top_product['orderitem__product__name']} (Sold: {top_product['total_sold']})"}}
        return {"success": True, "response": {"answer": "No sales data available."}}

    elif "total orders placed" in user_query:
        total_orders = Order.objects.count()
        return {"success": True, "response": {"answer": f"Total orders placed: {total_orders}"}}

    elif "inventory transactions today" in user_query:
        today = datetime.date.today()
        transactions = InventoryTransaction.objects.filter(timestamp__date=today).count()
        return {"success": True, "response": {"answer": f"Total inventory transactions today: {transactions}"}}

    # ✅ 2. If No Direct Match, Send Query to AI for Insights
    return fetch_ai_insights(user_query)


# ✅ Function to send queries to Gemini AI
def fetch_ai_insights(query):
    """Sends user query to Gemini AI for advanced analysis, trends, and optimization suggestions."""
    try:
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        # Send request to Gemini API
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            json={"query": query}
        )

        if response.status_code == 200:
            return {"success": True, "response": response.json()}
        else:
            return {
                "success": False,
                "error": f"API Error: {response.status_code}",
                "message": "Failed to get AI insights"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to connect to AI service"
        }

# ✅ Function to clean AI response
def clean_ai_response(ai_response):
    """Removes Markdown code block formatting from AI response."""
    if not ai_response:
        return ""
    
    # Remove code block markers
    cleaned = ai_response.replace('```', '')
    
    # Remove language specifiers (e.g., python, javascript)
    lines = cleaned.split('\n')
    cleaned_lines = [line for line in lines if not line.strip() in ['python', 'javascript', 'json']]
    
    return '\n'.join(cleaned_lines).strip()

# ✅ Function to generate text using Gemini API
def generate_text(prompt, model_name="gemini-1.5-flash"):
    """Generate text using Gemini API."""
    try:
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY
        }

        # Prepare payload
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }

        # Send request to Gemini API
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('candidates') and len(data['candidates']) > 0:
                if data['candidates'][0].get('content'):
                    content = data['candidates'][0]['content']
                    if content.get('parts') and len(content['parts']) > 0:
                        return content['parts'][0].get('text', '')
            return data.get('text', str(data))
        else:
            logger.error(f"Gemini API error: {response.text}")
            return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later."

    except Exception as e:
        logger.error(f"Error in generate_text: {str(e)}")
        return f"I apologize, but I'm experiencing technical difficulties: {str(e)}"
    """
    Sends user query to Gemini AI for advanced analysis, trends, and optimization suggestions.
    """
    try:
        headers = {"Content-Type": "application/json"}
        prompt = f"""
        You are an AI-powered inventory assistant. Answer user queries based on the given inventory and sales data.
        Queries can include:
        - Best-selling products
        - Sales trends (weekly, monthly)
        - Customer buying patterns
        - Inventory optimization suggestions
        - Demand forecasting

        User Query: {query}
        """

        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        # Send request to AI API
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)

        # Parse AI response
        if response.status_code == 200:
            ai_response = response.json()
            return {"success": True, "response": {"answer": ai_response}}
        else:
            return {"error": "Failed to connect to AI service", "status_code": response.status_code}

    except Exception as e:
        return {"error": "Exception occurred", "details": str(e)}  
