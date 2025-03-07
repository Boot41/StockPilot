from rest_framework import serializers
from decimal import Decimal
from datetime import datetime
from django.db.models import Sum
from .models import Product, InventoryTransaction, Order, OrderItem, StockAlert

# ✅ Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


# ✅ Single Product Serializer (For Nested Use)
class SingleProductSerializer(serializers.ModelSerializer):
    # Added category field if available on Product for AI insights.
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'quantity_in_stock', 'category']


# ✅ Inventory Serializer (For Graphs and Detailed Data)
class InventorySerializer(serializers.ModelSerializer):
    product = SingleProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True, source='product'
    )
    transaction_cost = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    transaction_month = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_id', 'quantity', 'transaction_type',
            'transaction_cost', 'transaction_date', 'transaction_month', 'extra_charge_percent'
        ]

    def get_transaction_month(self, obj):
        return obj.transaction_date.strftime('%Y-%m')  # Returns 'YYYY-MM' format

    def create(self, validated_data):
        try:
            product = validated_data['product']
            quantity = validated_data['quantity']
            transaction_type = validated_data['transaction_type']

            if quantity <= 0:
                raise serializers.ValidationError({"error": "Quantity must be greater than zero."})

            # Calculate transaction cost with extra charges (if any)
            extra_charge_percent = Decimal(product.extra_charge_percent or 0)
            extra_charge = (product.price * extra_charge_percent) / Decimal(100)
            transaction_cost = (product.price + extra_charge) * quantity
            validated_data['transaction_cost'] = transaction_cost

            # Validate stock for sales
            if transaction_type == "sale" and product.quantity_in_stock < quantity:
                raise serializers.ValidationError({"error": f"Not enough stock for {product.name}."})

            # Generate stock alerts if threshold is crossed
            if product.quantity_in_stock < product.threshold_level:
                StockAlert.objects.get_or_create(
                    product=product, resolved=False,
                    defaults={'stock_level': product.quantity_in_stock}
                )
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})

        return super().create(validated_data)


# ✅ Order Item Serializer
class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), required=False)
    product_name = serializers.ReadOnlyField(source='product.name')
    demand_month = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'product_name', 'quantity', 'price', 'demand_month']

    def get_demand_month(self, obj):
        if obj.order and obj.order.order_date:
            return obj.order.order_date.strftime('%Y-%m')
        return None

    def create(self, validated_data):
        try:
            product = validated_data['product']
            quantity = validated_data['quantity']

            if product.quantity_in_stock < quantity:
                raise serializers.ValidationError({"error": f"Insufficient stock for {product.name}."})

            # Deduct stock and save product
            product.quantity_in_stock -= quantity
            product.save()

            order_item = OrderItem.objects.create(
                product=product,
                quantity=quantity,
                price=product.price * Decimal(quantity),
                **validated_data
            )

            # Generate stock alert if necessary
            if product.quantity_in_stock < product.threshold_level:
                StockAlert.objects.get_or_create(
                    product=product, resolved=False,
                    defaults={'stock_level': product.quantity_in_stock}
                )

            return order_item
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})


# ✅ Order Serializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer_name', 'telephone_number', 'order_date', 'status', 'total_amount', 'items']

    def get_total_amount(self, order):
        try:
            return sum(item.quantity * item.product.price for item in order.items.all())
        except Exception:
            return 0

    def validate(self, data):
        # Skip validation if only updating status
        if len(data) == 1 and 'status' in data:
            return data

        items_data = data.get('items', [])
        if not items_data:
            raise serializers.ValidationError({"error": "Order must have at least one item."})

        # Validate stock for all items before creating order
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            if product.quantity_in_stock < quantity:
                raise serializers.ValidationError(
                    {"error": f"Not enough stock for {product.name}. Available: {product.quantity_in_stock}"}
                )
        return data

    def create(self, validated_data):
        try:
            items_data = validated_data.pop('items')
            order = Order.objects.create(**validated_data)
            
            # Create all items after validating the entire order
            for item_data in items_data:
                OrderItem.objects.create(order=order, **item_data)
            
            # Update order total
            order.update_total_amount()
            return order
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})
            
    def validate_status(self, value):
        if value not in ['pending', 'completed']:
            raise serializers.ValidationError("Status must be either 'pending' or 'completed'")
        return value

    def update(self, instance, validated_data):
        try:
            # Only allow updating status
            if 'status' in validated_data:
                instance.status = validated_data['status']
                instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})


# ✅ Stock Alert Serializer
class StockAlertSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True
    )
    product_name = serializers.ReadOnlyField(source='product.name')
    resolved = serializers.BooleanField(default=False)

    class Meta:
        model = StockAlert
        fields = ['id', 'product', 'product_name', 'stock_level', 'alert_date', 'resolved']


# ✅ Monthly Sales and Stock Summary Serializer (For Graphing and Reporting)
class MonthlySalesStockSummarySerializer(serializers.Serializer):
    month = serializers.CharField()  # 'YYYY-MM' format
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    restocks = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_level = serializers.DecimalField(max_digits=12, decimal_places=2)

    @staticmethod
    def get_monthly_sales_and_stock():
        """
        Fetches monthly data for sales, restocks, and stock levels.
        """
        try:
            months_data = []
            all_products = Product.objects.all()

            for product in all_products:
                # Get total sales and restocks per product grouped by month
                sales = InventoryTransaction.objects.filter(
                    product=product,
                    transaction_type="sale"
                ).values('transaction_date__year', 'transaction_date__month').annotate(
                    total_sales=Sum('quantity')
                )

                restocks = InventoryTransaction.objects.filter(
                    product=product,
                    transaction_type="restock"
                ).values('transaction_date__year', 'transaction_date__month').annotate(
                    total_restocks=Sum('quantity')
                )

                # Merge sales and restocks data for each month
                for sale in sales:
                    month_str = f"{sale['transaction_date__year']}-{str(sale['transaction_date__month']).zfill(2)}"
                    sales_amount = sale.get('total_sales', 0)

                    # Find corresponding restock data for the same month
                    restock_amount = next(
                        (item['total_restocks'] for item in restocks
                         if item['transaction_date__year'] == sale['transaction_date__year'] and
                            item['transaction_date__month'] == sale['transaction_date__month']),
                        0
                    )

                    months_data.append({
                        'month': month_str,
                        'sales': Decimal(sales_amount) * product.price,
                        'restocks': Decimal(restock_amount) * product.price,
                        'stock_level': Decimal(product.quantity_in_stock)
                    })
            return months_data
        except Exception as e:
            # Log error or handle it as needed.
            return []

class InventoryForecastSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        """ Validate file type and size """
        allowed_extensions = ['csv', 'xlsx', 'xls', 'txt', 'ods']
        file_extension = value.name.split('.')[-1].lower()

        if file_extension not in allowed_extensions:
            raise serializers.ValidationError("Unsupported file format. Allowed: CSV, Excel, TXT, ODS")

        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("File size exceeds the 5MB limit.")

        return value