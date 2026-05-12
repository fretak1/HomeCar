import os
import re
import json
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# ── Parse connection string into Neon HTTP API components ─────────────────────
def _parse_neon_url(url: str):
    """Extract host, user, password, dbname from a postgres:// URL."""
    # postgresql://user:password@host:port/dbname?params
    pattern = r"postgresql://([^:]+):([^@]+)@([^/:]+)(?::\d+)?/([^?]+)"
    m = re.match(pattern, url or "")
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL: {url[:40]}...")
    user, password, host, dbname = m.groups()
    return user, password, host, dbname


def _neon_http_query(sql: str, params=None) -> list[dict]:
    """
    Execute a SQL query via Neon's serverless HTTP API (port 443).
    Uses Neon-Connection-String header for auth — no TCP port needed.
    """
    _, _, host, _ = _parse_neon_url(DATABASE_URL)
    url = f"https://{host}/sql"

    # Substitute %s placeholders with $1, $2, ...
    args = []
    if params:
        counter = [0]
        def replacer(match):
            counter[0] += 1
            return f"${counter[0]}"
        sql_converted = re.sub(r"%s", replacer, sql)
        args = list(params)
    else:
        sql_converted = sql

    payload = {"query": sql_converted, "params": args}

    resp = requests.post(
        url,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "Neon-Connection-String": DATABASE_URL,
        },
        timeout=30,
    )

    if resp.status_code != 200:
        raise RuntimeError(f"Neon HTTP error {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    rows = data.get("rows", [])
    return rows


def query_to_dataframe(query, params=None) -> pd.DataFrame:
    """Execute a SQL query and return results as a Pandas DataFrame."""
    try:
        rows = _neon_http_query(query, params)
        if not rows:
            return pd.DataFrame()

        df = pd.DataFrame(rows)

        # Parse PostgreSQL array strings e.g. "{RENT,BUY}" into Python lists
        for col in df.select_dtypes(include=["object"]).columns:
            if df[col].dropna().astype(str).str.startswith("{").any():
                df[col] = df[col].apply(
                    lambda x: x.strip("{}").split(",")
                    if isinstance(x, str) and x.startswith("{")
                    else x
                )

        # Convert NaN to None
        df = df.astype(object).where(pd.notnull(df), None)
        return df

    except Exception as e:
        print(f"[DB] query_to_dataframe error: {e}")
        return pd.DataFrame()


# ── Domain queries ─────────────────────────────────────────────────────────────

def get_user_history(user_id):
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
    query = """
    SELECT id, kids, "marriageStatus"
    FROM "User"
    WHERE id = %s
    """
    return query_to_dataframe(query, (user_id,))


def get_user_search_history(user_id):
    query = """
    SELECT "searchType", filters, "createdAt"
    FROM "SearchFilterLog"
    WHERE "userId" = %s
    ORDER BY "createdAt" DESC
    LIMIT 20
    """
    return query_to_dataframe(query, (user_id,))


def get_user_map_history(user_id):
    query = """
    SELECT lat, lng, zoom, "createdAt"
    FROM "MapInteraction"
    WHERE "userId" = %s
    ORDER BY "createdAt" DESC
    LIMIT 20
    """
    return query_to_dataframe(query, (user_id,))


def get_all_properties(include_images=True, limit=None):
    """Fetch all available properties with location data."""
    image_subquery = ""
    if include_images:
        image_subquery = """,
        (
            SELECT json_agg(json_build_object('url', url, 'isMain', "isMain"))
            FROM "PropertyImage"
            WHERE "propertyId" = p.id
        ) as images"""

    all_dfs = []
    chunk_size = 1000 if limit is None else min(1000, limit)
    offset = 0

    while True:
        current_limit = chunk_size
        if limit is not None:
            current_limit = min(chunk_size, limit - offset)
            if current_limit <= 0:
                break

        query = f"""
        SELECT 
            p.*, 
            l.city, l.subcity, l.region, l.village, l.lat, l.lng
            {image_subquery}
        FROM "Property" p
        LEFT JOIN "Location" l ON p."locationId" = l.id
        WHERE p.status = 'AVAILABLE'
        ORDER BY p."createdAt" DESC
        LIMIT {current_limit} OFFSET {offset}
        """

        df_chunk = query_to_dataframe(query)
        if df_chunk.empty:
            break

        all_dfs.append(df_chunk)
        if len(df_chunk) < current_limit:
            break

        offset += len(df_chunk)
        if limit is None:
            print(f"[DB] Ingested {offset} properties...")

        if limit is not None and offset >= limit:
            break

    if not all_dfs:
        return pd.DataFrame()

    return pd.concat(all_dfs, ignore_index=True)


# ── Compatibility shim for code that uses get_connection() / cursor pattern ───

class _HttpCursor:
    """Mimics psycopg2 cursor using the Neon HTTP API."""

    def __init__(self):
        self._rows = []
        self._description = []

    def execute(self, sql, params=None):
        rows = _neon_http_query(sql, params)
        self._rows = [list(r.values()) for r in rows]
        if rows:
            self._description = [(k,) for k in rows[0].keys()]
        else:
            self._description = []

    def fetchall(self):
        return self._rows

    def fetchone(self):
        return self._rows[0] if self._rows else None

    @property
    def description(self):
        return self._description

    def close(self):
        pass


class _HttpConnection:
    """Mimics psycopg2 connection using the Neon HTTP API."""

    def cursor(self):
        return _HttpCursor()

    def close(self):
        pass

    def commit(self):
        pass

    def rollback(self):
        pass


def get_connection():
    """Return a fake connection object backed by the Neon HTTP API."""
    return _HttpConnection()
