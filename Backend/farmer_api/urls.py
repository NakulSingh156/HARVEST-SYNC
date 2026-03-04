# HARVEST_SYNC/backend/farmer_api/urls.py

from django.urls import path
# HARVEST_SYNC/backend/farmer_api/urls.py (Add the new path)

from .views import (
    PredictYieldAPI, RegisterAPI, LoginAPI, PredictDiseaseAPI, ListingAPI, PostListingAPI, 
    FarmerDetailsAPI, PlaceOrderAPI, SubmitReviewAPI, BuyerOrderHistoryAPI, FarmerOrdersAPI, 
    UpdateOrderStatusAPI, FarmerShipmentAPI, PendingDeliveryAPI, StartDeliveryAPI, TrackOrderAPI,
    InternalMarketPricesAPI, CropDosageAPI
)

urlpatterns = [
    # ML APIs
    path('predict_yield/', PredictYieldAPI.as_view(), name='predict-yield'),
    path('predict_disease/', PredictDiseaseAPI.as_view(), name='predict-disease'),
    path('crop-dosages/', CropDosageAPI.as_view(), name='crop-dosages'),

    # AUTH APIs
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),

    # MARKETPLACE APIs
    path('listings/', ListingAPI.as_view(), name='listings'),
    path('market/internal-rates/', InternalMarketPricesAPI.as_view(), name='internal-rates'),
    path('listings/create/', PostListingAPI.as_view(), name='create-listing'),
    path('farmer/<int:farmer_id>/', FarmerDetailsAPI.as_view(), name='farmer-details'),
    
    # ORDERING & REVIEWS
    path('orders/place/', PlaceOrderAPI.as_view(), name='place-order'),
    path('reviews/submit/', SubmitReviewAPI.as_view(), name='submit-review'),
    path('orders/history/', BuyerOrderHistoryAPI.as_view(), name='buyer-history'),
    path('orders/farmer/', FarmerOrdersAPI.as_view(), name='farmer-orders'),
    path('orders/update/', UpdateOrderStatusAPI.as_view(), name='update-order'),
    
    # LOGISTICS APIs (Track 3)
    path('logistics/ship/', FarmerShipmentAPI.as_view(), name='ship-order'),
    path('logistics/pending/', PendingDeliveryAPI.as_view(), name='pending-delivery'),
    path('logistics/start/', StartDeliveryAPI.as_view(), name='start-delivery'),
    path('orders/track/', TrackOrderAPI.as_view(), name='track-order'),
]