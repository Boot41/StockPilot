from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F, FloatField, Count, Avg
from .models import Product, Order, OrderItem, InventoryTransaction, ChatSession
from .utils import generate_text, clean_ai_response
import logging
import json
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.db.models.functions import Coalesce
from django.db.models import Count, Sum, Avg, F, FloatField, Q

logger = logging.getLogger(__name__)

class ChatbotAPIView(APIView):
    """Enhanced AI-powered chatbot for inventory management with real-time data integration."""
    permission_classes = [IsAuthenticated]
    logger = logging.getLogger(__name__)

    def get_token(self, request):
        """Extract and validate the token from the request."""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        try:
            # Remove 'Bearer ' prefix if present
            return auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        except Exception:
            return None

    def get_inventory_stats(self):
        """Get real-time inventory statistics."""
        try:
            # Get base statistics
            total_products = Product.objects.count()
            low_stock = Product.objects.filter(quantity_in_stock__lte=F('threshold_level')).count()
            out_of_stock = Product.objects.filter(quantity_in_stock=0).count()
            categories = Product.objects.values('category').distinct().count()
            
            # Get aggregated values with proper null handling
            value_agg = Product.objects.aggregate(
                total=Sum(F('price') * F('quantity_in_stock'), output_field=FloatField()),
                avg=Avg('price', output_field=FloatField())
            )
            
            stats = {
                'total_products': total_products,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'categories': categories,
                'total_value': value_agg['total'] if value_agg['total'] is not None else 0,
                'avg_price': value_agg['avg'] if value_agg['avg'] is not None else 0
            }

            # Get category statistics with proper null handling
            category_stats = Product.objects.values('category').annotate(
                value=Coalesce(Sum(F('price') * F('quantity_in_stock'), output_field=FloatField()), 0.0)
            ).order_by('-value')[:3]

            stats['top_categories'] = [
                {
                    'category': cat['category'],
                    'value': cat['value']
                }
                for cat in category_stats[:3]
            ]

            return stats
        except Exception as e:
            logger.error(f"Error getting inventory stats: {e}")
            return {}

    def get_product_insights(self):
        """Get detailed product insights."""
        try:
            insights = {
                'critical_stock': list(Product.objects.filter(
                    quantity_in_stock__lte=F('threshold_level')
                ).values('name', 'quantity_in_stock', 'threshold_level', 'category')),

                'top_value': list(Product.objects.annotate(
                    total_value=F('price') * F('quantity_in_stock')
                ).order_by('-total_value')[:5].values(
                    'name', 'total_value', 'price', 'quantity_in_stock'
                )),

                'zero_stock': list(Product.objects.filter(
                    quantity_in_stock=0
                ).values('name', 'category', 'threshold_level'))
            }

            return insights
        except Exception as e:
            logger.error(f"Error getting product insights: {e}")
            return {}

    def get_recent_activity(self):
        """Get recent inventory activity."""
        try:
            end_date = now()
            start_date = end_date - timedelta(days=30)

            recent_orders = Order.objects.filter(
                order_date__range=(start_date, end_date)
            ).count()

            new_products = Product.objects.filter(
                date_added__range=(start_date, end_date)
            ).count()

            inventory_updates = InventoryTransaction.objects.filter(
                transaction_date__range=(start_date, end_date)
            ).count()

            recent = {
                'orders': recent_orders,
                'new_products': new_products,
                'updated_products': inventory_updates
            }

            return recent
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return {}

    def get_user_data(self, chat_session):
        """Retrieve user data based on chat session."""
        try:
            if chat_session and chat_session.is_using_excel and chat_session.excel_data:
                return {
                    'forecast': True,
                    'data_source': 'excel',
                    'excel_data': chat_session.excel_data,
                    'inventory_analysis': self.analyze_inventory_data(chat_session.excel_data)
                }
            else:
                inventory_data = self.get_inventory_stats()
                insights = self.get_product_insights()
                activity = self.get_recent_activity()

                return {
                    'forecast': True,
                    'data_source': 'database',
                    'inventory_data': inventory_data,
                    'insights': insights,
                    'activity': activity,
                    'inventory_analysis': self.analyze_inventory_data(None)
                }
        except Exception as e:
            logger.error(f"Error getting user data: {e}")
            return {}

    def analyze_inventory_data(self, excel_data=None):
        """Analyze inventory data and generate insights."""
        try:
            if excel_data:
                products = excel_data.get('products', [])
                total_value = sum(float(p.get('price', 0)) * float(p.get('quantity_in_stock', 0)) for p in products)
                low_stock = sum(1 for p in products if float(p.get('quantity_in_stock', 0)) <= float(p.get('threshold_level', 0)))
                status = 'Critical' if low_stock > len(products) * 0.2 else 'Warning' if low_stock > 0 else 'Healthy'

                insights = [
                    f"Total inventory value: ${total_value:,.2f}",
                    f"Low stock items: {low_stock} products",
                    f"Inventory status: {status}"
                ]
            else:
                stats = self.get_inventory_stats()
                insights = self.get_product_insights()
                status = 'Critical' if stats.get('low_stock', 0) > stats.get('total_products', 0) * 0.2 else 'Warning' if stats.get('low_stock', 0) > 0 else 'Healthy'

                insights = [
                    f"Total inventory value: ${stats.get('total_value', 0):,.2f}",
                    f"Low stock items: {stats.get('low_stock', 0)} products",
                    f"Inventory status: {status}"
                ]

            return {
                'status': status,
                'insights': insights
            }
        except Exception as e:
            logger.error(f"Error analyzing inventory data: {e}")
            return {'status': 'Unknown', 'insights': []}

    def generate_context(self, query, chat_session=None):
        """Generate comprehensive context for AI response."""
        try:
            # Get Excel data if available
            excel_data = chat_session.excel_data if chat_session and chat_session.is_using_excel else None
            
            if excel_data:
                products = excel_data.get('products', [])
                stats = excel_data.get('stats', {})
            else:
                stats = self.get_inventory_stats()
                products = []

            # Build context list
            context = [
                "You are StockPilot, an advanced AI inventory management assistant. ",
                "Respond professionally using markdown formatting. ",
                "Always reference specific numbers and metrics when available.\n",

                f"\n## Data Source: {('Excel Data' if excel_data else 'Database')}",
                
                "\n## Current Inventory Statistics",
                f"- Total Products: {stats.get('total_products', 'N/A')}",
                f"- Categories: {stats.get('categories', 'N/A')}",
                f"- Total Value: ${stats.get('total_value', 0):,.2f}",
                f"- Average Price: ${stats.get('avg_price', 0):,.2f}",
                
                "\n## Stock Status",
                f"- Low Stock Items: {stats.get('low_stock_count', 0)}",
                f"- Out of Stock Items: {stats.get('out_of_stock_count', 0)}"
            ]

            # Add category breakdown if available
            if stats.get('categories_breakdown'):
                context.extend([
                    "\n## Category Breakdown"
                ])
                for category, count in stats['categories_breakdown'].items():
                    context.append(f"- {category}: {count} products")

            # Add recent chat history for context
            if chat_session and chat_session.chat_history:
                recent_history = chat_session.chat_history[-3:]  # Last 3 messages
                context.extend([
                    "\n## Recent Conversation"
                ])
                for msg in recent_history:
                    context.extend([
                        f"\nUser: {msg['user']}",
                        f"Assistant: {msg['bot']}"
                    ])

            return "\n".join(context)

        except Exception as e:
            self.logger.error(f"Error generating context: {str(e)}")
            return "Error generating context. Proceeding with limited information."

    def post(self, request, *args, **kwargs):
        """Process chat requests with enhanced context awareness."""
        try:
            # Extract data from request
            query = request.data.get('message', '').strip()
            chat_session_id = request.data.get('chat_session_id')
            excel_data = request.data.get('excel_data')

            if not query:
                self.logger.warning("Empty query received")
                return Response({
                    "error": "No query provided",
                    "resolution": "Please provide a question or command",
                    "status": "error"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get chat session if provided
            chat_session = None
            if chat_session_id:
                try:
                    chat_session = ChatSession.objects.get(id=chat_session_id)
                    self.logger.info(f"Retrieved chat session: {chat_session_id}")
                except ChatSession.DoesNotExist:
                    self.logger.warning(f"Chat session not found: {chat_session_id}")
                except Exception as e:
                    self.logger.error(f"Error retrieving chat session: {str(e)}")

            # Generate context for AI
            context = self.generate_context(query, chat_session)
            
            try:
                # Call Gemini API for response
                response = generate_text(
                    prompt=query,
                    context=context,
                    max_tokens=1000
                )
                
                if not response:
                    raise Exception("Empty response from AI")
                    
                cleaned_response = clean_ai_response(response)
                
            except Exception as e:
                self.logger.error(f"Error generating AI response: {str(e)}")
                return Response({
                    "error": "Failed to generate response",
                    "details": str(e),
                    "status": "error"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Save chat history
            if chat_session:
                chat_session.chat_history.append({
                    'user': query,
                    'bot': cleaned_response,
                    'timestamp': datetime.now().isoformat()
                })
                chat_session.save()

            return Response({
                "response": cleaned_response,
                "status": "success"
            })

        except Exception as e:
            self.logger.error(f"Unexpected error in ChatbotAPIView: {str(e)}")
            return Response({
                "error": "An unexpected error occurred",
                "details": str(e),
                "status": "error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)