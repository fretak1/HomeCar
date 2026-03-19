from app.database import query_to_dataframe
import pandas as pd

def analyze_db():
    print("--- 🏠 HOME MARKET ANALYSIS ---")
    h_query = """
    SELECT p."propertyType", l.city, l.subcity, 
           COUNT(*) as count, 
           MIN(p.price) as min_price, 
           MAX(p.price) as max_price, 
           AVG(p.price) as avg_price
    FROM "Property" p
    JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'HOME'
    GROUP BY p."propertyType", l.city, l.subcity
    HAVING COUNT(*) > 3
    ORDER BY count DESC
    LIMIT 15
    """
    h_df = query_to_dataframe(h_query)
    print(h_df.to_string(index=False))

    print("\n--- 🚗 CAR MARKET ANALYSIS ---")
    c_query = """
    SELECT p.brand, p.model, l.city, 
           COUNT(*) as count, 
           MIN(p.price) as min_price, 
           MAX(p.price) as max_price, 
           AVG(p.price) as avg_price
    FROM "Property" p
    JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'CAR'
    GROUP BY p.brand, p.model, l.city
    HAVING COUNT(*) > 3
    ORDER BY count DESC
    LIMIT 15
    """
    c_df = query_to_dataframe(c_query)
    print(c_df.to_string(index=False))

    print("\n--- 📍 LOCATION DISTRIBUTION ---")
    l_query = 'SELECT city, COUNT(*) FROM "Location" GROUP BY city ORDER BY count DESC'
    l_df = query_to_dataframe(l_query)
    print(l_df.to_string(index=False))

if __name__ == "__main__":
    analyze_db()
