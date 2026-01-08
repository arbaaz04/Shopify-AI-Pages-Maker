import requests
import json
import os

def send_webhook_from_file():
    url = "https://ai-rainmaker--development.gadget.app/mindpal-webhook"
    filename = "data.json"

    # 1. Check if the file exists
    if not os.path.exists(filename):
        print(f"❌ Error: {filename} not found. Please create it in this folder.")
        return

    try:
        # 2. Read the JSON file
        with open(filename, 'r') as file:
            # We load it as an object first to ensure it's valid
            json_data = json.load(file)
            # Convert it back to a string to put it inside the 'content' field
            json_string = json.dumps(json_data)

        # 3. Construct the payload
        payload = {
            "workflow_run_id": "test-run-123",
            "workflow_run_input": [
                {
                    "title": "generation_job_id",
                    "content": "66"
                }
            ],
            "workflow_run_output": [
                {
                    "title": "AI Generated Content",
                    "content": json_string
                }
            ]
        }

        # 4. Send the request
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code in [200, 201]:
            print("✅ Success! The webhook was sent.")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(f"Server Response: {response.text}")

    except json.JSONDecodeError as e:
        print(f"❌ Error: Your data.json file contains invalid JSON: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    send_webhook_from_file()