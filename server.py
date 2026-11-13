#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gram Panchayat Nangwada - Local HTTP Server (Python)
Port: 1234
"""
import http.server
import socketserver
import json
import os
import random
from datetime import datetime
from urllib.parse import urlparse

PORT = 1234
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMPLAINTS_FILE = os.path.join(BASE_DIR, "data", "complaints.json")

class NangwadaHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == "/api/complaints":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if os.path.exists(COMPLAINTS_FILE):
                with open(COMPLAINTS_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"[]")
            return
        return super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == "/api/complaints":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            random_id = f"NGW-2026-{random.randint(1000, 9999)}"
            now_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
            entry = {
                "id": random_id,
                "name": data.get("name", "नागरिक"),
                "mobile": data.get("mobile", "-"),
                "ward": data.get("ward", "सामान्य"),
                "category": data.get("category", "अन्य"),
                "description": data.get("description", ""),
                "photo": data.get("photo", ""),
                "date": now_str,
                "status": "दर्ज की गई (समीक्षाधीन)",
                "statusColor": "blue"
            }

            complaints = []
            if os.path.exists(COMPLAINTS_FILE):
                try:
                    with open(COMPLAINTS_FILE, "r", encoding="utf-8") as f:
                        complaints = json.load(f)
                except Exception:
                    complaints = []

            complaints.insert(0, entry)
            os.makedirs(os.path.dirname(COMPLAINTS_FILE), exist_ok=True)
            with open(COMPLAINTS_FILE, "w", encoding="utf-8") as f:
                json.dump(complaints, f, ensure_ascii=False, indent=2)

            res = {
                "success": True,
                "message": "आपकी जनसमस्या सफलतापूर्वक दर्ज कर ली गई है।",
                "trackingId": random_id,
                "date": now_str,
                "complaint": entry
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    print(f"Gram Panchayat Nangwada Server running on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), NangwadaHTTPRequestHandler) as httpd:
        httpd.serve_forever()
