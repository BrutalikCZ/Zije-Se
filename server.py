import http.server
import socketserver
import json
from pathlib import Path

# Import the logic from AILogic
from AILogic import ollamaHandler
print("verze s AILogic 1")
# Configuration
PORT = 8000
DATA_DIR = Path("data")


try:
    from AILogic import ollamaHandler
    print("SUCCESS: AILogic module loaded.")
except ImportError as e:
    print(f"CRITICAL ERROR: Could not load AILogic. {e}")

class MapRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API endpoint to list files in the data directory
        if self.path == '/api/files':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            files = [f.name for f in DATA_DIR.glob('*.geojson')]
            self.wfile.write(json.dumps(files).encode())
        else:
            super().do_GET()

    # New method to handle Chat requests
    def do_POST(self):
        if self.path == '/api/chat':
            ollamaHandler.handle_chat_request(self)
        else:
            self.send_error(404, "Endpoint not found")

if not DATA_DIR.exists():
    DATA_DIR.mkdir()
    print(f"Created directory: {DATA_DIR}")

# Use ThreadingTCPServer to prevent the chat from freezing the map loading
# Switch from socketserver.TCPServer to ThreadingTCPServer
class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

with ThreadingHTTPServer(("", PORT), MapRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()