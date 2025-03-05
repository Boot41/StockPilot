from rest_framework import serializers
from decimal import Decimal
from .models import Product, InventoryTransaction, Order, OrderItem, StockAlert
from django.db.models import Sum
from datetime import datetime

# ✅ Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


# ✅ Single Product Serializer (For Nested Use)
class SingleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'quantity_in_stock']


# ✅ Inventory Serializer (For Graphs and Detailed Data)
class InventorySerializer(serializers.ModelSerializer):
    product = SingleProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, source='product')
    transaction_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    transaction_month = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = ['id', 'product', 'product_id', 'quantity', 'transaction_type', 'transaction_cost', 'transaction_date', 'transaction_month']

    def get_transaction_month(self, obj):
        return obj.transaction_date.strftime('%Y-%m')  # Returns 'YYYY-MM' format

    def create(self, validated_data):
        product = validated_data['product']
        quantity = validated_data['quantity']
        transaction_type = validated_data['transaction_type']

        # Ensure positive quantity
        if quantity <= 0:
            raise serializers.ValidationError({"error": "Quantity must be greater than zero."})

        # Calculate transaction cost with extra charges
        extra_charge_percent = Decimal(product.extra_charge_percent or 0)
        extra_charge = (product.price * extra_charge_percent) / Decimal(100)
        transaction_cost = (product.price + extra_charge) * quantity
        validated_data['transaction_cost'] = transaction_cost

        # Handle inventory update based on transaction type
        if transaction_type == "restock":
            product.quantity_in_stock += quantity
        elif transaction_type == "sale":
            if product.quantity_in_stock < quantity:
                raise serializers.ValidationError({"error": f"Not enough stock for {product.name}."})
            product.quantity_in_stock -= quantity

        product.save()

        # Generate stock alerts if threshold is crossed
        if product.quantity_in_stock < product.threshold_level:
            StockAlert.objects.get_or_create(product=product, resolved=False, defaults={'stock_level': product.quantity_in_stock})

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
        return obj.order.order_date.strftime('%Y-%m')  # Returns 'YYYY-MM' format

    def create(self, validated_data):
        product = validated_data['product']
        quantity = validated_data['quantity']

        # Validate stock availability
        if product.quantity_in_stock < quantity:
            raise serializers.ValidationError({"error": f"Insufficient stock for {product.name}."})

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
            StockAlert.objects.get_or_create(product=product, resolved=False, defaults={'stock_level': product.quantity_in_stock})

        return order_item


# ✅ Order Serializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer_name', 'telephone_number', 'order_date', 'status', 'total_amount', 'items']

    def get_total_amount(self, order):
        return sum(item.quantity * item.product.price for item in order.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            item_data['order'] = order
            OrderItemSerializer().create(item_data)

        return order


# ✅ Stock Alert Serializer
class StockAlertSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True)
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

    class Meta:
        fields = ['month', 'sales', 'restocks', 'stock_level']

    @staticmethod
    def get_monthly_sales_and_stock():
        """
        Fetches monthly data for sales, restocks, and stock levels.
        """
        months_data = []
        all_products = Product.objects.all()

        for product in all_products:
            # Get total sales and restocks per product
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
            for year_month in sales:
                month_str = f"{year_month['transaction_date__year']}-{str(year_month['transaction_date__month']).zfill(2)}"
                sales_amount = year_month.get('total_sales', 0)
                
                # Find the corresponding restock data for this month
                restock_data = next(
                    (item['total_restocks'] for item in restocks 
                     if item['transaction_date__year'] == year_month['transaction_date__year'] 
                     and item['transaction_date__month'] == year_month['transaction_date__month']), 0
                )
                
                stock_level = product.quantity_in_stock

                months_data.append({
                    'month': month_str,
                    'sales': Decimal(sales_amount) * product.price,
                    'restocks': Decimal(restock_data) * product.price,
                    'stock_level': Decimal(stock_level)
                })

        return months_data
