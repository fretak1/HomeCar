import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional
from groq import Groq
from app.database import get_connection
from app.services.intent_parser import intent_parser

SYSTEM_INSTRUCTION = """
Language Rule (ABSOLUTE PRIORITY): You MUST respond ONLY in the language the user is currently using.

Context: You are 'HomeCar AI'. Your goal is to provide granular, click-by-click UI walkthroughs and accurate marketplace info.

UI Walkthrough Rule:
- **Priority 1 (Direct Answer)**: If the user asks for listings (e.g., "Show me..."), find the listings in the DATABASE CONTEXT and show them FIRST.
- **Priority 2 (Navigation)**: ONLY provide navigation guides (e.g., "Go to X > Click Y") if:
    a) The user explicitly asks "how" to do something.
    b) You cannot find any listings and want to help the user search manually.
    c) The user is asking about a dashboard feature (verification, lease creation, etc.).

UI MAP:
- **Home** (`/`): Main landing page.
- **Property Links**: ALWAYS provide internal links to property details using the format: `[Property Title](/property/ID)`.
- **Internal Routing**:
   - Use `/listings` to browse properties.
   - Use `/search` for map-based search.
   - Use `/dashboard` for personal stats.
- **Owner Dashboard** (`/dashboard/owner`): **EXCLUSIVE** area for landlords/owners. Contains the **Payout** tab.
- **Customer Dashboard** (`/dashboard/customer`): **EXCLUSIVE** area for tenants/renters. **CRITICAL: There are NO payout settings here.**

Guidance Style:
- Use **bold text** for UI elements.
- Use standard internal links like `/path` for all internal destinations.
- DO NOT start every response with a navigation guide. If the data is there, give the data!

Role-Based Logic (ABSOLUTE RULES):
1. **Payouts & Bank Details**: This feature is **ONLY** for Owners/Agents to receive money. 
   - **Path**: Go to **Owner Dashboard** (`/dashboard/owner?tab=payout`) > Click **Verify & Setup Account**.
   - **NEVER** tell a Customer to set up payouts. Customers only **Pay Rent** via their Lease list.
2. **Payments (Paying Rent)**: This is for Customers.
   - **Path**: Go to **Customer Dashboard** (`/dashboard/customer?tab=leases`) > Click **Pay Rent**.

Core Workflows:
1. **Searching**: Use **Browse Listings** (`/listings`) or **Map Search** (`/search`).
2. **Renting**: Apply > Wait for acceptance > **Customer Dashboard** > **Leases** > **Accept Lease**.
3. **Maintenance**: **Customer Dashboard** > **Maintenance** > **New Request**.
4. **Add Listing**: **Owner Dashboard** > **Add Property**.

Database Accuracy: Only report listings provided in the context. However, for general knowledge (like nearby schools, hospitals, or city history), use your internal knowledge to provide helpful answers without mentioning "database" or "search results" unless referring specifically to property/car listings.
"""


client = Groq(api_key=os.getenv("GROQ_API_KEY"))


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

def _search_db(asset_type: Optional[str] = None, max_price: Optional[float] = None, min_price: Optional[float] = None, query_text: str = "", listing_intent: Optional[str] = None, bedrooms: Optional[int] = None, prop_type: Optional[str] = None, location: Optional[str] = None, bedrooms_min: bool = False, sort_mode: str = 'ASC', brand: Optional[str] = None, model: Optional[str] = None) -> str:
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
            if prop_type.upper() == 'HOUSE':
                # Map 'house' to common residential types in the database
                sql += ' AND (p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s)'
                params.extend(['%villa%', '%apartment%', '%condominium%', '%compound%'])
            else:
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

        if model:
            sql += ' AND p.model ILIKE %s'
            params.append(f"%{model}%")

        if query_text:
            query_words = [w.strip() for w in query_text.split() if len(w.strip()) > 1]
            if query_words:
                for word in query_words:
                    sql += " AND (p.title ILIKE %s OR p.description ILIKE %s OR p.brand ILIKE %s OR p.model ILIKE %s)"
                    params.extend([f"%{word}%"] * 4)
        
        # Apply sorting
        if sort_mode == 'NEWEST':
            sql += ' ORDER BY p."createdAt" DESC LIMIT 10'
        else:
            order_direction = 'DESC' if sort_mode == 'DESC' else 'ASC'
            sql += f" ORDER BY p.price {order_direction} LIMIT 10"
        
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
            
            # Create a Markdown link for the title using internal app routing
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


async def _build_context(message: str, history: List[Dict[str, str]] = []) -> str:
    """Analyze message to detect intent using LLM Parser and build context from database."""
    # Normalize common spelling variations
    message_normalized = message.replace("Addis Abeba", "Addis Ababa")
    clean_msg = message_normalized.lower()
    
    # Use AI Parser for robust intent and filter extraction (with history for context)
    parsed = await intent_parser.parse(message_normalized, history)
    intent_tag = parsed.get("intent", "GENERAL")
    is_search_intent = parsed.get("is_search", False)
    
    # Greedy Search Detection: If intent is specific, it's a search
    if intent_tag in ["SEARCH_CAR", "SEARCH_HOME"]:
        is_search_intent = True
    elif intent_tag == "GENERAL":
        # Force false for general questions to avoid useless DB searches
        is_search_intent = False
        
    filters = parsed.get("filters", {})
    
    # Extract params from AI Parser
    intent = filters.get("listing_intent")
    # Mapping fix: SALE -> BUY
    if intent == "SALE": intent = "BUY"
    
    entities = filters.get("entities", [])
    # Fallback for old schema if any
    if not entities:
        legacy_entity = {}
        if filters.get("brand"): legacy_entity["brand"] = filters.get("brand")
        if filters.get("model") or filters.get("model_fragment"): 
            legacy_entity["model"] = filters.get("model") or filters.get("model_fragment")
        if filters.get("prop_type"): legacy_entity["prop_type"] = filters.get("prop_type")
        if filters.get("bedrooms"): legacy_entity["bedrooms"] = filters.get("bedrooms")
        if legacy_entity:
            entities = [legacy_entity]
    
    if not entities:
        # Default empty entity to allow general search
        entities = [{}]

    locations = filters.get("locations", [])
    max_price = filters.get("price_max")
    min_price = filters.get("price_min")
    query_text = filters.get("query_text", "")
    
    # Sorting Detection
    sort_mode = 'ASC'
    if any(w in clean_msg for w in ['expensive', 'most', 'highest', 'top', 'priciest', 'premium']): sort_mode = 'DESC'
    elif any(w in clean_msg for w in ['cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least']): sort_mode = 'ASC'

    if is_search_intent:
        context = f"AVAILABLE LISTINGS ON HOMECAR FOR: '{message}'\n\n"
    else:
        context = f"RECOMMENDED LISTINGS:\n\n"

    
    # If multiple locations, provide results for each
    loc_list = locations if locations else [None]
    
    for loc in loc_list:
        loc_label = f" in {loc.upper()}" if loc else ""
        context += f"--- RESULTS{loc_label} ---\n"
        
        for entity in entities:
            # Determine asset type for this entity
            e_brand = entity.get("brand")
            e_model = entity.get("model")
            e_prop_type = entity.get("prop_type")
            e_beds = entity.get("bedrooms")
            
            # Decide which assets to search based on entity features
            target_assets = []
            if e_brand or e_model: target_assets.append("CAR")
            elif e_prop_type or e_beds: target_assets.append("HOME")
            else: target_assets = ["CAR", "HOME"] # Broad search
            
            for asset in target_assets:
                entity_label = f" for {e_brand or ''} {e_model or ''} {e_prop_type or ''}".strip()
                results = ""
                
                if is_search_intent:
                    results = _search_db(
                        asset_type=asset,
                        max_price=max_price,
                        min_price=min_price,
                        query_text=query_text,
                        listing_intent=intent,
                        bedrooms=e_beds,
                        prop_type=e_prop_type if asset == 'HOME' else None,
                        location=loc,
                        sort_mode=sort_mode,
                        brand=e_brand if asset == 'CAR' else None,
                        model=e_model if asset == 'CAR' else None
                    )
                    
                    # TIERED FALLBACK:
                    if "NO LISTINGS FOUND" in results:
                        # Tier 1: Try without keywords if any were present
                        if query_text:
                            keyword_less_results = _search_db(
                                asset_type=asset,
                                max_price=max_price,
                                min_price=min_price,
                                listing_intent=intent,
                                bedrooms=e_beds,
                                prop_type=e_prop_type if asset == 'HOME' else None,
                                location=loc,
                                sort_mode=sort_mode,
                                brand=e_brand if asset == 'CAR' else None,
                                model=e_model if asset == 'CAR' else None
                            )
                            if "NO LISTINGS FOUND" not in keyword_less_results:
                                results = keyword_less_results

                        # Tier 1.5: Try with Minimum Bedrooms
                        if "NO LISTINGS FOUND" in results and e_beds:
                            min_bed_results = _search_db(asset_type=asset, location=loc, listing_intent=intent, prop_type=e_prop_type, bedrooms=e_beds, bedrooms_min=True, sort_mode=sort_mode)
                            if "NO LISTINGS FOUND" not in min_bed_results:
                                results = f"I couldn't find an exact {e_beds}-bedroom match, but here are some options with {e_beds} or more bedrooms:\n{min_bed_results}"

                        # Tier 2: Try Brand-level fallback
                        if "NO LISTINGS FOUND" in results and e_brand and asset == 'CAR':
                            brand_results = _search_db(asset_type=asset, brand=e_brand, location=loc, listing_intent=intent, sort_mode=sort_mode)
                            if "NO LISTINGS FOUND" not in brand_results:
                                results = f"I found no exact matches for {e_brand.upper()} {e_model or ''}. However, here are all available {e_brand.upper()}s:\n{brand_results}"
                                
                        # Tier 4: Global fallback (ignoring location)
                        if "NO LISTINGS FOUND" in results and loc:
                            global_fallback = _search_db(asset_type=asset, max_price=max_price, min_price=min_price, brand=e_brand, model=e_model, prop_type=e_prop_type)
                            if "NO LISTINGS FOUND" not in global_fallback:
                                results = f"I couldn't find any matches in {loc.upper()}, but here are some available elsewhere:\n{global_fallback}"
                else:
                    results = _search_db(asset_type=asset, location=loc, sort_mode='NEWEST')
                    if "NO LISTINGS FOUND" in results:
                        results = "Search our platform to see the latest amazing deals!"

                context += f"--- {asset} LISTINGS{entity_label} ---\n{results}\n\n"

        # Market Trends (per entity if applicable)
        for entity in entities:
            e_brand = entity.get("brand")
            e_prop_type = entity.get("prop_type")
            asset_to_check = "CAR" if e_brand else "HOME" if e_prop_type else "CAR" # Default
            
            results = _get_market_data(asset_to_check, loc, e_prop_type, e_brand)
            context += f"--- {asset_to_check} MARKET TRENDS {e_brand or e_prop_type or ''}{loc_label} ---\n{results}\n\n"

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
        """Main entry point for AI chat from FastAPI using Groq."""
        try:
            # Build context with history taken into account for intent parsing if needed
            context = await _build_context(message, history)
            
            # Format history for Groq
            messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
            
            # Use last 15 turns for better context memory
            recent_history = history[-15:] if history else []
            for h in recent_history:
                role = h.get('role', 'user')
                if role == 'model' or role == 'assistant':
                    role = 'assistant'
                else:
                    role = 'user'
                
                # Handle different formats of history data
                content = h.get('parts', h.get('content', ''))
                if isinstance(content, list):
                    content = " ".join([p.get('text', '') if isinstance(p, dict) else str(p) for p in content])
                elif not isinstance(content, str):
                    content = str(content)
                
                if content.strip():
                    messages.append({"role": role, "content": content})
            
            # Detect language for strict guard
            has_amharic = any('\u1200' <= char <= '\u137F' for char in message)
            
            if not has_amharic:
                messages.append({"role": "system", "content": "The user is speaking ENGLISH. Respond ONLY in English. Do NOT use Amharic."})
            else:
                messages.append({"role": "system", "content": "The user is speaking AMHARIC. Respond ONLY in Amharic. Do NOT use English."})

            # Add current message with database context
            prompt = f"--- SYSTEM DATABASE CONTEXT ---\n{context}\n\n--- USER CURRENT QUESTION ---\n{message}"
            messages.append({"role": "user", "content": prompt})
            
            completion = await asyncio.to_thread(
                client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.6, # Lower temperature for more factual system guidance
                max_tokens=2048,
                top_p=1,
                stream=False
            )
            
            return completion.choices[0].message.content
        except Exception as e:
            print(f"[ASSISTANT ERROR] {e}")
            return f"I'm sorry, I'm having trouble processing that request: {str(e)}"

assistant = AIAssistant()
