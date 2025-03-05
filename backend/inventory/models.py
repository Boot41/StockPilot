from django.db import models
from decimal import Decimal
from phonenumber_field.modelfields import PhoneNumberField
from django.db.models import Sum, F, ExpressionWrapper, fields
from django.core.exceptions import ValidationError
from django.utils.timezone import now

# ✅ Product Model
class Product(models.Model):
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    threshold_level = models.PositiveIntegerField(default=5)
    extra_charge_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} | {self.price} | Stock: {self.quantity_in_stock}"

    def check_stock_alert(self):
        """
        Checks if stock is below the threshold and creates/updates stock alerts accordingly.
        """
        if self.quantity_in_stock < self.threshold_level:
            StockAlert.objects.update_or_create(
                product=self,
                resolved=False,
                defaults={'stock_level': self.quantity_in_stock}
            )
        else:
            StockAlert.objects.filter(product=self, resolved=False).update(resolved=True)

    def total_sales(self):
        """
        Returns the total quantity sold for this product.
        """
        return self.order_items.aggregate(total=Sum('quantity'))['total'] or 0

    def total_revenue(self):
        """
        Returns the total revenue generated from this product.
        """
        return self.order_items.aggregate(
            revenue=Sum(ExpressionWrapper(F('price') * F('quantity'), output_field=fields.DecimalField()))
        )['revenue'] or Decimal(0)


# ✅ Inventory Transaction Model
class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('restock', 'Restock'),
        ('sale', 'Sale'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    transaction_date = models.DateTimeField(auto_now_add=True)
    extra_charge_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    transaction_cost = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        """
        Automatically calculates transaction cost and updates product stock accordingly.
        Raises a ValidationError if there's insufficient stock for a sale.
        """
        base_price = self.product.price
        extra_charge = (base_price * Decimal(self.extra_charge_percent)) / Decimal(100)
        self.transaction_cost = (base_price + extra_charge) * self.quantity

        if self.transaction_type == 'sale':
            if self.product.quantity_in_stock < self.quantity:
                raise ValidationError({"error": "Not enough stock available for sale."})
            self.product.quantity_in_stock -= self.quantity
        elif self.transaction_type == 'restock':
            self.product.quantity_in_stock += self.quantity

        self.product.save()
        self.product.check_stock_alert()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type.capitalize()} | {self.product.name} | Cost: {self.transaction_cost}"


# ✅ Order Model
class Order(models.Model):
    ORDER_STATUSES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    customer_name = models.CharField(max_length=255)
    telephone_number = PhoneNumberField()
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUSES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def update_total_amount(self):
        """
        Updates the total amount of the order based on all associated order items.
        """
        self.total_amount = self.items.aggregate(
            total=Sum(ExpressionWrapper(F('price') * F('quantity'), output_field=fields.DecimalField()))
        )['total'] or Decimal(0)
        self.save(update_fields=['total_amount'])

    def __str__(self):
        return f"Order: {self.customer_name} | {self.total_amount}"


# ✅ OrderItem Model
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        """
        Sets the price for the order item and updates the product stock accordingly.
        """
        if not self.price:
            self.price = self.product.price * Decimal(self.quantity)
        
        if self.product.quantity_in_stock < self.quantity:
            raise ValidationError({"error": f"Not enough stock for {self.product.name}."})

        self.product.quantity_in_stock -= self.quantity
        self.product.save()
        self.product.check_stock_alert()
        super().save(*args, **kwargs)
        self.order.update_total_amount()

    def __str__(self):
        return f"{self.quantity} x {self.product.name} | {self.order.customer_name}"


# ✅ Stock Alert Model
class StockAlert(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    stock_level = models.PositiveIntegerField()
    alert_date = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"⚠️ Stock Alert: {self.product.name} at {self.stock_level}"

    @staticmethod
    def total_stock_alerts():
        return StockAlert.objects.filter(resolved=False).count()

    @staticmethod
    def low_stock_items():
        return Product.objects.filter(quantity_in_stock__lt=F('threshold_level')).count()

    @staticmethod
    def out_of_stock_items():
        return Product.objects.filter(quantity_in_stock=0).count()


# ✅ Analytics Helper Methods
def total_sales():
    return OrderItem.objects.aggregate(total=Sum('quantity'))['total'] or 0

def total_revenue():
    return Order.objects.filter(status='completed').aggregate(total=Sum('total_amount'))['total'] or Decimal(0)

def avg_order_value():
    total_orders = Order.objects.filter(status='completed').count()
    return total_revenue() / total_orders if total_orders > 0 else Decimal(0)

def unresolved_stock_alerts():
    return StockAlert.total_stock_alerts()

def inventory_health():
    return {
        "total_products_in_stock": Product.objects.aggregate(total=Sum('quantity_in_stock'))['total'] or 0,
        "low_stock_items": StockAlert.low_stock_items(),
        "out_of_stock_items": StockAlert.out_of_stock_items()
    }
