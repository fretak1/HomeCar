from app.database import query_to_dataframe

def audit_matches():
    print("--- Subcity Counts ---")
    df = query_to_dataframe("SELECT subcity, COUNT(*) FROM \"Location\" GROUP BY subcity")
    print(df)
    
    print("\n--- Addis Ababa Home Types (BUY) ---")
    df = query_to_dataframe("""
        SELECT l.subcity, p."propertyType", COUNT(*) 
        FROM "Property" p 
        JOIN "Location" l ON p."locationId" = l.id 
        WHERE p."assetType" = 'HOME' AND 'BUY' = ANY(p."listingType")
        GROUP BY l.subcity, p."propertyType"
    """)
    print(df)

if __name__ == "__main__":
    audit_matches()
