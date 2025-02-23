import json
import requests

# Backend API Endpoint
search_url = "https://rag-bakend-assignment-deploy.onrender.com/api/search/search"

# Input JSON file
input_json = "queries.json"
output_results = "query_results.json"

# Load JSON file with document IDs and queries
with open(input_json, "r", encoding="utf-8") as f:
    queries_dict = json.load(f)

# Dictionary to store results
results = {}

# Run queries for each document
for filename, info in queries_dict.items():
    doc_id = info["document_id"]
    queries = info["queries"]
    
    if not queries:
        print(f"⚠️ Skipping {filename} (No queries provided)")
        continue

    results[filename] = {}

    for query in queries:
        query_data = {"query": query, "globaldocumentId": doc_id}

        try:
            response = requests.post(search_url, json=query_data, timeout=10)
            response.raise_for_status()

            data = response.json()
            merged_text = " ".join(chunk.get("text", "") for chunk in data if isinstance(chunk, dict))

            results[filename][query] = merged_text
            print(f"✅ Query: '{query}' processed for {filename}")

        except Exception as e:
            print(f"❌ Error processing query '{query}' for {filename}: {e}")

# Save results to JSON file
with open(output_results, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=4)

print(f"\n📄 Query results saved to '{output_results}'")