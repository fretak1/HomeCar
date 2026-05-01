import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.database import get_connection
from app.services.intent_parser import intent_parser

SYSTEM_INSTRUCTION = """
Language Rule (ABSOLUTE PRIORITY): You MUST respond ONLY in the language the user is currently using.

Context: You are 'HomeCar AI', the expert virtual assistant for the HomeCar platform. Your goal is to provide granular, 100% accurate system guidance and market information.

--- HOMECAR SYSTEM MANUAL ---

# 1. User Roles & Access
- **Customer**: Browses listings, applies to properties, manages active leases/payments.
- **Owner**: Lists properties, accepts tenants, manages maintenance and payouts.
- **Agent**: Professional manager for multiple owners. MUST be verified to list properties.
- **Admin**: Oversees users, properties, transactions, leases, and verifications.
- **Listing Creation Rule**:
  - Property listing creation should be explained as an **Owner** workflow or a **verified Agent** workflow.
  - Do not describe listing creation as a normal customer workflow.

# 2. Navigation Response Rules
- When the user asks how to navigate the website, answer with short step-by-step instructions such as "Click X, then click Y".
- Use the **exact visible labels** from the UI when known.
- Do **NOT** show raw routes like `/dashboard`, `/listings`, or `/login` in normal user-facing guidance.
- Instead, use natural clickable wording such as:
  - `Click [here](nav:/) to open Home`
  - `Click [here](nav:/login) to open the login page`
  - `Click [here](nav:/listings) to open the listings page`
- Only mention a raw route if the user explicitly asks for the URL or exact path.
- For dashboard answers, mention the correct role and the tab/button name the user should click.
- Never invent routes, tabs, buttons, or admin tools that are not listed in this guide.

# 3. Public Web Navigation
- **Home**: `/`
  - Main landing page with featured sections.
  - The Home page "Featured" sections only show items from the **last 10 days**.
  - Public navbar labels for non-management users: **Home**, **Search On Map**, **Properties**.
  - The Home CTA section includes **List Your Property** and **Browse Listings**.
- **AI Entry Point**:
  - Non-management users can open the floating assistant button labeled **Ask Ai**.
  - The web app supports clickable internal links in assistant replies.
- **Search On Map**: `/search`
  - Dedicated map search page for homes.
- **All Listings / Properties**: `/listings`
  - Full browsing page for homes and cars.
  - Main listing tabs: **Homes** and **Cars**.
- **Property Details**: `/property/[ID]`
  - Detailed view with actions such as **Apply Now** or **Contact Owner**.

# 4. Authentication & Onboarding
- **Login**: `/login`
  - User enters **Email Address** and **Password**, then clicks **Sign In**.
- **Signup**: `/signup`
  - User enters name, email, password, confirm password, selects **Account Type**, then clicks **Create Account**.
  - **Password Rules**: 8+ chars, 1 Uppercase, 1 Number, 1 Special character.
  - **Account Type Choices**: `Customer`, `Owner`, `Agent`.
- **Email Verification**: `/verify-email`
  - After signup, the user is redirected here.
  - User enters the 6-digit code and clicks **Verify & Continue**.
  - Login should be treated as blocked until verification is completed.
- **Forgot Password**: `/forgot-password`
  - Reached from the **Forgot?** link on the login page.

# 5. Home Search Bar Guidance
- On the Home page, the search card lets the user:
  - switch between **Properties** and **Cars**
  - choose **City**
  - choose **For Rent** or **For Sale**
  - choose **Price Range**
  - click **Search**
- Home search sends the user to `/listings` with filters applied.

# 6. Dashboard Routing Logic
- **Dashboard Entry**: `/dashboard`
  - If not logged in, user is sent to `/login`.
  - If logged in, `/dashboard` redirects by role:
    - Customer -> `/dashboard/customer`
    - Owner -> `/dashboard/owner`
    - Agent -> `/dashboard/agent`
    - Admin -> `/dashboard/admin`
- **Management Role Restriction**:
  - `ADMIN`, `OWNER`, and `AGENT` are redirected away from public browsing pages to `/dashboard`.
  - These roles do not use the normal public navbar flow as their primary navigation.

# 7. Customer Dashboard (`/dashboard/customer`)
- Main tabs:
  - **Applications**
  - **Maintenance**
  - **Leases**
  - **Transactions**
  - **Favorites**
- **Application Status Check**:
  - Open **Customer Dashboard**.
  - Click the **Applications** tab.
  - Find the relevant application card under **My Applications**.
  - Check the status badge on the card to see whether it is pending, accepted, or rejected.
  - If the application is accepted, the customer can use **Start Chat** from that card.
- **Rent Payment**:
  - Inside the **Leases** tab, find the active lease.
  - Expand **Monthly Payment Schedule** or **Lease Payment Settlement**.
  - Click **Pay Rent** for the relevant period.
  - The system asks the customer to confirm their email before continuing to payment.
- **Applications**:
  - Customer can monitor whether an application is pending, accepted, or rejected.
- **Lease Progress**:
  - Show the visual contract progress and monthly schedule when applicable.
- Deeper pages:
  - Lease detail: `/dashboard/customer/lease/[id]`
  - Receipt document: `/dashboard/customer/documents/receipt/[id]`
  - Contract document: `/dashboard/customer/documents/contract/[id]`

# 8. Owner Dashboard (`/dashboard/owner`)
- Header button:
  - **Add Property** -> `/dashboard/add-property`
- Main tabs:
  - **My Properties**
  - **Applications**
  - **Leases**
  - **Maintenance**
  - **Transactions**
  - **Payout**
- **Stats**:
  - Shows **Total Revenue** using only `COMPLETED` transactions.
- **Payouts**:
  - Owners manage bank/payment details for rent collection in the **Payout** tab.
  - Use **Payout Settings** to configure where earnings are received.
  - If no account is linked yet, the owner fills in bank details and clicks **Verify & Setup Account**.
  - If an account is already linked, the owner can click **Update Account** and then **Update Payout Details**.
- **Create Listing**:
  - Owners add listings from the **Add Property** button.
  - On the form page, the submit button for a new listing is **Add Property**.
  - For owners, the new-listing success message says the listing was created and will be verified shortly.
- **Maintenance**:
  - Owners move requests from `pending` -> `inProgress` -> `completed`.
  - Maintenance requests are managed from the **Maintenance** tab.
  - There is **NO** top-navbar item called **Maintenance** for owners.
  - Visible action labels on the owner maintenance screen include **Start Progress** and **See Detail**.
  - Do **NOT** invent buttons like **Update Status** or **Save Changes** unless they are actually visible.
  - Do **NOT** send the user through the public **Properties** page or a **My Properties** route for maintenance status updates.
  - If the user asks how to mark a request as completed and no visible **Completed** control is shown on the current maintenance screen, say that directly instead of inventing extra steps.
- Lease pages:
  - Create lease: `/dashboard/owner/lease/create`
  - Lease detail: `/dashboard/owner/lease/[id]`

# 9. Agent Dashboard (`/dashboard/agent`)
- Header button:
  - **Add Property**
- Main tabs:
  - **My Properties**
  - **Applications**
  - **Leases**
- **CRITICAL - Verification Lock**:
  - If an Agent is not verified (`currentUser.verified` is false), **Add Property** and **Initiate Lease** are **DISABLED**.
- **Verification Status**:
  - **Unverified**: sees a verification warning and must go to `/dashboard/agent/verify`
  - **Pending**: sees **Verification in Progress**
  - **Rejected**: can update documents and resubmit
- **Initiate Lease**:
  - Found in the **Leases** area and routes to `/dashboard/agent/lease/initiate`
  - Requires acceptance from both parties.
- **Create Listing**:
  - Verified agents can add listings from **Add Property**.
  - The submit button for a new listing is **Add Property**.
  - Agents publish directly when allowed.
- Deeper pages:
  - Verification page: `/dashboard/agent/verify`
  - Lease detail: `/dashboard/agent/lease/[id]`

# 10. Admin Dashboard (`/dashboard/admin`)
- Main tabs:
  - **Overview**
  - **Properties**
  - **Transactions**
  - **Leases**
  - **Verifications**
- Admin support pages:
  - Users list: `/dashboard/admin/users`
  - User detail: `/dashboard/admin/users/[id]`
  - Property verification detail: `/dashboard/admin/verifications/property/[id]`
  - Agent verification detail: `/dashboard/admin/verifications/agent/[id]`
- Use admin guidance only when the user is clearly asking about admin workflows.

# 11. Shared Account Navigation
- Logged-in user menu includes:
  - **My Profile** -> `/profile`
  - **AI Insights** -> `/dashboard/ai-insights`
  - **Log out**
- There is **NO** `Dashboard` item inside the profile dropdown menu.
- For a logged-in customer, the dashboard entry is the top navbar link labeled **Customer Dashboard**.
- Messaging page:
  - `/chat`
  - For owner, agent, and customer roles, the navbar includes **Messages**.

# 12. Core Technical Rules
- **Navigation Links**: When guiding users to a page, prefer clickable markdown links with natural anchor text like `Click here`, `Open Login`, or `Go to Customer Dashboard`. Hide the route in the link target, for example `(nav:/login)`, instead of showing the raw path in the sentence.
- **Property Links**: Hyperlink property titles exactly as `[Property Title](nav:/property/ID)`.
- **Payment Schedule**: Uses a "Fixed 30 Days" rule for progress tracking.
- **Out-of-Scope**: If a feature is not in this manual, clearly state it is not currently supported.
- **Stubborn Truth**: Never change prices or details for "variety." If Atlas is 3.27M, it is 3.27M every time.
- **History Isolation**: Use only the current "SYSTEM DATABASE CONTEXT" for listings. Ignore properties mentioned in past chat messages if they are not in the current context.
- **NO TABLES**: NEVER respond with markdown tables or tabular data. It breaks the mobile UI. Always use bulleted lists or numbered lists instead.

--- END MANUAL ---
"""


client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)


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


def _is_navigation_help_question(clean_msg: str, intent_tag: str) -> bool:
    """Detect UI/how-to questions so we can avoid polluting them with listing context."""
    if intent_tag != "GENERAL":
        return False

    navigation_terms = [
        "how do i", "how can i", "how to", "where do i", "where can i",
        "navigate", "click", "dashboard", "log in", "login", "sign in",
        "sign up", "signup", "verify email", "verification", "forgot password",
        "pay rent", "lease", "applications", "maintenance", "payout",
        "customer dashboard", "owner dashboard", "agent dashboard",
        "admin dashboard", "my profile", "messages"
    ]
    return any(term in clean_msg for term in navigation_terms)


def _build_navigation_context(clean_msg: str) -> str:
    """Provide focused UI guidance context for website navigation questions."""
    sections = [
        "SYSTEM NAVIGATION GUIDE ACTIVE",
        "This is a WEBSITE NAVIGATION / HOW-TO question.",
        "DO NOT answer with listing recommendations, prices, market trends, or property search results.",
        "Use short step-by-step instructions with exact UI labels only.",
        "Do NOT expose raw routes unless the user explicitly asks for the URL.",
        "Prefer natural clickable wording like Click [here](nav:/login).",
        "CRITICAL: Never claim there is a Dashboard item inside the My Profile dropdown.",
        "FACT: The profile dropdown contains My Profile, AI Insights, and Log out.",
    ]

    if any(term in clean_msg for term in ["customer", "rent", "lease", "pay rent"]):
        sections.extend([
            "",
            "CUSTOMER NAVIGATION FACTS:",
            "- A logged-in customer reaches the dashboard from the top navbar link labeled Customer Dashboard.",
            "- The customer dashboard tabs are Applications, Maintenance, Leases, Transactions, and Favorites.",
            "- To check whether an owner accepted an application: open Customer Dashboard, click Applications, find the application card in My Applications, and read the status badge on that card.",
            "- To pay rent: open Customer Dashboard, click Leases, find the active lease, expand Monthly Payment Schedule or Lease Payment Settlement, then click Pay Rent.",
            "- After Pay Rent, the system asks the customer to confirm their email before payment continues.",
        ])

    if any(term in clean_msg for term in ["application", "accepted", "owner accepted", "my application", "application status", "rejected"]):
        sections.extend([
            "",
            "APPLICATION STATUS FACTS:",
            "- Application status is checked in the Applications tab, not the Leases tab.",
            "- The My Applications section shows each application card with a status badge such as pending or accepted.",
            "- If an application is accepted, the card can also show Start Chat.",
        ])

    if any(term in clean_msg for term in ["login", "log in", "sign in", "signup", "sign up", "verify email", "forgot password"]):
        sections.extend([
            "",
            "AUTH NAVIGATION FACTS:",
            "- Guests use the top-right buttons Sign In and Sign Up.",
            "- Login page fields are Email Address and Password, then the user clicks Sign In.",
            "- Signup requires name, email, password, confirm password, account type, then Create Account.",
            "- After signup, the user enters the 6-digit code on the verification screen and clicks Verify & Continue.",
            "- Forgot password is opened from the Forgot? link on the login page.",
        ])

    if any(term in clean_msg for term in ["owner", "agent", "admin"]):
        sections.extend([
            "",
            "ROLE DASHBOARD FACTS:",
            "- Owner dashboard tabs: My Properties, Applications, Leases, Maintenance, Transactions, Payout.",
            "- Agent dashboard tabs: My Properties, Applications, Leases.",
            "- Admin dashboard tabs: Overview, Properties, Transactions, Leases, Verifications.",
            "- Unverified agents cannot use Add Property or Initiate Lease until verification is approved.",
            "- Management roles should not be guided through invented public navbar links like Maintenance.",
        ])

    if any(term in clean_msg for term in ["add property", "new property", "new listing", "property listing", "list property", "listing to the website"]):
        sections.extend([
            "",
            "LISTING CREATION FACTS:",
            "- Listing creation should be explained for owners or verified agents.",
            "- Owner flow: open Owner Dashboard and click Add Property.",
            "- Agent flow: open Agent Dashboard and click Add Property, but only if verified.",
            "- There is also a Home page CTA called List Your Property that opens the add-listing page.",
            "- Do not invent a public navbar item called List Your Property.",
            "- Do not send listing-creation questions to the public Properties page.",
            "- The submit button on the form for a new listing is Add Property, not Create Listing.",
        ])

    if any(term in clean_msg for term in ["bank account", "payout", "payouts", "receive rent", "receive rent payouts", "earnings", "settlement"]):
        sections.extend([
            "",
            "PAYOUT FACTS:",
            "- Payout bank account setup is an owner workflow, not a customer workflow.",
            "- To set up rent payouts: open Owner Dashboard, click the Payout tab, then use the Payout Settings card.",
            "- If there is no linked account, the owner selects a bank, enters account holder name, account number, optional business reference, then clicks Verify & Setup Account.",
            "- If an account is already linked, the owner can click Update Account.",
            "- Do not send payout questions to the customer Transactions tab.",
        ])

    if any(term in clean_msg for term in ["maintenance", "maintenance request", "tenant request", "repair request", "start progress", "completed", "complete request"]):
        sections.extend([
            "",
            "MAINTENANCE FACTS:",
            "- Tenant maintenance requests are handled from Owner Dashboard -> Maintenance.",
            "- Do not tell the owner to click Maintenance on the top navbar; that is not a real owner navbar item.",
            "- On the owner maintenance screen, visible actions include Start Progress and See Detail.",
            "- Do not invent an Update Status button, status dropdown, Save Changes button, or a public Properties -> My Properties route for this workflow.",
            "- If a request is pending, the visible action is Start Progress.",
            "- If the current screen does not show a visible Completed action, say that the owner should manage it from the Maintenance tab and avoid inventing extra steps.",
        ])

    if any(term in clean_msg for term in ["home", "listings", "search", "property", "properties"]):
        sections.extend([
            "",
            "PUBLIC NAVIGATION FACTS:",
            "- Public navbar labels are Home, Search On Map, and Properties.",
            "- The Home search card has Properties/Cars, City, For Rent/For Sale, Price Range, and Search.",
            "- Listings page uses the Homes and Cars tabs.",
        ])

    return "\n".join(sections)

def _search_db(asset_type: Optional[str] = None, max_price: Optional[float] = None, min_price: Optional[float] = None, query_text: str = "", listing_intent: Optional[str] = None, bedrooms: Optional[int] = None, prop_type: Optional[str] = None, location: Optional[str] = None, bedrooms_min: bool = False, sort_mode: str = 'ASC', brand: Optional[str] = None, model: Optional[str] = None, transmission: Optional[str] = None) -> str:
    """Run a database search and return formatted results in ETB."""
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = '''
            SELECT p.id, p.title, p.price, p."assetType", p."propertyType", p.bedrooms,
                   l.city, l.subcity, l.village, p.brand, p.model, p.year, p."listingType", p.transmission
            FROM "Property" p
            LEFT JOIN "Location" l ON p."locationId" = l.id
            WHERE p.status = 'AVAILABLE'
        '''
        params: List[Any] = []
        
        if asset_type:
            sql += ' AND p."assetType" = %s'
            params.append(asset_type.upper())
        if prop_type:
            p_type_clean = prop_type.lower()
            if p_type_clean in ['house', 'houses', 'home', 'homes', 'residential']:
                # Map broad terms to all residential property types
                sql += ' AND (p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s OR p."propertyType" ILIKE %s)'
                params.extend(['%villa%', '%apartment%', '%condominium%', '%compound%', '%building%'])
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

        if transmission:
            sql += ' AND p.transmission ILIKE %s'
            params.append(f"%{transmission}%")

        if query_text:
            query_words = [w.strip() for w in query_text.split() if len(w.strip()) > 1]
            if query_words:
                for word in query_words:
                    sql += " AND (p.title ILIKE %s OR p.description ILIKE %s OR p.brand ILIKE %s OR p.model ILIKE %s)"
                    params.extend([f"%{word}%"] * 4)
        
        order_direction = 'DESC' if sort_mode == 'DESC' else 'ASC'
        
        if not listing_intent and not query_text:
            # BROAD SEARCH OPTIMIZATION:
            # If the user doesn't specify Buy or Rent, we want to show a balanced mix of both
            # so the Rent results (cheap) don't bury the Sale results (expensive).
            
            # 1. Fetch 5 cheapest Sale
            sql_sale = sql + " AND ('BUY' = ANY(p.\"listingType\"::text[]) OR 'FOR_SALE' = ANY(p.\"listingType\"::text[]))"
            sql_sale += f" ORDER BY p.price {order_direction} LIMIT 5"
            cur.execute(sql_sale, params)
            sales = cur.fetchall()
            
            # 2. Fetch 5 cheapest Rent
            sql_rent = sql + " AND ('RENT' = ANY(p.\"listingType\"::text[]) OR 'LEASE' = ANY(p.\"listingType\"::text[]))"
            sql_rent += f" ORDER BY p.price {order_direction} LIMIT 5"
            cur.execute(sql_rent, params)
            rents = cur.fetchall()
            
            rows = sales + rents
        else:
            # Standard filtered search
            sql += f" ORDER BY p.price {order_direction} LIMIT 10"
            cur.execute(sql, params)
            rows = cur.fetchall()

        if not rows:
            return "NO LISTINGS FOUND IN DATABASE FOR THIS SEARCH."

        output = f"Found {len(rows)} live listing(s):\n"
        for r in rows:
            p_id, title, price, asset_type_, p_type, beds, city, subcity, village, brand, model, year, listing_type_arr, transmission = r
            
            # Clean title of any newlines to ensure Markdown parsing works
            clean_title = (title or "Untitled").replace("\n", " ").replace("\r", " ").strip()
            location_label = ", ".join(filter(None, [village, subcity, city])) or "Location TBD"
            
            # Create a Markdown link for the title using internal app routing
            linked_title = f"[{clean_title}](nav:/property/{p_id})"
            
            p_type_label = (p_type or "Property").capitalize()
            if asset_type_ == "CAR":
                detail = f"{brand or ''} {model or ''} {year or ''}".strip()
                lt_label = "**FOR SALE**" if any(t in str(listing_type_arr) for t in ['BUY', 'FOR_SALE']) else "**FOR RENT**"
                output += f"- {lt_label} {linked_title} — {price:,.0f} ETB | {detail} | {location_label}\n"
            else:
                detail = f"{beds or '?'} BR {p_type_label}"
                lt_label = "**FOR SALE**" if any(t in str(listing_type_arr) for t in ['BUY', 'FOR_SALE']) else "**FOR RENT**"
                output += f"- {lt_label} {linked_title} — {price:,.0f} ETB | {detail} | {location_label}\n"
        return output
    except Exception as e:
        return f"Database error details: {e}"
    finally:
        if cur: cur.close()
        if conn: conn.close()

def _get_market_data(asset_type: str, city: Optional[str] = None, prop_type: Optional[str] = None, brand: Optional[str] = None) -> str:
    """Get market statistics from the database in ETB, separated by listing type."""
    conn = None
    cur = None
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
    finally:
        if cur: cur.close()
        if conn: conn.close()


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

    if _is_navigation_help_question(clean_msg, intent_tag):
        return _build_navigation_context(clean_msg)
        
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
    if any(w in clean_msg for w in ['expensive', 'most', 'highest', 'top', 'priciest', 'premium']): 
        sort_mode = 'DESC'
    elif any(w in clean_msg for w in ['cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least']): 
        sort_mode = 'ASC'
        # Hard-block these from being used as text search keywords to prevent fallback loops
        for w in ['cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least', 'home', 'homes', 'house', 'houses']:
            query_text = query_text.replace(w, "").strip()
            message_normalized = message_normalized.replace(w, "").strip()

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
            e_transmission = entity.get("transmission")
            e_prop_type = entity.get("prop_type")
            e_beds = entity.get("bedrooms")
            
            # Decide which assets to search based on entity features
            target_assets = []
            if e_brand or e_model or e_transmission: target_assets.append("CAR")
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
                        model=e_model if asset == 'CAR' else None,
                        transmission=e_transmission if asset == 'CAR' else None
                    )
                    
                    # TIERED FALLBACK:
                    if "NO LISTINGS FOUND" in results:
                        # Tier 1: Try without keywords if any were present
                        if query_text:
                            # If keywords fail, clear them and try a clean search
                            results = _search_db(
                                asset_type=asset,
                                max_price=max_price,
                                min_price=min_price,
                                listing_intent=intent,
                                bedrooms=e_beds,
                                prop_type=e_prop_type if asset == 'HOME' else None,
                                location=loc,
                                sort_mode=sort_mode,
                                brand=e_brand if asset == 'CAR' else None,
                                model=e_model if asset == 'CAR' else None,
                                transmission=e_transmission if asset == 'CAR' else None
                            )
                            if not intent and not query_text:
                                results = f"NOTICE: I couldn't find matches for your specific keywords, so I am showing a balanced mix of available Sale and Rental options:\n{results}"

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
                            global_fallback = _search_db(asset_type=asset, max_price=max_price, min_price=min_price, brand=e_brand, model=e_model, transmission=e_transmission, prop_type=e_prop_type)
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
            
            # Use last 5 turns to prevent history poisoning/hallucination persistence
            recent_history = history[-5:] if history else []
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

            if "SYSTEM NAVIGATION GUIDE ACTIVE" in context:
                messages.append({
                    "role": "system",
                    "content": "NAVIGATION MODE OVERRIDE: This is a UI help question. Use only the exact labels in the navigation guide. Give concise click-by-click instructions. Do NOT mention raw routes unless the user explicitly asked for the URL. Do NOT invent a Dashboard item inside the profile dropdown."
                })

            # Add current message with database context
            prompt = f"--- SYSTEM DATABASE CONTEXT ---\n{context}\n\n--- USER CURRENT QUESTION ---\n{message}"
            messages.append({"role": "user", "content": prompt})
            
            # Force exact link preservation
            messages.append({
                "role": "system",
                "content": "LISTING LINK RULE (CRITICAL): The SYSTEM DATABASE CONTEXT above contains property listings with markdown links in the format [Title](nav:/property/ID). You MUST copy and use these EXACT markdown links in your response. DO NOT drop the opening '[' or closing ']' brackets. DO NOT merge the link with other text. The link must remain perfectly formatted to be clickable."
            })
            
            if "NO LISTINGS FOUND" in context and "[FOR " not in context and "AVAILABLE LISTINGS" in context:
                # The ultimate override: Inject a system message immediately before generation to stop history poisoning
                messages.append({
                    "role": "system", 
                    "content": "ABSOLUTE OVERRIDE: The database context above contains 'NO LISTINGS FOUND' for all search attempts. You MUST apologize and state that no exact matches exist. You are STRICTLY FORBIDDEN from generating, inventing, or recalling ANY properties from previous conversation turns. DO NOT output any property links."
                })
            
            # Anti-hallucination guardrail for carry-over constraints
            messages.append({
                "role": "system",
                "content": "STRICT ANTI-HALLUCINATION RULE: Ignore budget limits, locations, or constraints from previous messages unless the user explicitly restated them in their CURRENT QUESTION. The SYSTEM DATABASE CONTEXT above contains the absolute correct list of properties for this exact turn. Never claim a property fits a budget if its price is mathematically higher."
            })
            
            # Reactive Neighborhood Knowledge rule
            messages.append({
                "role": "system",
                "content": (
                    "NEIGHBORHOOD KNOWLEDGE: You are ONLY allowed to discuss neighborhood amenities (schools, "
                    "hospitals, parks, etc.) if the user EXPLICITLY asks about them in their current message. "
                    "Do NOT proactively offer this information for general search or property queries.\n"
                    "CRITICAL HONESTY RULE: When explicitly asked about amenities:\n"
                    "1. Only name specific facilities that you are 100% CONFIDENT exist.\n"
                    "2. If you are not certain about specific names, say 'I recommend checking Google Maps for "
                    "clinics/schools in [Area]' instead of inventing names.\n"
                    "3. NEVER fabricate place names or addresses."
                )
            })
            
            completion = await asyncio.to_thread(
                client.chat.completions.create,
                model="openai/gpt-oss-120b:free",
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
