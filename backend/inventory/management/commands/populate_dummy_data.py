from django.utils.timezone import now
import random
from random import randint
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from inventory.models import Product, InventoryTransaction, Order, OrderItem, StockAlert
from django.db.models import F

class Command(BaseCommand):
    help = 'Populates the database with dummy data'

    def handle(self, *args, **kwargs):
        self.create_dummy_products()
        self.create_dummy_inventory()
        self.create_dummy_orders()
        self.create_dummy_order_items()
        self.create_dummy_stock_alerts()

    def create_dummy_products(self):
        category_products = {
            'Electronics': ['Laptop', 'Monitor', 'Smartphone', 'Tablet', 'Headphones'],
            'Clothing': ['Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Cap'],
            'Books': ['Novel', 'Science Book', 'History Book', 'Cookbook', 'Magazine'],
            'Furniture': ['Chair', 'Table', 'Sofa', 'Cupboard', 'Bed'],
            'Toys': ['Lego Set', 'Action Figure', 'Puzzle', 'Teddy Bear', 'RC Car']
        }

        for category, products in category_products.items():
            for product_name in products:
                product = Product.objects.create(
                    name=product_name,
                    description=f'Description of {product_name}',
                    price=Decimal(round(randint(500, 5000) * random.uniform(0.9, 1.1), 2)),
                    category=category,
                    quantity_in_stock=randint(5, 50),
                    threshold_level=randint(5, 20)
                )
                self.stdout.write(self.style.SUCCESS(f'Successfully created product: {product.name}'))

    def create_dummy_inventory(self):
        products = Product.objects.all()
        for product in products:
            for _ in range(5):  # More transactions for variety
                transaction_type = random.choice(['restock', 'sale'])
                quantity = randint(1, 10) if transaction_type == 'restock' else randint(1, min(product.quantity_in_stock, 5))
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type=transaction_type,
                    quantity=quantity,
                    transaction_date=now() - timedelta(days=randint(1, 180))
                )
            self.stdout.write(self.style.SUCCESS(f'Created inventory transactions for {product.name}'))

    def create_dummy_orders(self):
        for _ in range(20):
            order = Order.objects.create(
                order_date=now() - timedelta(days=randint(1, 180)),
                total_amount=Decimal(0),
                status=random.choice(['Pending', 'Completed', 'Shipped'])
            )
            self.stdout.write(self.style.SUCCESS(f'Created order {order.id}'))

    def create_dummy_order_items(self):
        orders = Order.objects.all()
        products = Product.objects.all()
        for order in orders:
            total_amount = Decimal(0)
            for _ in range(randint(1, 3)):
                product = random.choice(products)
                quantity = randint(1, 5)
                price = product.price * quantity
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price
                )
                total_amount += price
            order.total_amount = total_amount
            order.save()
            self.stdout.write(self.style.SUCCESS(f'Created order items for order {order.id}'))

    def create_dummy_stock_alerts(self):
        products = Product.objects.filter(quantity_in_stock__lt=F('threshold_level'))
        for product in products:
            StockAlert.objects.create(
                product=product,
                resolved=False,
                stock_level=product.quantity_in_stock
            )
            self.stdout.write(self.style.SUCCESS(f'Created stock alert for {product.name}'))
