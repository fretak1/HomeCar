import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.database import get_connection

SYSTEM_INSTRUCTION = """
You are 'HomeCar AI', a perfect and universal assistant for Ethiopia's premier marketplace. 
Your goal is to be the ultimate concierge for everything related to HomeCar, and a world-class expert on general knowledge.

Search & Response Rules:
1. Database Integrity: Use the 'Database Search Results' section to answer specific listing queries. If results are there, they ARE available.
2. Market Trends & Consultancy: You ARE allowed to provide general market trends and consultancy for the Ethiopian market (real estate and cars) based on your training data. Combine this with the provided 'Database Search Results' and 'Market Trends' for a comprehensive answer.
3. Universal Assistant: You can and MUST answer ALL and EVERY question accurately. This includes general knowledge (history, science, geography), advice, and platform-specific help.
4. Platform Expert: Effectively explain how to use HomeCar (applying for properties, owner approval, Chapa payments, security features). 
5. Comparative Analysis: Always calculate explicit mathematical differences for price comparisons using basic subtraction.
6. Language Support: Always respond in the SAME LANGUAGE as the user (e.g., if asked in Amharic, respond in Amharic).
7. Prices: Always state prices in ETB.
8. Formatting: Bold listing names and use bullet points for lists.
9. Clickable Links: Format listing titles as: [Title](/property/id).
10. Fallbacks: If no listings match perfectly, suggest alternatives from the database OR provide helpful general advice.
"""

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class DynamicLookup:
    """Handles caching of database values to avoid expensive re-queries for every message."""
    _locations: List[str] = []
    _prop_types: List[str] = []
    _brands: List[str] = []
    _last_refresh: float = 0
    _refresh_interval: int = 600  # 10 minutes

    @classmethod
    def refresh(cls):
        """Fetch unique values from the database."""
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            # 1. Fetch all unique location components
            cur.execute("SELECT DISTINCT city, subcity, village FROM \"Location\"")
            loc_rows = cur.fetchall()
            cls._locations = sorted(list(set(
                str(val).lower().strip() for row in loc_rows for val in row if val and len(str(val).strip()) > 1
            )))

            # 2. Fetch unique property types for homes
            cur.execute("SELECT DISTINCT \"propertyType\" FROM \"Property\" WHERE \"assetType\" = 'HOME'")
            cls._prop_types = sorted(list(set(str(r[0]).lower().strip() for r in cur.fetchall() if r[0])))

            # 3. Fetch unique car brands
            cur.execute("SELECT DISTINCT brand FROM \"Property\" WHERE \"assetType\" = 'CAR'")
            cls._brands = sorted(list(set(str(r[0]).lower().strip() for r in cur.fetchall() if r[0])))

            cur.close()
            conn.close()
            import time
            cls._last_refresh = time.time()
        except Exception as e:
            print(f"Error refreshing dynamic lookups: {e}")
        finally:
            if 'cur' in locals(): cur.close()
            if 'conn' in locals(): conn.close()

    @classmethod
    def get_data(cls):
        import time
        if not cls._locations or (time.time() - cls._last_refresh) > cls._refresh_interval:
            cls.refresh()
        return cls._locations, cls._prop_types, cls._brands

def _search_db(asset_type: Optional[str] = None, max_price: Optional[float] = None, min_price: Optional[float] = None, query_text: str = "", listing_intent: Optional[str] = None, bedrooms: Optional[int] = None, prop_type: Optional[str] = None, location: Optional[str] = None, bedrooms_min: bool = False, sort_mode: str = 'ASC', brand: Optional[str] = None) -> str:
    """Run a database search and return formatted results in ETB."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = '''
            SELECT p.id, p.title, p.price, p."assetType", p."propertyType", p.bedrooms,
                   l.city, l.subcity, l.village, p.brand, p.model, p.year, p."listingType"
            FROM "Property" p
            LEFT JOIN "Location" l ON p."locationId" = l.id
            WHERE p.status = 'AVAILABLE'
        '''
        params: List[Any] = []
        
        if asset_type:
            sql += ' AND p."assetType" = %s'
            params.append(asset_type.upper())
        if prop_type:
            # Re-introduce partial matching for better flexibility
            sql += ' AND p."propertyType" ILIKE %s'
            params.append(f"%{prop_type}%")
        if location:
            sql += ' AND (l.city ILIKE %s OR l.subcity ILIKE %s OR l.village ILIKE %s)'
            params.extend([f"%{location}%", f"%{location}%", f"%{location}%"])
        if max_price and max_price > 0:
            sql += " AND p.price <= %s"
            params.append(max_price)
        if min_price and min_price > 0:
            sql += " AND p.price >= %s"
            params.append(min_price)
        if bedrooms is not None:
            if bedrooms_min:
                sql += " AND p.bedrooms >= %s"
            else:
                sql += " AND p.bedrooms = %s"
            params.append(bedrooms)
            
        if listing_intent:
            if listing_intent == 'BUY':
                sql += ' AND (\'BUY\' = ANY(p."listingType"::text[]) OR \'FOR_SALE\' = ANY(p."listingType"::text[]))'
            elif listing_intent == 'RENT':
                sql += ' AND (\'RENT\' = ANY(p."listingType"::text[]) OR \'LEASE\' = ANY(p."listingType"::text[]))'

        if brand:
            sql += ' AND p.brand ILIKE %s'
            params.append(f"%{brand}%")

        if query_text:
            query_words = [w.strip() for w in query_text.split() if len(w.strip()) > 1]
            if query_words:
                for word in query_words:
                    sql += " AND (p.title ILIKE %s OR p.description ILIKE %s OR p.brand ILIKE %s)"
                    params.extend([f"%{word}%"] * 3)
        
        # Apply sorting
        order_direction = 'DESC' if sort_mode == 'DESC' else 'ASC'
        sql += f" ORDER BY p.price {order_direction} LIMIT 50"
        
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return "NO LISTINGS FOUND IN DATABASE FOR THIS SEARCH."

        output = f"Found {len(rows)} live listing(s):\n"
        for r in rows:
            p_id, title, price, asset_type_, p_type, beds, city, subcity, village, brand, model, year, listing_type_arr = r
            
            # Clean title of any newlines to ensure Markdown parsing works
            clean_title = (title or "Untitled").replace("\n", " ").replace("\r", " ").strip()
            location_label = ", ".join(filter(None, [village, subcity, city])) or "Location TBD"
            
            # Create a Markdown link for the title
            linked_title = f"[{clean_title}](/property/{p_id})"
            
            p_type_label = (p_type or "Property").capitalize()
            if asset_type_ == "CAR":
                detail = f"{brand or ''} {model or ''} {year or ''}".strip()
                lt_label = "[FOR SALE]" if any(t in str(listing_type_arr) for t in ['BUY', 'FOR_SALE']) else "[FOR RENT]"
                output += f"- {lt_label} {linked_title} — {price:,.0f} ETB | {detail} | {location_label}\n"
            else:
                detail = f"{beds or '?'} BR {p_type_label}"
                lt_label = "[FOR SALE]" if any(t in str(listing_type_arr) for t in ['BUY', 'FOR_SALE']) else "[FOR RENT]"
                output += f"- {lt_label} {linked_title} — {price:,.0f} ETB | {detail} | {location_label}\n"
        return output
    except Exception as e:
        return f"Database error details: {e}"

def _get_market_data(asset_type: str, city: Optional[str] = None, prop_type: Optional[str] = None, brand: Optional[str] = None) -> str:
    """Get market statistics from the database in ETB, separated by listing type."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        sql = '''SELECT "listingType", AVG(price), MIN(price), MAX(price), COUNT(*) 
                 FROM "Property" p
                 LEFT JOIN "Location" l ON p."locationId" = l.id
                 WHERE p."assetType" = %s AND p.status = 'AVAILABLE'
        '''
        params = [asset_type.upper()]
        
        if city:
            sql += ' AND (l.city ILIKE %s OR l.subcity ILIKE %s OR l.village ILIKE %s)'
            params.extend([f"%{city}%", f"%{city}%", f"%{city}%"])

        if prop_type:
            sql += ' AND p."propertyType" ILIKE %s'
            params.append(f"%{prop_type}%")

        if brand:
            sql += ' AND p.brand ILIKE %s'
            params.append(f"%{brand}%")
            
        sql += ' GROUP BY "listingType"'
            
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        if not rows:
            type_info = f" {brand or prop_type}" if (brand or prop_type) else ""
            return f"NO MARKET DATA FOR {type_info.strip().upper() or asset_type}."
            
        lines = []
        loc_suffix = f" in {city}" if city else ""
        type_prefix = f"{brand.upper() + ' ' if brand else ''}{prop_type.upper() + ' ' if prop_type else ''}" or f"{asset_type} "
        for r in rows:
            l_types, avg, min_p, max_p, count = r
            type_label = "SALE" if any(t in str(l_types) for t in ['BUY', 'FOR_SALE']) else "RENT"
            lines.append(f"- {type_prefix}({type_label}){loc_suffix}: {count} listings. Avg Price: {float(avg):,.0f} ETB")
            
        return "\n".join(lines)
    except Exception as e:
        return f"Database error: {e}"

def _build_context(message: str) -> str:
    """Analyze message to detect intent and build context from database."""
    clean_msg = message.lower()
    
    # ... previous logic ...
    
    # Intent Detection
    # Use word boundaries to avoid 'currently' matching 'rent'
    is_rent = any(re.search(rf'\b{word}\b', clean_msg) for word in ['rent', 'lease', 'monthly', 'per month'])
    is_buy = any(re.search(rf'\b{word}\b', clean_msg) for word in ['buy', 'purchase', 'sale', 'for sale', 'total price'])
    
    intent = None
    if is_rent and not is_buy: intent = 'RENT'
    elif is_buy and not is_rent: intent = 'BUY'
    
    # Load Dynamic Data
    db_locations, db_types, db_brands = DynamicLookup.get_data()

    # Global Ethiopia Locations (Knowledge Base)
    GLOBAL_LOCATIONS = {
        'Regions': ['afar', 'amhara', 'benishangul-gumuz', 'central ethiopia', 'gambela', 'harari', 'oromia', 'sidama', 'somali', 'south ethiopia', 'south west ethiopia', 'tigray'],
        'Major Cities': ['bahir dar', 'gondar', 'dessie', 'kombolcha', 'debre birhan', 'adama', 'nazret', 'bishoftu', 'debre zeit', 'jimma', 'shashemene', 'nekemte', 'sebeta', 'awassa', 'hawassa', 'jijiga', 'bonga', 'mekele', 'mekelle', 'adigrat', 'axum', 'shire', 'dire dawa'],
        'Addis Sub-Cities': ['addis ketema', 'akaki kality', 'arada', 'bole', 'gulele', 'kirkos', 'kolfe keraniyo', 'lideta', 'nifas silk-lafto', 'nefas silk', 'yeka'],
        'Addis Neighborhoods': [
            'ayat', 'summit', 'cmc', 'old airport', 'piazza', 'piassa', 'kazanchis', 'merkato', 'saris', 'kality', 'lafto', 'mexico', 
            'olympia', 'gerji', 'megenagna', 'gotera', 'sar bet', 'lebu', 'jemo', 'bulbula', 'kotebe', 'ferensay', 'shola', '22', 
            '4 kilo', '5 kilo', '6 kilo', 'bole arabsa', 'hayat', 'jackros', 'imperial', 'hayahulet', 'totot', 'salite mihret'
        ]
    }
    all_global_locs = [loc for sublist in GLOBAL_LOCATIONS.values() for loc in sublist]

    # Amharic Translation Map (Expanded for Global Knowledge)
    AM_MAP = {
        'አዲስ አበባ': 'addis', 'አዲስ አበበ': 'addis', 'ቦሌ': 'bole', 'የካ': 'yeka', 'አያት': 'ayat',
        'ሰሚት': 'summit', 'ሊደታ': 'lideta', 'ቂርቆስ': 'kirkos', 'አራዳ': 'arada', 'አዲስ ከተማ': 'addis ketema',
        'ጉለሌ': 'gulele', 'ኮልፌ ቀራኒዮ': 'kolfe keraniyo', 'ንፋስ ስልክ': 'nifas silk',
        'ፒያሳ': 'piazza', 'ኦሊምፒያ': 'olympia',
        'ካዛንቺስ': 'kazanchis', 'ገርጂ': 'gerji', 'መገናኛ': 'megenagna', 'ሜክሲኮ': 'mexico',
        'ሳሪስ': 'saris', 'ላፍቶ': 'lafto', 'ቃሊቲ': 'kality', 'አቃቂ': 'akaki', 'ቃሊቲ': 'kality',
        'አራት ኪሎ': '4 kilo', 'አምስት ኪሎ': '5 kilo', 'ስድስት ኪሎ': '6 kilo', 'ሀያ ሁለት': '22',
        'ጎተራ': 'gotera', 'ለቡ': 'lebu', 'ጀሞ': 'jemo', 'ቡልቡላ': 'bulbula', 'ኮተቤ': 'kotebe',
        'ፈረንሳይ': 'ferensay', 'ሾላ': 'shola', 'መገናኛ': 'megenagna', 'ሲኤምሲ': 'cmc',
        'ባህር ዳር': 'bahir dar', 'ጎንደር': 'gondar', 'ደሴ': 'dessie', 'ኮምቦልቻ': 'kombolcha',
        'ደብረ ብርሃን': 'debre birhan', 'አዳማ': 'adama', 'ናዝሬት': 'nazret', 'ቢሾፍቱ': 'bishoftu',
        'ደብረ ዘይት': 'debre zeit', 'ጅማ': 'jimma', 'ሻሸመኔ': 'shashemene', 'ነቀምቴ': 'nekemte',
        'ሰበታ': 'sebeta', 'ሀዋሳ': 'hawassa', 'ጂጂጋ': 'jijiga', 'ቦንጋ': 'bonga', 'መቀሌ': 'mekelle',
        'አዲግራት': 'adigrat', 'አክሱም': 'axum', 'ሽሬ': 'shire', 'ድሬዳዋ': 'dire dawa',
        # Additional types
        'ቪላ': 'villa', 'አፓርታማ': 'apartment', 'ኮንዶሚኒየም': 'condominium', 'ኮንዶ': 'condo', 'ስቱዲዮ': 'studio',
        'ታውን ሃውስ': 'townhouse', 'ህንፃ': 'building', 'ህፃን': 'building', '3*3': '3*3', '3*4': '3*4', '4*4': '4*4', '4*5': '4*5', '5*5': '5*5', '5*6': '5*6', '6*6': '6*6', '6*7': '6*7',
        'ቶዮታ': 'toyota', 'ሱዙኪ': 'suzuki', 'መርሴዲስ': 'mercedes',
        'ሃዩንዳይ': 'hyundai', 'ፎርድ': 'ford', 'ሆንዳ': 'honda', 'መርከስ': 'mercedes'
    }

    # Asset Detection
    assets = []
    if any(w in clean_msg for w in (['car', 'vehicle', 'suzuki', 'vitz', 'መኪና', 'ቶዮታ', 'ሱዙኪ'] + db_brands)): assets.append('CAR')
    if any(w in clean_msg for w in (['house', 'apartment', 'home', 'villa', 'condo', 'studio', 'townhouse', 'ቤት', 'ቪላ', 'አፓርታማ'] + db_types)): assets.append('HOME')
    
    if not assets: assets = ['CAR', 'HOME']

    # Property Type Detection
    prop_type = None
    prop_type_match = None
    all_prop_types = list(set(db_types + ['apartment', 'villa', 'condo', 'studio', 'townhouse', 'guest house', 'compound', 'building', '3*3', '3*4', '4*4', '4*5', '5*5', '5*6', '6*6', '6*7']))
    for t in all_prop_types:
        if t in clean_msg:
            prop_type = t
            prop_type_match = t
            break
    if not prop_type:
        for am, en in AM_MAP.items():
            if am in clean_msg and any(pt in en for pt in ['villa', 'apartment', 'condo', 'studio', 'townhouse', 'building', '3*3', '3*4', '4*4', '4*5', '5*5', '5*6', '6*6', '6*7']):
                prop_type = en
                prop_type_match = am
                break

    # Brand Detection
    brand = None
    brand_match = None
    sorted_brands = sorted(db_brands, key=len, reverse=True)
    for b in sorted_brands:
        if b in clean_msg:
            brand = b
            brand_match = b
            break
        parts = b.replace('-', ' ').split()
        if any(len(p) > 3 and p in clean_msg for p in parts):
            brand = b
            brand_match = b # Best effort
            break
    if not brand:
        for am, en in AM_MAP.items():
            if am in clean_msg and en in [b.lower() for b in db_brands]:
                brand = en
                brand_match = am
                break

    # Location Detection
    detected_locations = []
    # Combine DB locations with Global Knowledge locations for robust detection
    combined_locs = list(set(db_locations + all_global_locs))
    sorted_locs = sorted(combined_locs, key=len, reverse=True)
    taken_indices = set()
    
    # Check Amharic Variations First (locations)
    for am, en in AM_MAP.items():
        # Optimization: Only check if the translation matches a known global or DB location
        if en in combined_locs or en == 'addis':
            for match in re.finditer(re.escape(am), clean_msg):
                start, end = match.span()
                if not any(i in taken_indices for i in range(start, end)):
                    detected_locations.append((am, en))
                    for i in range(start, end): taken_indices.add(i)

    # Standard check
    for s in sorted_locs:
        for match in re.finditer(re.escape(s), clean_msg):
            start, end = match.span()
            # If this match overlaps with a previously detected (longer) location, skip it
            if any(i in taken_indices for i in range(start, end)):
                continue
            
            detected_locations.append((s, s))
            for i in range(start, end): taken_indices.add(i)
    
    # Manual overrides for capital city variations
    for variant in ['addis ababa', 'addis abeba']:
        for match in re.finditer(re.escape(variant), clean_msg):
            start, end = match.span()
            if not any(i in taken_indices for i in range(start, end)):
                detected_locations.append((variant, 'addis'))
                for i in range(start, end): taken_indices.add(i)
            
    # Normalize and deduplicate locations by search_val
    unique_locations = {}
    for match_str, search_val in detected_locations:
        if search_val not in unique_locations:
            unique_locations[search_val] = match_str
    
    # Bedroom Detection
    bedrooms = None
    beds_min = False
    bed_match = re.search(r'(\d+)[\-\s\+]*?(?:bedroom|br|bed)', clean_msg)
    if bed_match:
        bedrooms = int(bed_match.group(1))
        if re.search(rf'{bedrooms}\s*(?:\+|and\s+above|or\s+more|plus)', clean_msg):
            beds_min = True

    # Price Detection (Improved to handle 'million', 'm', 'k' and Amharic suffixes)
    def _parse_price(text: str) -> Optional[float]:
        if not text: return None
        clean_val = text.replace(',', '')
        try:
            multiplier = 1
            if re.search(r'(?:million|m|ሚሊዮን)', clean_msg.lower()): multiplier = 1_000_000
            elif re.search(r'(?:k|thousand|ሺ)', clean_msg.lower()): multiplier = 1_000
            
            val_match = re.search(r'[\d.]+', clean_val)
            if not val_match: return None
            return float(val_match.group(0)) * multiplier
        except: return None

    max_price = None
    min_price = None
    
    # English & Amharic (Prefix/Suffix)
    max_match = re.search(r'(?:under|below|less than|max|up to|ከ)\s*([\d,.kbm\s]+(?:million|m|k|ሚሊዮን|ሺ)?)\s*(?:በታች)?', clean_msg)
    if max_match and ('under' in clean_msg or 'below' in clean_msg or 'less than' in clean_msg or 'max' in clean_msg or 'up to' in clean_msg or 'በታች' in clean_msg):
        max_price = _parse_price(max_match.group(1).strip())
    
    min_match = re.search(r'(?:above|more than|over|at least|min|ከ)\s*([\d,.kbm\s]+(?:million|m|k|ሚሊዮን|ሺ)?)\s*(?:በላይ)?', clean_msg)
    if min_match and ('above' in clean_msg or 'more than' in clean_msg or 'over' in clean_msg or 'at least' in clean_msg or 'min' in clean_msg or 'በላይ' in clean_msg):
        min_price = _parse_price(min_match.group(1).strip())

    range_match = re.search(r'between\s*([\d,.kbm\s]+(?:million|m|k|ሚሊዮን|ሺ)?)\s*and\s*([\d,.kbm\s]+(?:million|m|k|ሚሊዮን|ሺ)?)', clean_msg)
    if range_match:
        min_price = _parse_price(range_match.group(1).strip())
        max_price = _parse_price(range_match.group(2).strip())

    # Sorting Detection
    sort_mode = 'ASC'
    sort_keywords = ['expensive', 'most', 'highest', 'top', 'priciest', 'premium', 'cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least']
    if any(w in clean_msg for w in ['expensive', 'most', 'highest', 'top', 'priciest', 'premium']): sort_mode = 'DESC'
    elif any(w in clean_msg for w in ['cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least']): sort_mode = 'ASC'

    # Filter out common terms to make query_text cleaner
    query_text = clean_msg
    for search_val, match_str in unique_locations.items():
        query_text = query_text.replace(match_str, '').replace(search_val, '')
    if prop_type: query_text = query_text.replace(prop_type, '')
    if brand: query_text = query_text.replace(brand, '')
    
    # Aggressive Price Cleaning: If a price was detected, remove all numbers and price keywords
    if max_price or min_price:
        query_text = re.sub(r'[\d,.]+', '', query_text)
        price_keywords = ['million', 'm', 'k', 'thousand', 'under', 'below', 'less than', 'max', 'up to', 'above', 'more than', 'over', 'at least', 'min', 'between', 'and', 'ከ', 'በታች', 'በላይ', 'ሚሊዮን', 'ሺ']
        for pk in price_keywords:
            query_text = re.sub(rf'\b{pk}\b', '', query_text)

    intent_words = ['rent', 'lease', 'monthly', 'buy', 'purchase', 'sale', 'for sale', 'total price', 'cars', 'homes', 'houses', 'apartment', 'apartments']
    for iw in intent_words:
        query_text = re.sub(rf'\b{iw}\b', '', query_text)
        
    if bed_match:
        query_text = query_text.replace(bed_match.group(0), '')
        query_text = re.sub(r'\s*(\+|and\s+above|or\s+more|plus)', '', query_text)

    for sk in sort_keywords: query_text = re.sub(rf'\b{sk}\b', '', query_text)
    
    # Also strip common superlative endings/variations that might be left
    superlatives = ['est', 'er']
    for s in superlatives:
        query_text = re.sub(rf'\b(cheap|high|low|price){s}\b', '', query_text)


    # Remove specific matches to clean query_text
    # Also remove any Amharic equivalents to avoid duplicates like 'Toyota (ቶዮታ)'
    if prop_type:
        query_text = query_text.replace(prop_type.lower(), '')
        if prop_type_match: query_text = query_text.replace(prop_type_match, '')
        for am, en in AM_MAP.items():
            if en == prop_type.lower():
                query_text = query_text.replace(am, '')
                query_text = query_text.replace('የ' + am, '')
    
    if brand:
        query_text = query_text.replace(brand.lower(), '')
        if brand_match: query_text = query_text.replace(brand_match, '')
        for am, en in AM_MAP.items():
            if en == brand.lower():
                query_text = query_text.replace(am, '')
                query_text = query_text.replace('የ' + am, '')
    

    for search_val, match_str in unique_locations.items():
        query_text = query_text.replace(match_str, '')
        query_text = query_text.replace(search_val, '')
        for am, en in AM_MAP.items():
            if en == search_val.lower():
                query_text = query_text.replace(am, '')
                query_text = query_text.replace('የ' + am, '')


    # Remove Amharic suffixes (plurals, definite markers, etc.)
    # ዎችን (wochin), ዎችን (wochin), ቱን (tun), ውን (wn), ን (n)
    query_text = re.sub(r'ዎችን\b', '', query_text)
    query_text = re.sub(r'ዎች\b', '', query_text)
    query_text = re.sub(r'ውን\b', '', query_text)
    query_text = re.sub(r'ቱን\b', '', query_text)
    query_text = re.sub(r'ን\b', '', query_text)

    # Remove Amharic 'Ye-' prefix (of) if it remains attached to words
    query_text = re.sub(r'(^|\s)የ(\w+)', r'\1\2', query_text)
    # Generic prefix remover for common Amharic prep-prefixes
    query_text = re.sub(r'(^|\s)(?:በ|ለ|ከ)(\w+)', r'\1\2', query_text)

    # Remove digits that aren't years
    query_text = re.sub(r'\b(?!(?:19|20)\d{2})[\d,.]+\b', '', query_text)
    
    cur_fillers = ['etb', 'birr', 'usd', 'price', 'budget', 'cost', 'trend', 'trends', 'average', 'avg', 'market', 'right', 'now', 'together', 'both', 'side', 'by', 'listing']
    am_fillers = [
        'የ', 'በ', 'ለ', 'ከ', 'ወደ', 'ጋር', 'ውስጥ', 'ላይ', 'አለ', 'አሉ', 'የለም', 'እፈልጋለሁ', 'እፈልጋለን', 'ማየት', 'አሳየኝ', 'አሳዩን', 
        'አካባቢ', 'የሚሸጥ', 'የሚከራይ', 'ሚሸጥ', 'ሚከራይ', 'ቤት', 'ቤቶች', 'ኪራይ', 'መኪና', 'መኪናዎች', 'ዋጋ', 'ስንት', 'ነው', 'ናቸው', 'ምን', 'የት', 'መቼ', 'እንዴት',
        'አማካኝ', 'በአሁኑ', 'ጊዜ', 'አሁን', 'ቦታ', 'ጥያቄ', 'የለኝም', 'የለንም', 'ነው', 'እስቲ', 'እባክህ', 'እባክሽን', 'እባካችሁ', 'ብር', 'መግዛት', 'እንደምን', 'ሰላም'
    ]
    fillers = [
        'i', 'want', 'to', 'see', 'need', 'find', 'me', 'show', 'search', 'listings', 'for', 'under', 'above', 'with', 'in', 
        'at', 'the', 'a', 'an', 'please', 'perfect', 'modern', 'between', 'and', 'car', 'cars', 'vehicle', 'vehicles',
        'house', 'houses', 'home', 'homes', 'apartment', 'apartments', 'villa', 'villas', 'condo', 'condos', 'br',
        'are', 'there', 'any', 'available', 'is', 'it', 'get', 'give', 'have', 'of', 'am', 'was', 'were', 'be', 'been',
        'what', 'whats', 'what\'s', 'how', 'many', 'do', 'you', 'currently', 'today', 'latest', 'newest', 'all', 'every',
        'tell', 'explain', 'suggest', 'help', 'can', 'should', 'know', 'who', 'where', 'when', 'why', 'hello', 'hi', 'thanks', 'thank'
    ]
    
    for f in (fillers + cur_fillers + am_fillers): 
        query_text = re.sub(rf'\b{f}\b', '', query_text)

    # Remove contractions and possessives
    query_text = re.sub(r"'(?:s|ve|re|m|ll|d|t)\b", '', query_text)
    
    query_text = " ".join(query_text.split()).strip()
    # More aggressive punctuation cleaning (remove anything not alphanumeric or space)
    query_text = re.sub(r'[^\w\s]', ' ', query_text).strip()
    query_text = " ".join([w for w in query_text.split() if len(w) > 1]).strip()

    context = f"DATABASE SEARCH RESULTS FOR: '{message}'\n\n"
    
    # If multiple locations, provide results for each
    loc_list = list(unique_locations.keys()) if unique_locations else [None]
    
    for loc in loc_list:
        loc_label = f" in {loc.upper()}" if loc else ""
        context += f"--- RESULTS{loc_label} ---\n"
        for asset in assets:
            # Isolate filters
            current_brand = brand if asset == 'CAR' else None
            current_prop_type = prop_type if asset == 'HOME' else None
            current_bedrooms = bedrooms if asset == 'HOME' else None
            
            results = _search_db(
                asset_type=asset,
                max_price=max_price,
                min_price=min_price,
                query_text=query_text,
                listing_intent=intent,
                bedrooms=current_bedrooms,
                prop_type=current_prop_type,
                location=loc,
                bedrooms_min=beds_min,
                sort_mode=sort_mode,
                brand=current_brand
            )
            
            # If it's a general question, we don't want to spam "NO LISTINGS FOUND"
            # unless it was clearly meant to be a search.
            search_indicators = ['car', 'house', 'price', 'listing', 'vitz', 'toyota', 'villa', 'apartment', 'etb', 'sale', 'rent']
            is_search = any(w in clean_msg for w in search_indicators) or brand or prop_type or unique_locations
            
            if results == "NO LISTINGS FOUND IN DATABASE FOR THIS SEARCH." and not is_search:
                results = "N/A (General conversation detected)"
                
            context += f"--- {asset} LISTINGS{loc_label} ---\n{results}\n\n"

    context += f"MARKET TRENDS & AVERAGES:\n"
    for loc in loc_list:
        loc_label = f" ({loc.upper()})" if loc else ""
        for asset in assets:
            # PropType trends only for HOME, Brand trends only for CAR
            current_brand = brand if asset == 'CAR' else None
            current_prop_type = prop_type if asset == 'HOME' else None
            trends = _get_market_data(asset, loc, current_prop_type, current_brand)
            context += f"{trends}\n"

    return context
class AIAssistant:
    def _smart_predict_price(self, references: List[Dict]) -> Dict:
        """Uses an external AI model to predict price based on references."""
        try:
            # Prepare references for the external model
            formatted_references = []
            for r in references:
                formatted_references.append({
                    "bedrooms": r.get("bedrooms"),
                    "prop_type": r.get("prop_type"),
                    "location": r.get("location"),
                    "brand": r.get("brand"),
                    "year": r.get("year"),
                    "price": r.get("price")
                })
            
            # Call the external AI model (replace with actual API call)
            # This is a placeholder for an actual API call to a price prediction model
            response = requests.post(
                "http://localhost:8001/predict_price", # Example endpoint
                json={"references": formatted_references}
            )
            
            result = json.loads(response.text)
            return {
                "predicted_price": float(result.get("predicted_price", 0)),
                "confidence": float(result.get("confidence", 0.5)),
                "reasoning": result.get("reasoning", "Appraised based on similar database listings.")
            }
        except Exception as e:
            print(f"Smart prediction error: {e}")
            # Fallback to simple average if AI fails for any reason
            if references:
                avg = sum(r.get('price', 0) for r in references) / len(references)
                return {
                    "predicted_price": round(avg, 2),
                    "confidence": 0.5,
                    "reasoning": "Calculation based on database average (AI fallback)."
                }
            return {"predicted_price": 0, "confidence": 0, "reasoning": "Could not generate prediction."}

    async def get_response(self, message: str, history: List[Dict[str, str]]):
        """Main entry point for AI chat from FastAPI."""
        try:
            context = _build_context(message)
            
            # Convert history to google-genai Content/Part structure
            gemini_history = []
            for h in history:
                gemini_history.append(types.Content(
                    role=h['role'],
                    parts=[types.Part(text=h.get('parts', h.get('content', '')))]
                ))
            
            # Use modern Client structure
            chat = client.chats.create(
                model='gemini-2.0-flash',
                history=gemini_history,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION
                )
            )
            
            prompt = f"--- DATABASE CONTEXT ---\n{context}\n\n--- USER MESSAGE ---\n{message}"
            response = await asyncio.to_thread(chat.send_message, message=prompt)
            return response.text
        except Exception as e:
            return f"I'm sorry, I'm having trouble processing that request: {str(e)}"

assistant = AIAssistant()
