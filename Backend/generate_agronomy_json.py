import json
import os

# DOSAGE_DICT Copied from utils.py to avoid dependency issues
DOSAGE_DICT = {
    'Arecanut': {'f': 200, 'p': 40}, 'Arhar/Tur': {'f': 50, 'p': 15},
    'Bajra': {'f': 80, 'p': 12}, 'Banana': {'f': 400, 'p': 60},
    'Barley': {'f': 100, 'p': 20}, 'Black pepper': {'f': 150, 'p': 35},
    'Cardamom': {'f': 120, 'p': 30}, 'Cashewnut': {'f': 100, 'p': 25},
    'Castor seed': {'f': 60, 'p': 15}, 'Coconut': {'f': 250, 'p': 45},
    'Coriander': {'f': 40, 'p': 10}, 'Cotton(lint)': {'f': 150, 'p': 50},
    'Cowpea(Lobia)': {'f': 45, 'p': 12}, 'Dry chillies': {'f': 120, 'p': 40},
    'Garlic': {'f': 150, 'p': 20}, 'Ginger': {'f': 180, 'p': 35},
    'Gram': {'f': 40, 'p': 10}, 'Groundnut': {'f': 60, 'p': 20},
    'Guar seed': {'f': 30, 'p': 8}, 'Horse-gram': {'f': 25, 'p': 5},
    'Jowar': {'f': 80, 'p': 15}, 'Jute': {'f': 100, 'p': 18},
    'Khesari': {'f': 30, 'p': 6}, 'Linseed': {'f': 50, 'p': 10},
    'Maize': {'f': 150, 'p': 25}, 'Masoor': {'f': 40, 'p': 10},
    'Mesta': {'f': 80, 'p': 15}, 'Moong(Green Gram)': {'f': 40, 'p': 10},
    'Moth': {'f': 25, 'p': 5}, 'Niger seed': {'f': 30, 'p': 8},
    'Oilseeds total': {'f': 80, 'p': 20}, 'Onion': {'f': 150, 'p': 30},
    'Other Rabi pulses': {'f': 35, 'p': 10}, 'Other Cereals': {'f': 70, 'p': 15},
    'Other Kharif pulses': {'f': 35, 'p': 10}, 'Other Summer Pulses': {'f': 35, 'p': 10},
    'Peas & beans (Pulses)': {'f': 50, 'p': 12}, 'Potato': {'f': 200, 'p': 45},
    'Ragi': {'f': 80, 'p': 12}, 'Rapeseed &Mustard': {'f': 90, 'p': 20},
    'Rice': {'f': 150, 'p': 35}, 'Safflower': {'f': 50, 'p': 12},
    'Sannhamp': {'f': 40, 'p': 8}, 'Sesamum': {'f': 40, 'p': 10},
    'Small millets': {'f': 50, 'p': 10}, 'Soyabean': {'f': 60, 'p': 20},
    'Sugarcane': {'f': 300, 'p': 70}, 'Sunflower': {'f': 80, 'p': 18},
    'Sweet potato': {'f': 120, 'p': 25}, 'Tapioca': {'f': 180, 'p': 30},
    'Tobacco': {'f': 150, 'p': 40}, 'Turmeric': {'f': 180, 'p': 35},
    'Urad': {'f': 40, 'p': 10}, 'Wheat': {'f': 120, 'p': 30},
    'other oilseeds': {'f': 60, 'p': 15}
}

# 1. Base Structure for Rich Data
# Default template for crops that don't have specific rich data yet
DEFAULT_TEMPLATE = {
    "f_per_ha": 0,
    "p_per_ha": 0,
    "products": "Standard NPK mix recommended.",
    "guidelines": "Follow local agricultural university guidelines.",
    "state_wisdom": {},
    "mistakes": "Avoid over-application of pesticides."
}

# 2. Rich Data for Specific Crops (as requested)
RICH_DATA = {
    "Potato": {
        "products": "Urea, DAP, MOP, and Copper-based fungicides.",
        "guidelines": "Apply fertilizer in split doses: 50% at planting and 50% at earthing up.",
        "state_wisdom": {
            "Haryana": "In Haryana, ensure early treatment for Late Blight as winter humidity is high.",
            "Punjab": "Monitor soil moisture closely; avoid waterlogging in sandy-loam soils."
        },
        "mistakes": "Don't over-apply Nitrogen late in the season; it ruins tuber storage quality."
    },
    "Rice": {
        "products": "Urea, SSP, and Zinc Sulphate for kharif crops.",
        "guidelines": "Maintain 2-5cm standing water level for the first 2 weeks after transplanting.",
        "state_wisdom": {
            "Assam": "Watch out for Blast disease during the monsoon season.",
            "West Bengal": "Ensure proper Zinc application to prevent Khaira disease."
        },
        "mistakes": "Applying fertilizer on dry soil; always ensure the field is moist/submerged."
    },
    "Sugarcane": {
        "products": "Urea, Super Phosphate, and Potash",
        "guidelines": "Apply in 4 split doses. Requires heavy irrigation during the formative stage.",
        "state_wisdom": {},
        "mistakes": "Avoid excessive Nitrogen as it leads to vegetative growth rather than bolls." 
    },
    "Cotton(lint)": {
        "products": "DAP and Urea. Use Pheromone traps for Bollworm control.",
        "guidelines": "Follow local agricultural university guidelines.",
        "state_wisdom": {},
        "mistakes": "Avoid excessive Nitrogen as it leads to vegetative growth rather than bolls."
    },
    "Moong(Green Gram)": {
        "products": "DAP and Rhizobium culture.",
        "guidelines": "Seed treatment with fungicides is critical for rain-fed crops.",
        "state_wisdom": {},
        "mistakes": "Avoid chemicals during flowering stage."
    },
    "Groundnut": {
        "products": "Gypsum (at flowering stage) and SSP.",
        "guidelines": "Follow local agricultural university guidelines.",
        "state_wisdom": {
            "Gujarat": "Maintain soil moisture during pegging for better yield."
        },
        "mistakes": "Avoid waterlogging at any stage."
    },
    "Banana": {
        "products": "High Potassium fertilizers and micronutrient sprays.",
        "guidelines": "Follow local agricultural university guidelines.",
        "state_wisdom": {},
        "mistakes": "Don't ignore leaf spot symptoms; treat early with fungicides."
    }
}

# 3. Merge and Build Final Dictionary
master_data = {}

for crop, dosages in DOSAGE_DICT.items():
    # Start with default structure copy
    entry = DEFAULT_TEMPLATE.copy()
    entry["f_per_ha"] = dosages['f']
    entry["p_per_ha"] = dosages['p']
    
    # Override with rich data if available
    if crop in RICH_DATA:
        rich = RICH_DATA[crop]
        entry["products"] = rich["products"]
        entry["guidelines"] = rich["guidelines"]
        entry["state_wisdom"] = rich["state_wisdom"]
        entry["mistakes"] = rich["mistakes"]
    
    master_data[crop] = entry

# 4. Save to JSON
output_dir = '/Users/nakul/Desktop/HARVEST_SYNC/Backend/farmer_api/data'
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'agronomy_master.json')

with open(output_path, 'w') as f:
    json.dump(master_data, f, indent=2)

print(f"Successfully generated {output_path} with {len(master_data)} crops.")
