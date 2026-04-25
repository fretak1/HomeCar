from app.database import query_to_dataframe

query = """
SELECT type, count(*) 
FROM (
    SELECT 'FAVORITE' as type FROM "Favorite"
    UNION ALL
    SELECT 'APPLICATION' as type FROM "Application"
    UNION ALL
    SELECT 'TRANSACTION' as type FROM "Transaction"
    UNION ALL
    SELECT 'VIEW' as type FROM "PropertyView"
) s 
GROUP BY type
"""

counts = query_to_dataframe(query)
print("\n--- Interaction Counts ---")
print(counts)

total = counts['count'].sum() if not counts.empty else 0
print(f"\nTotal Interactions: {total}")
