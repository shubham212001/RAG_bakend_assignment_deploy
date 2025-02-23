import os
import json
import requests

# Backend API URL for file upload
UPLOAD_URL = "https://rag-bakend-assignment-deploy-4t2h.onrender.com/api/files/upload"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the folder containing documents
FOLDER_PATH = "/Users/shubhamsharma/Downloads/api_test"  # 🔄 Replace with actual folder path

# Output file for storing document IDs
# OUTPUT_JSON = "queries.json"
OUTPUT_JSON = os.path.join(SCRIPT_DIR, "queries.json")

# Dictionary to store document IDs
uploaded_docs = {}

# Function to determine content type based on file extension
def get_content_type(filename):
    if filename.endswith(".pdf"):
        return "application/pdf"
    elif filename.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith(".txt"):
        return "text/plain"
    else:
        return None

# Loop through all files in the folder
for filename in os.listdir(FOLDER_PATH):
    file_path = os.path.join(FOLDER_PATH, filename)
    content_type = get_content_type(filename)

    # Skip unsupported file types
    if not content_type:
        print(f"⚠️ Skipping unsupported file: {filename}")
        continue

    # Try uploading the file
    try:
        with open(file_path, "rb") as file:
            files = {"document": (filename, file, content_type)}
            response = requests.post(UPLOAD_URL, files=files, timeout=120)
            response.raise_for_status()  # Raise error if request fails
            
            data = response.json()
            doc_id = data.get("globaldocumentId")

            if doc_id:
                uploaded_docs[filename] = {"document_id": doc_id, "queries": []}
                print(f"✅ Uploaded: {filename} | Document ID: {doc_id}")
            else:
                print(f"⚠️ Failed to retrieve document ID for {filename}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error uploading {filename}: {e}")

# Save document IDs to a JSON file
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(uploaded_docs, f, indent=4)

print(f"\n📄 Document IDs saved to '{OUTPUT_JSON}'")