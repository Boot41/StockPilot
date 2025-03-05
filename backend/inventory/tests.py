from django.test import TestCase
from .models import Product, Order, OrderItem, InventoryTransaction, StockAlert

class ProductModelTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(name="Test Product", price=Decimal("10.00"), quantity_in_stock=100)

    def test_product_string_representation(self):
        self.assertEqual(str(self.product), "Test Product | 10.00 | Extra Charge: 5.00%")

    def test_check_stock_alert(self):
        self.product.quantity_in_stock = 2
        self.product.check_stock_alert()
        self.assertTrue(StockAlert.objects.filter(product=self.product, resolved=False).exists())

class OrderModelTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(name="Test Product", price=Decimal("10.00"), quantity_in_stock=100)
        self.order = Order.objects.create(customer_name="John Doe", telephone_number="+1234567890")

    def test_order_total_amount(self):
        OrderItem.objects.create(order=self.order, product=self.product, quantity=2)
        self.order.update_total_amount()
        self.assertEqual(self.order.total_amount, Decimal("20.00"))

# Add more tests for other models and views as needed