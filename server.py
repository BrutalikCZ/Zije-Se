import http.server
import socketserver
import json
from pathlib import Path

# Configuration
PORT = 8000
DATA_DIR = Path("data")

class MapRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API endpoint to list files in the data directory
        if self.path == '/api/files':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            # Find all .geojson files in the directory
            files = [f.name for f in DATA_DIR.glob('*.geojson')]
            
            # Send the list as JSON
            self.wfile.write(json.dumps(files).encode())
        else:
            # Serve static files (HTML, JS, CSS, and data files)
            super().do_GET()

# Ensure the data directory exists
if not DATA_DIR.exists():
    DATA_DIR.mkdir()
    print(f"Created directory: {DATA_DIR}")

# Start the server
with socketserver.TCPServer(("", PORT), MapRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()