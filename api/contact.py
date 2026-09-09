"""Build With Us form handler.

Validates the submission server-side (required fields + honeypot) and
forwards it to Web3Forms, keeping the access key out of the page source.
Runs as a Vercel Python serverless function.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.error
import urllib.request

WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit"
REQUIRED_FIELDS = ("Name", "Email")
REQUEST_TIMEOUT_SECONDS = 10


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        raw_body = self.rfile.read(length) if length else b""

        try:
            payload = json.loads(raw_body or b"{}")
        except json.JSONDecodeError:
            self._send_json(400, {"success": False, "message": "Invalid request body."})
            return

        if not isinstance(payload, dict):
            self._send_json(400, {"success": False, "message": "Invalid request body."})
            return

        if payload.get("botcheck"):
            # Honeypot tripped — report success without sending anything, so bots learn nothing.
            self._send_json(200, {"success": True})
            return

        missing = [field for field in REQUIRED_FIELDS if not str(payload.get(field, "")).strip()]
        if missing:
            self._send_json(400, {
                "success": False,
                "message": f"Missing required field(s): {', '.join(missing)}.",
            })
            return

        access_key = os.environ.get("WEB3FORMS_KEY")
        if not access_key:
            self._send_json(500, {"success": False, "message": "Server is not configured to send messages."})
            return

        forward_payload = {k: v for k, v in payload.items() if k != "botcheck"}
        forward_payload["access_key"] = access_key
        forward_payload["subject"] = "New Build With Us submission"

        req = urllib.request.Request(
            WEB3FORMS_ENDPOINT,
            data=json.dumps(forward_payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                result = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, json.JSONDecodeError):
            self._send_json(502, {"success": False, "message": "Could not reach the mail service. Please try again shortly."})
            return

        self._send_json(200 if result.get("success") else 502, result)

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
