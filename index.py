import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set seed for reproducibility
np.random.seed(42)

# Define the 50 product list with localized base pricing metrics (in IDR)
# Fresh items represent pricing per 100g. Branded/packaged items use per-unit baseline.
products_config = {
    # --- DINGIN & CEPAT BUSUK (CHILLED & PERISHABLES) ---
    "Telur": {"base_price": 28000, "expiry_range": (7, 14), "temp": 4, "unit": "10-butir"},
    "Ayam": {"base_price": 55000, "expiry_range": (2, 5), "temp": 2, "unit": "kg"},
    "Daging Sapi": {"base_price": 145000, "expiry_range": (2, 4), "temp": 2, "unit": "kg"},
    "Daging Babi": {"base_price": 110000, "expiry_range": (2, 4), "temp": 2, "unit": "kg"},
    "Udang": {"base_price": 120000, "expiry_range": (1, 3), "temp": 0, "unit": "kg"},
    "Bakso": {"base_price": 25000, "expiry_range": (3, 7), "temp": 2, "unit": "bungkus_500g"},
    "Susu UHT": {"base_price": 19000, "expiry_range": (7, 12), "temp": 4, "unit": "botol_1L"},
    "Keju": {"base_price": 22000, "expiry_range": (30, 90), "temp": 4, "unit": "blok_165g"},
    "Yogurt": {"base_price": 10500, "expiry_range": (14, 30), "temp": 4, "unit": "cup"},

    # --- PRODUK SEGAR (FRESH PRODUCE) ---
    "Bawang Bombay": {"base_price": 40000, "expiry_range": (14, 30), "temp": 20, "unit": "kg"},
    "Bawang Putih": {"base_price": 45000, "expiry_range": (20, 45), "temp": 20, "unit": "kg"},
    "Daun Bawang": {"base_price": 2500, "expiry_range": (3, 6), "temp": 8, "unit": "ikat"},
    "Jahe": {"base_price": 35000, "expiry_range": (14, 30), "temp": 20, "unit": "kg"},
    "Jeruk": {"base_price": 28000, "expiry_range": (7, 14), "temp": 10, "unit": "kg"},
    "Nanas": {"base_price": 15000, "expiry_range": (4, 8), "temp": 12, "unit": "buah"},
    "Apel": {"base_price": 45000, "expiry_range": (14, 30), "temp": 4, "unit": "kg"},
    "Semangka": {"base_price": 45000, "expiry_range": (5, 10), "temp": 12, "unit": "buah"},
    "Durian": {"base_price": 75000, "expiry_range": (2, 5), "temp": 15, "unit": "buah"},
    "Anggur": {"base_price": 65000, "expiry_range": (5, 10), "temp": 4, "unit": "kg"},
    "Melon": {"base_price": 35000, "expiry_range": (5, 10), "temp": 12, "unit": "buah"},
    "Timun": {"base_price": 12000, "expiry_range": (5, 9), "temp": 8, "unit": "kg"},
    "Tauge": {"base_price": 5000, "expiry_range": (1, 3), "temp": 6, "unit": "bungkus_250g"},
    "Tomat": {"base_price": 18000, "expiry_range": (5, 10), "temp": 12, "unit": "kg"},
    "Kentang": {"base_price": 22000, "expiry_range": (21, 60), "temp": 15, "unit": "kg"},
    "Bayam": {"base_price": 4000, "expiry_range": (2, 4), "temp": 4, "unit": "ikat"},

    # --- KEBUTUHAN DAPUR (PANTRY STAPLES) ---
    "Tepung Terigu": {"base_price": 14000, "expiry_range": (60, 120), "temp": 24, "unit": "bungkus_1kg"},
    "Gula Pasir": {"base_price": 17500, "expiry_range": (360, 720), "temp": 25, "unit": "bungkus_1kg"},
    "Garam": {"base_price": 4000, "expiry_range": (720, 1080), "temp": 25, "unit": "bungkus_500g"},
    "Minyak Goreng": {"base_price": 18000, "expiry_range": (120, 240), "temp": 25, "unit": "pouch_1L"},
    "Minyak Zaitun": {"base_price": 85000, "expiry_range": (360, 720), "temp": 24, "unit": "botol_500ml"},
    "Indomie": {"base_price": 3500, "expiry_range": (180, 240), "temp": 25, "unit": "bungkus"},
    "Roti Tawar": {"base_price": 18000, "expiry_range": (3, 6), "temp": 24, "unit": "bungkus"},
    "Air Mineral 250ml": {"base_price": 3000, "expiry_range": (360, 720), "temp": 25, "unit": "botol"},

    # --- BUMBU & SAUS (CONDIMENTS & SAUCES) ---
    "Saus Sambal": {"base_price": 11000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Kecap Asin": {"base_price": 10000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Saus Tiram": {"base_price": 14000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Kecap Manis": {"base_price": 11000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Saus Inggris": {"base_price": 22000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Kecap Hitam": {"base_price": 11000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Kecap Ikan": {"base_price": 16000, "expiry_range": (180, 360), "temp": 24, "unit": "botol"},
    "Sasa (MSG)": {"base_price": 5000, "expiry_range": (360, 720), "temp": 25, "unit": "bungkus_250g"},
    "Lada Putih": {"base_price": 15000, "expiry_range": (180, 360), "temp": 25, "unit": "botol"},
    "Lada Hitam": {"base_price": 18000, "expiry_range": (180, 360), "temp": 25, "unit": "botol"},

    # --- MAKANAN RINGAN (SNACKS) ---
    "Chitato": {"base_price": 11500, "expiry_range": (90, 180), "temp": 25, "unit": "bungkus"},
    "Lays": {"base_price": 12000, "expiry_range": (90, 180), "temp": 25, "unit": "bungkus"},
    "Pringles": {"base_price": 24000, "expiry_range": (180, 360), "temp": 25, "unit": "kaleng"},
    "Kusuka": {"base_price": 9500, "expiry_range": (90, 180), "temp": 25, "unit": "bungkus"},
    "Tango": {"base_price": 8000, "expiry_range": (120, 240), "temp": 25, "unit": "bungkus"},
    "Oreo": {"base_price": 9500, "expiry_range": (120, 240), "temp": 25, "unit": "bungkus"},
    "Malkist": {"base_price": 7500, "expiry_range": (120, 240), "temp": 25, "unit": "bungkus"},
}

product_names = list(products_config.keys())
rows = []
start_date = datetime(2026, 1, 1)

for _ in range(1000):
    # Temporal attributes
    random_days = np.random.randint(0, 180)
    current_date = start_date + timedelta(days=random_days)
    day_of_week = current_date.weekday() + 1
    is_weekend = 1 if day_of_week >= 5 else 0  # Friday, Saturday, Sunday
    
    # Pick product and load profile
    prod = np.random.choice(product_names)
    config = products_config[prod]
    unit_type = config["unit"]
    
    # --- SMART SCALING BASED ON UNIT TYPE ---
    # High-volume individual items vs lower-volume expensive kilograms/bulks
    if unit_type in ["packet", "bag", "cup", "bottle", "can"]:
        quantity = int(np.random.randint(50, 300))      # High stock for snacks/Indomie
        base_demand = np.random.randint(40, 250)
    elif unit_type in ["kg", "piece", "loaf"]:
        quantity = int(np.random.randint(10, 80))       # Lower stock for fresh meats/produce
        base_demand = np.random.randint(10, 70)
    else:  # Multi-packs or specific grams (e.g., 10-pack eggs, 500g pack)
        quantity = int(np.random.randint(20, 120))
        base_demand = np.random.randint(15, 100)

    # Price variance due to inflation/promotions (rounded to closest 100 IDR)
    price_variance = np.random.uniform(0.9, 1.1)
    price = int(round(config["base_price"] * price_variance, -2)) 
    
    # Generate expiry and temperature variations
    expiry_days = int(np.random.randint(config["expiry_range"][0], config["expiry_range"][1] + 1))
    temperature = int(config["temp"] + np.random.randint(-2, 3))
    
    # Simple predictive forecasting logic
    predicted_demand = int(base_demand * (1.2 if is_weekend else 1.0))
    
    # Waste Risk Logic
    if expiry_days <= 3 and quantity > predicted_demand:
        risk_level = "HIGH"
    elif expiry_days <= 7 or quantity > (predicted_demand * 0.8):
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    rows.append([
        current_date.strftime("%Y-%m-%d"),
        prod,
        unit_type,         # Added feature
        quantity,
        price,
        expiry_days,
        temperature,
        day_of_week,
        is_weekend,
        predicted_demand,
        risk_level
    ])

# Create Dataframe
df = pd.DataFrame(rows, columns=[
    "DateTime", "product", "unit", "quantity", "price_IDR", "expiry_days", 
    "storage_temperature_C", "day_of_week", "is_weekend", "predicted_demand", "risk_level"
])

# Save out to CSV
df.to_csv("food_waste_indonesia_1000.csv", index=False)
print("Dataset generation complete! 'food_waste_indonesia_1000.csv' created safely with units.")