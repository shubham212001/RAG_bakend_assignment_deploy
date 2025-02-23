import os
import json
import requests

# Folder containing JSON files
folder_path = "/Users/shubhamsharma/Downloads/jsons"  # Update your folder path
upload_url = "https://rag-bakend-assignment-deploy-4t2h.onrender.com/api/json/json_upload"

uploaded_files = {}

# Default operations
default_operations = ["max", "min", "sum", "average"]

for filename in os.listdir(folder_path):
    if filename.endswith(".json"):
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, "rb") as file:
            files = {"document": file}
            response = requests.post(upload_url, files=files)

            if response.status_code == 200:
                data = response.json()
                document_id = data.get("json_global_id")  # Extract document ID
                
                if document_id:
                    uploaded_files[filename] = {
                        "document_id": document_id,
                        "field": "",  # User will manually enter
                        "operations": default_operations  # Default set
                    }
                    print(f"✅ Uploaded: {filename} | Document ID: {document_id}")
                else:
                    print(f"⚠️ Failed to get document ID for {filename}")
            else:
                print(f"❌ Upload failed for {filename}")

# Save uploaded JSON details for further processing
script_dir = os.path.dirname(os.path.abspath(__file__))  # Get script's absolute directory
config_path = os.path.join(script_dir, "json_uploaded_files.json")  # Store JSON in script's directory
with open(config_path, "w") as f:
    json.dump(uploaded_files, f, indent=4)

print(f"\n📂 Saved uploaded file details to {config_path}")
print("👉 Now, edit 'uploaded_files.json' to specify the 'field' for each file.")