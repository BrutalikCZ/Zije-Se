# AILogic/ollamaHandler.py

import json
import urllib.request
import urllib.error

# Configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gpt-oss:latest"

def handle_chat_request(request_handler):
    try:
        # 1. Read the length of the content
        content_length = int(request_handler.headers['Content-Length'])
        
        # 2. Read the body
        post_data = request_handler.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        full_prompt = data.get('prompt', '') # Toto obsahuje systémová data i otázku uživatele
        model = data.get('model', DEFAULT_MODEL)

        # --- NOVÉ: VÝPIS DO TERMINÁLU ---
        print("\n" + "="*60)
        print(f"[AI DEBUG] Incoming Request (Model: {model})")
        print("-" * 60)
        print(full_prompt)
        print("-" * 60)
        print("waiting for ollama...\n")
        # --------------------------------

        # 3. Prepare request to Ollama
        ollama_payload = {
            "model": model,
            "prompt": full_prompt,
            "stream": False 
        }
        
        json_payload = json.dumps(ollama_payload).encode('utf-8')
        req = urllib.request.Request(
            OLLAMA_API_URL, 
            data=json_payload, 
            headers={'Content-Type': 'application/json'}
        )

        # 4. Send to Ollama and get response
        with urllib.request.urlopen(req) as response:
            ollama_response = json.loads(response.read().decode('utf-8'))
            reply_text = ollama_response.get('response', '')
            
            # (Volitelné) Výpis odpovědi, abyste viděli, že to proběhlo
            print(f"[AI DEBUG] Response sent ({len(reply_text)} chars).") 

            # 5. Send back to frontend
            request_handler.send_response(200)
            request_handler.send_header('Content-type', 'application/json')
            request_handler.end_headers()
            
            response_data = json.dumps({"reply": reply_text})
            request_handler.wfile.write(response_data.encode())

    except urllib.error.URLError as e:
        print(f"Ollama Error: {e.reason}")
        send_error(request_handler, 503, f"Ollama connection failed: {e.reason}")
    except Exception as e:
        print(f"Internal Error: {str(e)}")
        send_error(request_handler, 500, f"Internal Error: {str(e)}")

def send_error(handler, code, message):
    handler.send_response(code)
    handler.send_header('Content-type', 'application/json')
    handler.end_headers()
    handler.wfile.write(json.dumps({"error": message}).encode())