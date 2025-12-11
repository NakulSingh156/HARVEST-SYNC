# HARVEST_SYNC/backend/farmer_api/models.py (CORRECTED)

from django.db import models
from django.contrib.auth.models import User

# Define the three roles for the entire application
USER_ROLES = [
    ('F', 'Farmer'),         # Planning, Sales
    ('B', 'Buyer'),          # Ordering, Tracking
    ('L', 'Logistics Agent'),# Route Optimization, Delivery
]

class UserProfile(models.Model): # CORRECT NAME
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    
    role = models.CharField(max_length=1, choices=USER_ROLES, default='F') 
    
    farm_name = models.CharField(max_length=100, null=True, blank=True)
    farm_size_hectares = models.FloatField(default=0.0)
    
    # New Fields (Track 3.3 Enhanced)
    age = models.IntegerField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    
    FARM_TYPES = [
        ('Family', 'Family Farm'),
        ('Private', 'Private Farm'),
        ('Govt', 'Government Subsidized'),
        ('Cooperative', 'Co-operative'),
        ('Other', 'Other')
    ]
    farm_type = models.CharField(max_length=20, choices=FARM_TYPES, default='Family')

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Track 3.2: Logistics - Link Agent to Farmer
    # Only applicable if role = 'L'. The agent delivers for this specific farmer.
    serviced_farmer = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='logistics_agents')

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.get_role_display()})"
    
# Model 2: Prediction History (Stores all Yield Prediction runs)
class PredictionHistory(models.Model):
    # CRITICAL FIX: Changed FarmerProfile to UserProfile
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE) 
    
    # Input Variables (What the user supplied)
    crop_name = models.CharField(max_length=100)
    farm_area_input = models.FloatField()
    fertilizer_input = models.FloatField()
    
    # Output Variables (The results from your ML model)
    predicted_yield_rate = models.FloatField()
    predicted_total_yield = models.FloatField()
    predicted_income = models.FloatField()
    
    # Tracking
    prediction_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction for {self.crop_name} on {self.prediction_date.strftime('%Y-%m-%d')}"
        
# Model 3: Crop Listings (Foundation for the Marketplace)
class CropListing(models.Model):
    # CRITICAL FIX: Changed FarmerProfile to UserProfile
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE) 
    
    crop_name = models.CharField(max_length=100)
    available_quantity_tons = models.FloatField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Quality & History Tracking
    quality_grade = models.CharField(max_length=5, choices=[('A', 'A'), ('B', 'B'), ('C', 'C')], default='A')
    storage_type = models.CharField(max_length=100, default='Standard')
    harvest_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Status for the marketplace (e.g., Sold Out, Available)
    status = models.CharField(max_length=50, default='Available') 

    def __str__(self):
        return f"{self.crop_name} ({self.quality_grade}) by {self.farmer.user.username}"

# Model 4: Reviews and Ratings (Track 1.1)
class ReviewAndRating(models.Model):
    farmer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='reviews_received')
    buyer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='reviews_given')
    # Optional: link to a specific listing if needed, otherwise general farmer review
    listing = models.ForeignKey(CropListing, on_delete=models.SET_NULL, null=True, blank=True)
    
    rating = models.IntegerField(default=5) # 1 to 5
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating: {self.rating} for {self.farmer.user.username} by {self.buyer.user.username}"

# Model 5: Orders (Track 1.1 - Buyer Commerce Loop)
class Order(models.Model):
    listing = models.ForeignKey(CropListing, on_delete=models.CASCADE)
    buyer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='orders_made')
    
    quantity_ordered = models.FloatField(help_text="Quantity in kgs/tons depending on listing unit") 
    # To keep it simple, we assume listing is in Tons, and this field is also in Tons for consistency in math.
    # Frontend handles conversion if user enters KG.
    
    delivery_address = models.TextField()
    phone_number = models.CharField(max_length=20)
    
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Packed', 'Packed'),
        ('Shipped', 'Shipped'),         # Available for Agent Pickup
        ('Out for Delivery', 'Out for Delivery'), # In Transit
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} by {self.buyer.user.username} for {self.listing.crop_name}"