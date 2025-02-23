import json
import requests
import os
# Backend API Endpoint
search_url = "https://rag-bakend-assignment-deploy-4t2h.onrender.com/api/search/search"
# search_url="http://localhost:4000/api/search/search"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Define input and output file paths (in the same directory as the script)
input_json = os.path.join(SCRIPT_DIR, "queries.json")
output_txt = os.path.join(SCRIPT_DIR, "query_results.txt")


# Load JSON file with document IDs and queries
with open(input_json, "r", encoding="utf-8") as f:
    queries_dict = json.load(f)

# Open the TXT file for writing
with open(output_txt, "w", encoding="utf-8") as f_out:

    # Run queries for each document
    for filename, info in queries_dict.items():
        doc_id = info["document_id"]
        queries = info["queries"]

        if not queries:
            print(f"⚠️ Skipping {filename} (No queries provided)")
            continue

        f_out.write(f"\n=== File: {filename} ===\n")  # Write filename as header

        for query in queries:
            query_data = {"query": query, "globaldocumentId": doc_id}

            try:
                response = requests.post(search_url, json=query_data, timeout=10000)
                response.raise_for_status()

                data = response.json()
                merged_text = " ".join(chunk.get("text", "") for chunk in data if isinstance(chunk, dict))

                # Write query and response to the TXT file
                f_out.write(f"\nQuery: {query}\nResponse: {merged_text}\n{'-'*50}\n")

                print(f"✅ Query: '{query}' processed for {filename}")

            except Exception as e:
                error_message = f"❌ Error processing query '{query}' for {filename}: {e}"
                print(error_message)
                f_out.write(f"\nQuery: {query}\nResponse: ERROR - {e}\n{'-'*50}\n")

print(f"\n📄 Query results saved to '{output_txt}'")