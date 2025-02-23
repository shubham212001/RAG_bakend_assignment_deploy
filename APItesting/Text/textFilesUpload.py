import os
import json
import requests

# Backend API Endpoint
upload_url = "https://rag-bakend-assignment-deploy.onrender.com/api/files/upload"

# Folder containing PDF files
folder_path = "/Users/shubhamsharma/Downloads/api_test"  # Change this to your folder

# Output JSON file
output_json = "queries.json"

# Ensure the folder exists
if not os.path.exists(folder_path):
    print("❌ Folder does not exist!")
    exit()

# Dictionary to store document IDs with empty queries
queries_dict = {}

# Upload files
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)

    if filename.endswith(".pdf"):
        try:
            with open(file_path, "rb") as file:
                files = {"document": (filename, file, "application/pdf")}
                response = requests.post(upload_url, files=files, timeout=12000)
                response.raise_for_status()

                data = response.json()
                doc_id = data.get("globaldocumentId")

                if doc_id:
                    queries_dict[filename] = {
                        "document_id": doc_id,
                        "queries": []  # Empty list for user to fill in queries
                    }
                    print(f"✅ Uploaded: {filename} | Document ID: {doc_id}")
                else:
                    print(f"⚠️ Failed to get document ID for {filename}")

        except Exception as e:
            print(f"❌ Error uploading {filename}: {e}")

# Save JSON file with document IDs and empty queries
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(queries_dict, f, indent=4)

print(f"\n📄 JSON file '{output_json}' generated! Fill in the queries before running the next script.")
