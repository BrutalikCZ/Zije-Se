import http.server
import socketserver
import json
from pathlib import Path

# Configuration
PORT = 8001
DATA_DIR = Path("data")

class MapRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API endpoint to list files in the data directory
        if self.path == '/api/files':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()



            files = [f.name for f in DATA_DIR.glob('*.geojson')]
            
            # Send the list as JSON
            self.wfile.write(json.dumps(files).encode())
        else:
            super().do_GET()

if not DATA_DIR.exists():
    DATA_DIR.mkdir()
    print(f"Created directory: {DATA_DIR}")

with socketserver.TCPServer(("", PORT), MapRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()