"""
HomeSecure Smart Home Security System — web.py backend.

Serves the static frontend and exposes a JSON API for system state and actions.

Run:
  python web.py
  python web.py --port 9000
  set PORT=9000 && python web.py
"""
import argparse
import hashlib
import json
import mimetypes
import os
import secrets
import socket
import sys
from copy import deepcopy

# Avoid shadowing the web.py framework when this file is named web.py
_dir = os.path.dirname(os.path.abspath(__file__))
if __name__ == "__main__":
    sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _dir]

import web  # noqa: E402

if __name__ == "__main__":
    sys.path.insert(0, _dir)

BASE_DIR = _dir

DEFAULT_STATE = {
    "armed": True,
    "alertCount": 3,
    "doorsLocked": True,
    "motionSensitivity": 2,
    "nightVision": True,
    "twoFactor": True,
    "notifications": {"push": True, "sms": False, "email": False},
    "cameraStatuses": {
        "front-door": "clear",
        "backyard": "clear",
        "garage": "clear",
        "side-gate": "clear",
        "living-room": "clear",
        "basement": "offline",
    },
}

system_state = deepcopy(DEFAULT_STATE)

# --- Auth (in-memory demo store) ---
sessions: dict[str, str] = {}  # token -> email


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def user_initials(name: str) -> str:
    parts = name.strip().split()
    return "".join(p[0] for p in parts[:2]).upper() if parts else "?"


def public_user(record: dict) -> dict:
    return {
        "email": record["email"],
        "name": record["name"],
        "initials": record["initials"],
        "phone": record.get("phone") or "",
    }


users_db: dict[str, dict] = {
    "demo@homesecure.com": {
        "email": "demo@homesecure.com",
        "name": "Alex Rivera",
        "initials": "AR",
        "phone": "+63 912 345 6789",
        "password_hash": hash_password("demo1234"),
    },
}


def get_bearer_token() -> str | None:
    auth = web.ctx.env.get("HTTP_AUTHORIZATION", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return None


def get_current_user():
    token = get_bearer_token()
    if not token:
        return None
    email = sessions.get(token)
    if not email:
        return None
    return users_db.get(email)


def require_user():
    user = get_current_user()
    if not user:
        web.ctx.status = "401 Unauthorized"
        return None
    return user


def create_session(email: str) -> str:
    token = secrets.token_urlsafe(32)
    sessions[token] = email
    return token


def deep_merge(base: dict, updates: dict) -> dict:
    result = deepcopy(base)
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = {**result[key], **value}
        else:
            result[key] = value
    return result


def json_response(data):
    web.header("Content-Type", "application/json")
    return json.dumps(data)


def read_json_body():
    raw = web.data()
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def serve_static(path):
    if path.startswith("api/"):
        raise web.notfound()

    filepath = os.path.normpath(os.path.join(BASE_DIR, path))
    if not filepath.startswith(BASE_DIR) or not os.path.isfile(filepath):
        raise web.notfound()

    mime, _ = mimetypes.guess_type(filepath)
    if mime:
        web.header("Content-Type", mime)

    with open(filepath, "rb") as handle:
        return handle.read()


class index:
    def GET(self):
        web.header("Content-Type", "text/html; charset=utf-8")
        with open(os.path.join(BASE_DIR, "index.html"), encoding="utf-8") as handle:
            return handle.read()


class health:
    def GET(self):
        return json_response({"status": "ok", "app": "HomeSecure"})


class auth_login:
    def POST(self):
        data = read_json_body()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        user = users_db.get(email)
        if not user or user["password_hash"] != hash_password(password):
            web.ctx.status = "401 Unauthorized"
            return json_response({"error": "Invalid email or password"})

        token = create_session(email)
        return json_response({"token": token, "user": public_user(user)})


class auth_signup:
    def POST(self):
        data = read_json_body()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not name or not email or len(password) < 6:
            web.ctx.status = "400 Bad Request"
            return json_response({"error": "Name, email, and password (6+ chars) are required"})

        if email in users_db:
            web.ctx.status = "409 Conflict"
            return json_response({"error": "An account with this email already exists"})

        phone = (data.get("phone") or "").strip()
        users_db[email] = {
            "email": email,
            "name": name,
            "initials": user_initials(name),
            "phone": phone,
            "password_hash": hash_password(password),
        }
        token = create_session(email)
        return json_response({"token": token, "user": public_user(users_db[email])})


class auth_logout:
    def POST(self):
        token = get_bearer_token()
        if token and token in sessions:
            del sessions[token]
        return json_response({"ok": True})


class auth_me:
    def GET(self):
        user = require_user()
        if not user:
            return json_response({"error": "Not authenticated"})
        return json_response(public_user(user))


class auth_change_password:
    def POST(self):
        user = require_user()
        if not user:
            return json_response({"error": "Not authenticated"})

        data = read_json_body()
        current = data.get("currentPassword") or ""
        new_password = data.get("newPassword") or ""

        if user["password_hash"] != hash_password(current):
            web.ctx.status = "400 Bad Request"
            return json_response({"error": "Current password is incorrect"})

        if len(new_password) < 6:
            web.ctx.status = "400 Bad Request"
            return json_response({"error": "New password must be at least 6 characters"})

        user["password_hash"] = hash_password(new_password)
        return json_response({"ok": True, "message": "Password updated successfully"})


class auth_reset_password:
    def POST(self):
        data = read_json_body()
        email = (data.get("email") or "").strip().lower()
        new_password = data.get("newPassword") or ""

        if not email or len(new_password) < 6:
            web.ctx.status = "400 Bad Request"
            return json_response(
                {"error": "Email and a new password (6+ characters) are required"}
            )

        user = users_db.get(email)
        if not user:
            web.ctx.status = "404 Not Found"
            return json_response({"error": "No account found with this email"})

        user["password_hash"] = hash_password(new_password)
        return json_response({"ok": True, "message": "Password reset successfully. You can log in now."})


class state_api:
    def GET(self):
        if not require_user():
            return json_response({"error": "Not authenticated"})
        return json_response(system_state)

    def PATCH(self):
        if not require_user():
            return json_response({"error": "Not authenticated"})
        global system_state
        system_state = deep_merge(system_state, read_json_body())
        return json_response(system_state)


class alarm:
    def POST(self):
        if not require_user():
            return json_response({"error": "Not authenticated"})
        return json_response({"ok": True, "message": "Alarm activated"})


class lock_doors:
    def POST(self):
        if not require_user():
            return json_response({"error": "Not authenticated"})
        global system_state
        system_state["doorsLocked"] = not system_state["doorsLocked"]
        return json_response({"ok": True, "doorsLocked": system_state["doorsLocked"]})


class patrol:
    def POST(self):
        if not require_user():
            return json_response({"error": "Not authenticated"})
        return json_response({
            "ok": True,
            "message": "Security patrol requested. Estimated arrival: 8 mins.",
        })


class static_files:
    def GET(self, path):
        return serve_static(path)


urls = (
    "/",
    "index",
    "/api/health",
    "health",
    "/api/auth/login",
    "auth_login",
    "/api/auth/signup",
    "auth_signup",
    "/api/auth/logout",
    "auth_logout",
    "/api/auth/me",
    "auth_me",
    "/api/auth/change-password",
    "auth_change_password",
    "/api/auth/reset-password",
    "auth_reset_password",
    "/api/state",
    "state_api",
    "/api/alarm",
    "alarm",
    "/api/lock-doors",
    "lock_doors",
    "/api/patrol",
    "patrol",
    "/(.*)",
    "static_files",
)

app = web.application(urls, globals())

BIND_HOST = "0.0.0.0"
DEFAULT_PORT = 5000
MAX_PORT_ATTEMPTS = 20
# Your PC's LAN address for phones/other devices on the same Wi‑Fi
NETWORK_IP = os.environ.get("NETWORK_IP", "192.168.18.115")


def is_port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False


def resolve_port(host: str, preferred: int) -> int:
    if is_port_available(host, preferred):
        return preferred

    print(f"Port {preferred} is already in use on {host}.", flush=True)
    for offset in range(1, MAX_PORT_ATTEMPTS):
        candidate = preferred + offset
        if is_port_available(host, candidate):
            print(f"Using port {candidate} instead.", flush=True)
            return candidate

    raise SystemExit(
        f"No free port found between {preferred} and "
        f"{preferred + MAX_PORT_ATTEMPTS - 1}. "
        "Stop the other process or pass --port <number>."
    )


def get_lan_ip() -> str | None:
    """Best-effort local network IP (e.g. 192.168.x.x) for LAN access."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        pass
    return None


def get_network_ip(configured: str) -> str:
    """Use configured LAN IP; fall back to auto-detect if unset."""
    if configured and configured.strip():
        return configured.strip()
    detected = get_lan_ip()
    return detected or "192.168.18.115"


def print_access_urls(port: int, network_ip: str) -> None:
    print("\nHomeSecure is running:", flush=True)
    print(f"  Local:    http://127.0.0.1:{port}/login.html", flush=True)
    print(f"  Network:  http://{network_ip}:{port}/login.html", flush=True)
    detected = get_lan_ip()
    if detected and detected != network_ip:
        print(f"  (detected IP: {detected})", flush=True)
    print("  Demo login: demo@homesecure.com / demo1234", flush=True)
    print("\nPress Ctrl+C to stop.\n", flush=True)


def parse_cli_args():
    parser = argparse.ArgumentParser(description="Run the HomeSecure web server.")
    parser.add_argument(
        "--port",
        "-p",
        type=int,
        default=int(os.environ.get("PORT", DEFAULT_PORT)),
        help=f"Port to listen on (default: {DEFAULT_PORT}, or PORT env var)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable web.py debug mode (auto-reload on code changes)",
    )
    parser.add_argument(
        "--ip",
        default=os.environ.get("NETWORK_IP", NETWORK_IP),
        help=f"LAN IP shown for network access (default: {NETWORK_IP})",
    )
    return parser.parse_args()


def run_server(port: int, debug: bool = False, network_ip: str = NETWORK_IP) -> None:
    if debug:
        web.config.debug = True

    chosen_port = resolve_port(BIND_HOST, port)
    lan_ip = get_network_ip(network_ip)
    print_access_urls(chosen_port, lan_ip)
    web.httpserver.runsimple(app.wsgifunc(), (BIND_HOST, chosen_port))


if __name__ == "__main__":
    cli = parse_cli_args()
    run_server(cli.port, debug=cli.debug, network_ip=cli.ip)
