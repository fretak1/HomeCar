import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """Establish a connection to the PostgreSQL database."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not found in environment variables")
    return psycopg2.connect(DATABASE_URL)

def query_to_dataframe(query, params=None):
    """Execute a SQL query and return the results as a Pandas DataFrame."""
    conn = None
    try:
        conn = get_connection()
        df = pd.read_sql_query(query, conn, params=params)
        
        # Convert datetime columns to string (ISO format) for JSON serialization
        for col in df.select_dtypes(include=['datetime', 'datetimetz']).columns:
            df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%SZ')

        # Parse PostgreSQL array strings (e.g. "{RENT,BUY}") into Python lists
        # We look for strings starting with { and ending with }
        for col in df.select_dtypes(include=['object']).columns:
            # Check if any value looks like a Postgres array string
            if df[col].dropna().astype(str).str.startswith('{').any():
                df[col] = df[col].apply(lambda x: x.strip('{}').split(',') if isinstance(x, str) and x.startswith('{') else x)
            
        # Convert NaN to None (null) for JSON serialization
        # We cast to object first to prevent Pandas from converting None back to NaN in numeric columns
        df = df.astype(object).where(pd.notnull(df), None)
            
        return df
    except Exception as e:
        print(f"Database query error: {e}")
        return pd.DataFrame()
    finally:
        if conn:
            conn.close()

def get_user_history(user_id):
    """
    Fetch a comprehensive history for a user to build a recommendation profile.
    Includes favorites, applications, transactions, and views.
    """
    query = """
    SELECT 
        'FAVORITE' as interaction_type, 
        f."propertyId", 
        p."assetType", 
        p."listingType", 
        p.price,
        p.bedrooms,
        p.bathrooms,
        p."propertyType",
        p.brand,
        p.model,
        p.year,
        p."fuelType",
        p.transmission,
        p."locationId",
        l.city,
        l.subcity,
        l.village,
        f."createdAt"
    FROM "Favorite" f
    JOIN "Property" p ON f."propertyId" = p.id
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE f."userId" = %s
    
    UNION ALL
    
    SELECT 
        'APPLICATION' as interaction_type, 
        a."propertyId", 
        p."assetType", 
        p."listingType", 
        p.price,
        p.bedrooms,
        p.bathrooms,
        p."propertyType",
        p.brand,
        p.model,
        p.year,
        p."fuelType",
        p.transmission,
        p."locationId",
        l.city,
        l.subcity,
        l.village,
        a."createdAt"
    FROM "Application" a
    JOIN "Property" p ON a."propertyId" = p.id
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE a."customerId" = %s
    
    UNION ALL
    
    SELECT 
        'TRANSACTION' as interaction_type, 
        t."propertyId", 
        p."assetType", 
        p."listingType", 
        p.price,
        p.bedrooms,
        p.bathrooms,
        p."propertyType",
        p.brand,
        p.model,
        p.year,
        p."fuelType",
        p.transmission,
        p."locationId",
        l.city,
        l.subcity,
        l.village,
        t."createdAt"
    FROM "Transaction" t
    JOIN "Property" p ON t."propertyId" = p.id
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE t."payerId" = %s AND t.status = 'COMPLETED'

    UNION ALL
    
    SELECT 
        'VIEW' as interaction_type, 
        v."propertyId", 
        p."assetType", 
        p."listingType", 
        p.price,
        p.bedrooms,
        p.bathrooms,
        p."propertyType",
        p.brand,
        p.model,
        p.year,
        p."fuelType",
        p.transmission,
        p."locationId",
        l.city,
        l.subcity,
        l.village,
        v."viewedAt" as "createdAt"
    FROM "PropertyView" v
    JOIN "Property" p ON v."propertyId" = p.id
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE v."userId" = %s
    
    ORDER BY "createdAt" DESC
    """
    return query_to_dataframe(query, (user_id, user_id, user_id, user_id))

def get_user_profile(user_id):
    """Fetch user demographic data for personalized boosting."""
    query = """
    SELECT id, kids, "marriageStatus"
    FROM "User"
    WHERE id = %s
    """
    return query_to_dataframe(query, (user_id,))

def get_user_search_history(user_id):
    """Fetch recent search filter snapshots for intent tracking."""
    query = """
    SELECT "searchType", filters, "createdAt"
    FROM "SearchFilterLog"
    WHERE "userId" = %s
    ORDER BY "createdAt" DESC
    LIMIT 20
    """
    return query_to_dataframe(query, (user_id,))

def get_user_map_history(user_id):
    """Fetch recent map exploration coordinates."""
    query = """
    SELECT lat, lng, zoom, "createdAt"
    FROM "MapInteraction"
    WHERE "userId" = %s
    ORDER BY "createdAt" DESC
    LIMIT 20
    """
    return query_to_dataframe(query, (user_id,))

def get_all_properties():
    """Fetch all properties with location data and ALL images for recommendations."""
    query = """
    SELECT 
        p.*, 
        l.city, l.subcity, l.region, l.village, l.lat, l.lng,
        (
            SELECT json_agg(json_build_object('url', url, 'isMain', "isMain"))
            FROM "PropertyImage"
            WHERE "propertyId" = p.id
        ) as images
    FROM "Property" p
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE p.status = 'AVAILABLE'
    """
    return query_to_dataframe(query)
