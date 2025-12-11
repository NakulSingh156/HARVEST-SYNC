from django.contrib import admin
# CRITICAL FIX 3: Change FarmerProfile to UserProfile
from .models import UserProfile, PredictionHistory, CropListing 

# Register the new name
admin.site.register(UserProfile)
admin.site.register(PredictionHistory)
admin.site.register(CropListing)