# HARVEST_SYNC/backend/farmer_api/views.py

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from django.db import models, transaction # Fix for models.Avg usage and transaction.atomic
# Import models and ML helpers
from .models import UserProfile, CropListing, ReviewAndRating # <-- CORRECTED IMPORT
from .ml_loader import (
    yield_model, scaler, le_crop, le_state, yield_solutions_data,
    disease_model, remedies_data, disease_classes, preprocess_yield_input, find_correct_label,
    YIELD_FEATURE_COLS
)
from .utils import get_live_mandi_price, fetch_latest_mandi_data # Import utility
import numpy as np
import pandas as pd # Added pandas for DataFrame creation
import io
import tensorflow as tf
from PIL import Image

# --- 1. AUTHENTICATION VIEWS ---

@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Handles User Registration and creates the linked UserProfile."""
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        # Ensure we capture the role code from the frontend form
        role_code = request.data.get('role', 'F') 
        
        # Input Validation
        if not username or not password:
            return Response({"error": "Both username and password are required."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, 
                            status=status.HTTP_409_CONFLICT)
        
        try:
            # Create base user
            user = User.objects.create_user(username=username, password=password)
            
            # CRITICAL FIX 1: Use UserProfile and save the role
            
            # Logic for linking Logistics Agent to Farmer
            serviced_farmer_id = request.data.get('serviced_farmer_id')
            serviced_farmer_profile = None
            if role_code == 'L' and serviced_farmer_id:
                try:
                    serviced_farmer_profile = UserProfile.objects.get(id=serviced_farmer_id)
                except UserProfile.DoesNotExist:
                    print(f"Warning: Serviced farmer ID {serviced_farmer_id} not found.")

            UserProfile.objects.create(
                user=user, 
                role=role_code,
                age=request.data.get('age'),
                city=request.data.get('city'),
                farm_name=request.data.get('farm_name'), 
                farm_type=request.data.get('farm_type', 'Family'),
                latitude=request.data.get('latitude'),
                longitude=request.data.get('longitude'),
                serviced_farmer=serviced_farmer_profile
            )

            return Response({"message": "Registration successful. You can now log in."}, 
                            status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Registration Error: {e}")
            return Response({"error": "Internal server error during registration. Check server console."}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@method_decorator(csrf_exempt, name='dispatch')
class LoginAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Handles User Login and creates the session."""
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user) 
            
            # CRITICAL FIX 2: Retrieve the user's role and send it to the frontend
            try:
                profile = UserProfile.objects.get(user=user) 
                user_role = profile.role 
            except UserProfile.DoesNotExist: 
                user_role = 'F' # Default if profile somehow missing
                
            return Response({"message": "Login successful.", "username": username, "role": user_role}, 
                            status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid username or password."}, 
                            status=status.HTTP_401_UNAUTHORIZED)


# --- 2. YIELD PREDICTION VIEW ---

@method_decorator(csrf_exempt, name='dispatch')
class PredictYieldAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Handles input data and returns yield and income prediction/advice."""
    def post(self, request, format=None):
        if not yield_model:
            return Response({"error": "Yield model is not loaded."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        data = request.data
        
        try:
            # 1. INPUT VALIDATION & CLEANING
            print(f"DEBUG: Incoming Prediction Data: {data}")
            farm_area = float(data.get("farmArea"))
            year = int(data.get("year"))
            fertilizer = float(data.get("fertilizer"))
            pesticide = float(data.get("pesticide"))

            # MANUAL MAPPING FOR DEMO: 'Tomato' -> 'Potato' (since Tomato missing in ML model)
            if data.get("crop").strip().lower() == "tomato":
                 correct_crop = "Potato"
            else:
                 correct_crop = find_correct_label(data.get("crop"), le_crop)
            
            correct_state = find_correct_label(data.get("state"), le_state)
            
            print(f"DEBUG: Resolved Crop: {correct_crop}, Resolved State: {correct_state}, Season: {data.get('season')}")
            
            if not all([correct_crop, correct_state, data.get("season")]):
                print(f"DEBUG: Validation Failed! Crop: {correct_crop}, State: {correct_state}, Season: {data.get('season')}")
                return Response({"error": "Invalid crop, state, or season provided."}, status=status.HTTP_400_BAD_REQUEST)
            
            # --- 2. ML PREDICTION (Your existing logic) ---
            total_fertilizer = fertilizer * farm_area
            total_pesticide = pesticide * farm_area
            avg_annual_rainfall = 1437.8 

            input_data = {
                'Crop': correct_crop, 'Crop_Year': year, 'State': correct_state,
                'Annual_Rainfall': avg_annual_rainfall, 
                'Fertilizer': total_fertilizer, 'Pesticide': total_pesticide, 
                'Season': data.get("season"),
                'Area': 179926.6, 'Production': 16435940.0 
            }
            
            features = preprocess_yield_input(input_data)
            
            # 2.1 FIX SKLEARN WARNING: Wrap features in DataFrame
            # Use the model's own feature names to ensure exact match (handling potential trailing spaces)
            try:
                model_cols = yield_model.feature_names_in_
            except AttributeError:
                # Fallback if model doesn't have the attribute (unlikely given the warning)
                model_cols = YIELD_FEATURE_COLS
                
            input_df = pd.DataFrame(features, columns=model_cols)
            log_yield_per_hectare = yield_model.predict(input_df)
            
            predicted_yield_rate = np.expm1(log_yield_per_hectare[0])
            total_yield = predicted_yield_rate * farm_area
            
            # --- 3. BUSINESS LOGIC (Income and Advice) ---
            solution_data = yield_solutions_data.get(correct_crop, yield_solutions_data.get("Default", {}))
            
            # Fetch Live Ticker Data (Latest 100 records)
            live_ticker_data = fetch_latest_mandi_data(limit=100)

            # Fetch Live Price using Smart Match Strategy
            live_price_per_ton, source_label, match_type = get_live_mandi_price(
                correct_crop, correct_state, data_list=live_ticker_data
            )
            
            if live_price_per_ton is not None:
                price_used = live_price_per_ton
                price_source = source_label or "Live Market Data"
            else:
                # FALLBACK LOGIC: Use MSP acting as 'Average Price'
                msp = solution_data.get("msp_per_quintal", 0)
                price_used = msp * 10 # Convert Quintal to Ton
                price_source = "Average Market Price (Historical/MSP)"

            expected_income = total_yield * price_used

            benchmark = solution_data.get("yield_benchmark_tons_per_ha", 0)
            comparison_text = (f"Congratulations! The predicted yield is above the national benchmark of {benchmark:.2f} tons/ha." 
                               if predicted_yield_rate >= benchmark 
                               else f"The predicted yield is a bit less than the national benchmark of {benchmark:.2f} tons/ha.")
            main_advice = (solution_data.get("advice_if_above_benchmark", "") 
                           if predicted_yield_rate >= benchmark 
                           else solution_data.get("advice_if_below_benchmark", ""))
            
            final_solution = {
                "comparison_text": comparison_text, 
                "main_advice": main_advice,
                "msp_info": solution_data.get("msp_info", "N/A"), 
                "storage_tips": solution_data.get("storage_tips", "N/A"),
                "schemes": solution_data.get("schemes", "N/A"),
                "seasonal_advice": solution_data.get("seasonal_advice", "N/A")
            }
            
            # SANITIZED SOURCE: Always show official source to user, even if fallback used
            # We use 'Live' keyword here to ensure the Red Badge triggers in Frontend
            display_source = "Live Market Data (Official Agmarknet)"
            if match_type == "regional":
                display_source = "Live Market Data (Regional Average)"
            if match_type == "fallback":
                 # Even for fallback, user requested "Official" badge, but we can be subtle
                 # However, user explicitly said: "Even if we use the fallback price, the UI should show the 'DATA.GOV.IN (OFFICIAL AGMARKNET)' badge"
                 # And "Always show the LIVE • 2 Jan indicator"
                 display_source = "Live Market Data (Official Agmarknet)"
            
            response_data = {
                "predicted_yield_rate": float(predicted_yield_rate),
                "total_yield": float(total_yield),
                "expected_income": float(expected_income),
                "price_source": display_source, 
                "state_correction": f"{data.get('state')} -> {correct_state}",
                "crop_correction": f"{data.get('crop')} -> {correct_crop}",
                "solution": final_solution,
                "ticker_data": live_ticker_data 
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error processing yield prediction: {e}")
            return Response({"error": "Failed to process prediction. Check your inputs or contact support."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 3. DISEASE PREDICTION VIEW ---

@method_decorator(csrf_exempt, name='dispatch')
class PredictDiseaseAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Handles image upload and runs the TensorFlow model for disease detection."""
    
    def post(self, request, format=None):
        if 'image' not in request.FILES:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['image']

        try:
            # 1. Image Preprocessing
            image_bytes = file.read()
            img = Image.open(io.BytesIO(image_bytes))
            img = img.resize((96, 96)) 
            
            img_array = tf.keras.preprocessing.image.img_to_array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            # 2. Run Prediction and Get Indices
            prediction_probabilities = disease_model.predict(img_array)[0]
            sorted_indices = np.argsort(prediction_probabilities)[::-1]

            # 3. Bias Mitigation Logic (Your Custom Corn Fix)
            final_pred_index = sorted_indices[0] 
            for index in sorted_indices:
                class_name = disease_classes[index]
                if "Corn_(maize)" not in class_name:
                    final_pred_index = index
                    break
            
            raw_disease_name = disease_classes[final_pred_index]
            formatted_name = ' '.join(raw_disease_name.replace('___', ' ').replace('_', ' ').split()).lower()
            
            # 4. Get Remedy/Advice
            remedy = remedies_data.get(raw_disease_name, "No specific remedy advice available. Consult local expert.")

            return Response({
                "disease": formatted_name,
                "remedy": remedy
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error during disease prediction: {e}")
            return Response({"error": f"Failed to process the image: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 4. MARKETPLACE & PROFILE APIS (Track 2) ---

@method_decorator(csrf_exempt, name='dispatch')
class PostListingAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Allows farmers to post new crop listings."""
    # In a real app, you'd add: permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        username = request.data.get('username') # For simplicity, passing username currently
        # In real auth: user = request.user
        
        try:
            user = User.objects.get(username=username)
            # Robustness: existing users might not have a profile if created via createsuperuser
            profile, created = UserProfile.objects.get_or_create(user=user, defaults={'role': 'F'})
            
            # If just created (or role missing), defaults to 'F'. If exists, check role.
            if profile.role != 'F':
                 return Response({"error": "Only farmers can post listings."}, status=status.HTTP_403_FORBIDDEN)
            
            CropListing.objects.create(
                farmer=profile,
                crop_name=request.data.get('crop_name'),
                available_quantity_tons=request.data.get('quantity'),
                price_per_unit=request.data.get('price'),
                quality_grade=request.data.get('quality', 'A'),
                storage_type=request.data.get('storage', 'Standard'),
                # harvest_date=request.data.get('harvest_date') # Optional for now
            )
            
            return Response({"message": "Listing created successfully!"}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Post Listing Error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class InternalMarketPricesAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """
    Aggregates realtime price data from local farmer listings.
    Used for the 'Live Marketplace Rates' ticker on Buyer Dashboard.
    """
    
    def get(self, request):
        try:
            # 1. Aggregate Real Data
            # Filter for Available listings only
            real_metrics = CropListing.objects.filter(status='Available').values('crop_name').annotate(
                avg_price=models.Avg('price_per_unit'),
                count=models.Count('id')
            ).order_by('-count')[:10] # Top 10 by volume
            
            data = []
            for item in real_metrics:
                # Convert Ton Price to Kg Price (1 Ton = 1000 Kg)
                price_per_kg = item['avg_price'] / 1000 if item['avg_price'] else 0
                data.append({
                    "crop": item['crop_name'],
                    "avg_price": round(price_per_kg, 2),
                    "count": item['count'],
                    "source": "Live Listings"
                })
            
            # 2. Safety Net / Fallback (If DB is empty or sparse)
            # Ensure the UI never looks broken/empty for the demo
            # These fallback prices are ALREADY in /kg format
            if len(data) < 3:
                fallback_data = [
                    {"crop": "Potato (Market Avg)", "avg_price": 22.50, "count": 145, "source": "Market Avg"},
                    {"crop": "Onion (Market Avg)", "avg_price": 35.00, "count": 210, "source": "Market Avg"},
                    {"crop": "Tomato (Market Avg)", "avg_price": 18.00, "count": 89, "source": "Market Avg"},
                    {"crop": "Rice (Basmati)", "avg_price": 65.00, "count": 320, "source": "Market Avg"},
                    {"crop": "Wheat (Sharbati)", "avg_price": 28.00, "count": 150, "source": "Market Avg"},
                ]
                # Merge: append fallback items that aren't already in real data
                existing_crops = [d['crop'] for d in data]
                for fb in fallback_data:
                    if fb['crop'] not in existing_crops and len(data) < 10:
                        data.append(fb)
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
             print(f"Market Rates Error: {e}")
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class CropDosageAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """
    Returns the dosage dictionary for smart-filling fertilizer/pesticide.
    """
    def get(self, request):
        import json
        import os
        from django.conf import settings
        
        json_path = os.path.join(settings.BASE_DIR, 'farmer_api', 'data', 'agronomy_master.json')
        print(f"DEBUG: Loading JSON from {json_path}") # Debug print
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            return Response(data, status=status.HTTP_200_OK)
        except FileNotFoundError:
            return Response({"error": "Agronomy data not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class ListingAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Fetches all available listings."""
    
    def get(self, request):
        queryset = CropListing.objects.filter(status='Available').order_by('-created_at')
        
        # 2.1 ADVANCED FILTERING
        crop_query = request.query_params.get('crop', None)
        city_query = request.query_params.get('city', None)
        username_query = request.query_params.get('username', None) # Filter by specific farmer (for My Products)
        
        if crop_query:
            queryset = queryset.filter(crop_name__icontains=crop_query)
        if city_query:
            queryset = queryset.filter(farmer__city__icontains=city_query)
        if username_query:
            queryset = queryset.filter(farmer__user__username=username_query)

        data = []
        for lst in queryset:
            data.append({
                "id": lst.id,
                "farmer_name": lst.farmer.user.username,
                "farmer_id": lst.farmer.id,
                "farmer_city": lst.farmer.city, # Added City
                "crop_name": lst.crop_name,
                "quantity": lst.available_quantity_tons,
                "price": lst.price_per_unit,
                "quality": lst.quality_grade,
                "storage": lst.storage_type,
                "date": lst.created_at.strftime("%Y-%m-%d")
            })
        return Response(data, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class PlaceOrderAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Handles order placement with Atomic Transaction."""

    def post(self, request):
        # In real app: buyer = request.user.userprofile
        buyer_username = request.data.get('buyer_username')
        listing_id = request.data.get('listing_id')
        qty_kg = float(request.data.get('quantity_kg')) # Input in KG
        address = request.data.get('delivery_address')
        phone = request.data.get('phone_number')

        try:
            buyer_user = User.objects.get(username=buyer_username)
            # Create profile if missing (Robustness)
            buyer_profile, _ = UserProfile.objects.get_or_create(user=buyer_user, defaults={'role': 'B'})
            
            print(f"DEBUG: Processing order for buyer={buyer_username}, listing={listing_id}, qty={qty_kg}")
            with transaction.atomic():
                listing = CropListing.objects.select_for_update().get(id=listing_id)
                
                # Convert KG to Tons for calculation (1 Ton = 1000 KG)
                qty_tons = qty_kg / 1000.0
                
                if listing.available_quantity_tons < qty_tons:
                    print("DEBUG: Insufficient quantity")
                    return Response({"error": f"Insufficient quantity. Only {listing.available_quantity_tons * 1000} KG available."}, 
                                    status=status.HTTP_400_BAD_REQUEST)
                
                # Calculate Price (Price is per Ton usually, but let's assume per listing unit which is Ton)
                total_cost = float(listing.price_per_unit) * qty_tons
                
                # 1. Create Order
                from .models import Order # Late import to avoid circular issues if any
                order = Order.objects.create(
                    listing=listing,
                    buyer=buyer_profile,
                    quantity_ordered=qty_tons,
                    delivery_address=address,
                    phone_number=phone,
                    total_price=total_cost,
                    status='Pending' # Correct default status
                )
                print(f"DEBUG: Order created with ID: {order.id}")
                
                # 2. Update Inventory
                listing.available_quantity_tons -= qty_tons
                if listing.available_quantity_tons <= 0.001: # Threshold for Sold Out
                    listing.available_quantity_tons = 0
                    listing.status = 'Sold Out'
                listing.save()
                
                return Response({
                    "message": "Order placed successfully!", 
                    "order_id": order.id,
                    "new_quantity": listing.available_quantity_tons
                }, status=status.HTTP_201_CREATED)

        except CropListing.DoesNotExist:
            return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Order Error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class SubmitReviewAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    
    def post(self, request):
        buyer_username = request.data.get('buyer_username')
        farmer_id = request.data.get('farmer_id')
        rating = request.data.get('rating')
        text = request.data.get('review_text')
        
        try:
            buyer_user = User.objects.get(username=buyer_username)
            buyer_profile = UserProfile.objects.get(user=buyer_user)
            farmer_profile = UserProfile.objects.get(id=farmer_id)
            
            ReviewAndRating.objects.create(
                buyer=buyer_profile,
                farmer=farmer_profile,
                rating=rating,
                review_text=text
            )
            return Response({"message": "Review submitted!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class BuyerOrderHistoryAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Fetches order history for a specific buyer."""

    def get(self, request):
        username = request.query_params.get('username')
        try:
            user = User.objects.get(username=username)
            # Fetch orders via the related_name 'orders_made' from the Order model
            # But simpler to query Order directly filtering by buyer__user
            from .models import Order
            orders = Order.objects.filter(buyer__user=user).order_by('-created_at')
            
            data = []
            for order in orders:
                data.append({
                    "id": order.id,
                    "crop_name": order.listing.crop_name,
                    "quantity_kg": float(order.quantity_ordered) * 1000, # Convert back to KG for display
                    "total_price": float(order.total_price),
                    "status": order.status,
                    "date": order.created_at.strftime("%Y-%m-%d"),
                    "farmer_name": order.listing.farmer.user.username,
                    "farmer_id": order.listing.farmer.id
                })
            return Response(data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class FarmerOrdersAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Fetches incoming orders for a farmer."""

    def get(self, request):
        username = request.query_params.get('username')
        try:
            user = User.objects.get(username=username)
            from .models import Order
            # Filter orders where the listing belongs to this farmer
            orders = Order.objects.filter(listing__farmer__user=user).order_by('-created_at')
            
            data = []
            for order in orders:
                data.append({
                    "id": order.id,
                    "crop_name": order.listing.crop_name,
                    "quantity_kg": float(order.quantity_ordered) * 1000,
                    "total_price": float(order.total_price),
                    "status": order.status,
                    "date": order.created_at.strftime("%Y-%m-%d"),
                    "buyer_name": order.buyer.user.username,
                    "buyer_city": order.buyer.city or "Unknown",
                    "buyer_address": order.delivery_address,
                    "buyer_phone": order.phone_number
                })
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class UpdateOrderStatusAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Update order status (Accept, Reject, Progress)."""

    def post(self, request):
        order_id = request.data.get('order_id')
        new_status = request.data.get('status')
        
        try:
            from .models import Order
            order = Order.objects.get(id=order_id)
            
            with transaction.atomic():
                # Rejection Logic: Restore Inventory
                if new_status == 'Cancelled' and order.status != 'Cancelled':
                    listing = order.listing
                    # Lock listing for update
                    listing = CropListing.objects.select_for_update().get(id=listing.id)
                    listing.available_quantity_tons += order.quantity_ordered
                    if listing.available_quantity_tons > 0:
                        listing.status = 'Available'
                    listing.save()
                
                order.status = new_status
                order.save()
            
            return Response({"message": f"Order updated to {new_status}"}, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
             return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class FarmerDetailsAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Fetches public profile, stats, and reviews for a farmer."""

    def get(self, request, farmer_id):
        try:
            profile = UserProfile.objects.get(id=farmer_id)
            
            # 1. Past Sales (History)
            past_listings = CropListing.objects.filter(farmer=profile).order_by('-created_at')[:5]
            history_data = [
                {
                    "crop": l.crop_name,
                    "date": l.created_at.strftime("%Y-%m-%d"),
                    "quality": l.quality_grade,
                    "status": l.status
                } for l in past_listings
            ]
            
            # 2. Reviews & Ratings
            reviews = ReviewAndRating.objects.filter(farmer=profile).order_by('-created_at')
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 5.0 # Default to 5 if no reviews
            
            reviews_data = [
                {
                    "buyer": r.buyer.user.username,
                    "rating": r.rating,
                    "text": r.review_text,
                    "date": r.created_at.strftime("%Y-%m-%d")
                } for r in reviews[:3] # Show last 3
            ]
            
            return Response({
                "name": profile.user.username,
                "farm_name": profile.farm_name or "Family Farm",
                "farm_type": profile.get_farm_type_display(), # Use display name
                "age": profile.age,
                "city": profile.city,
                "avg_rating": round(avg_rating, 1),
                "review_count": reviews.count(),
                "history": history_data,
                "reviews": reviews_data
            }, status=status.HTTP_200_OK)
            
        except UserProfile.DoesNotExist:
            return Response({"error": "Farmer not found"}, status=status.HTTP_404_NOT_FOUND)
# --- 5. LOGISTICS APIS (Track 3) ---

@method_decorator(csrf_exempt, name='dispatch')
class FarmerShipmentAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Farmer marks an order as Shipped."""
    
    def post(self, request):
        order_id = request.data.get('order_id')
        try:
            from .models import Order
            order = Order.objects.get(id=order_id)
            if order.status == 'Packed' or order.status == 'Confirmed':
                order.status = 'Shipped'
                order.save()
                return Response({"message": "Order marked as Shipped. Notified Logistics Agent."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Order must be Packed or Confirmed to ship."}, status=status.HTTP_400_BAD_REQUEST)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class PendingDeliveryAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Agent retrieves orders assigned to them (via their linked UserProfile)."""
    
    def get(self, request):
        agent_username = request.query_params.get('username')
        try:
            agent = User.objects.get(username=agent_username)
            agent_profile = UserProfile.objects.get(user=agent)
            
            # Ensure user is a Logistics Agent
            if agent_profile.role != 'L':
                 return Response({"error": "User is not a Logistics Agent."}, status=status.HTTP_403_FORBIDDEN)
            
            # Find the farmer this agent services
            farmer = agent_profile.serviced_farmer
            if not farmer:
                 return Response({"error": "No farmer assigned to this agent."}, status=status.HTTP_400_BAD_REQUEST)
                 
            from .models import Order
            # Fetch 'Shipped' orders belonging to that farmer
            orders = Order.objects.filter(listing__farmer=farmer, status='Shipped').order_by('created_at')
            
            data = []
            for order in orders:
                data.append({
                    "id": order.id,
                    "crop": order.listing.crop_name,
                    "qty": float(order.quantity_ordered) * 1000, # In KG
                    "buyer_name": order.buyer.user.username,
                    "buyer_address": order.delivery_address,
                    "buyer_phone": order.phone_number,
                    "buyer_lat": str(order.buyer.latitude) if order.buyer.latitude else None,
                    "buyer_lng": str(order.buyer.longitude) if order.buyer.longitude else None,
                    "farmer_lat": str(farmer.latitude) if farmer.latitude else None,
                    "farmer_lng": str(farmer.longitude) if farmer.longitude else None
                })
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class StartDeliveryAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Agent marks delivery as started (Out for Delivery)."""
    
    def post(self, request):
        order_id = request.data.get('order_id')
        try:
            from .models import Order
            order = Order.objects.get(id=order_id)
            order.status = 'Out for Delivery'
            order.save()
            return Response({"message": "Delivery started! Tracking enabled."}, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class TrackOrderAPI(APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    """Returns status and location data for tracking."""
    
    def get(self, request):
        order_id = request.query_params.get('order_id')
        try:
            from .models import Order
            order = Order.objects.get(id=order_id)
            
            return Response({
                "status": order.status,
                "order_id": order.id,
                "crop": order.listing.crop_name,
                "farmer_location": {
                    "lat": order.listing.farmer.latitude,
                    "lng": order.listing.farmer.longitude
                },
                "buyer_location": {
                    "lat": order.buyer.latitude,
                    "lng": order.buyer.longitude
                }
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
             return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
