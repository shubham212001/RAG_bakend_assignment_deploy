
import os
import json
import requests

# API Endpoint
stats_url = "https://rag-bakend-assignment-deploy-4t2h.onrender.com/api/json/json_stats"

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load uploaded files config from the same folder as the script
config_path = os.path.join(script_dir, "json_uploaded_files.json")
output_path = os.path.join(script_dir, "json_query_results.txt")  # Save output in the same directory

# Load uploaded files
with open(config_path, "r") as f:
    uploaded_files = json.load(f)

# Store results
results = []

# Function to send requests
def get_json_stats(document_id, field, operation, value=None):
    params = {
        "document_id": document_id,
        "field": field,
        "operation": operation
    }
    if value is not None:
        params["value"] = value

    try:
        response = requests.get(stats_url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

# Process each file
for filename, details in uploaded_files.items():
    doc_id = details["document_id"]
    field = details["field"]
    operations = details["operations"]

    print(f"\n🔍 Running queries for {filename} (Field: {field})")

    for operation in operations:
        print(f"    - {operation}")
        result = get_json_stats(doc_id, field, operation)
        results.append(f"{filename} | {field} | {operation} | {result}")

# Save results to TXT in the same directory as the script
with open(output_path, "w") as f:
    f.write("\n".join(results))

print(f"\n📄 Results saved to {output_path}")  