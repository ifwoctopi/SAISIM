"""Tiny allow-listed HTTPS forward proxy (CONNECT only).

The agent runs on an --internal Docker network with no route to the internet.
This proxy is its single, tightly-scoped door out: it tunnels HTTPS only to hosts
on the allow-list (the LLM API, e.g. openrouter.ai) and refuses everything else.
So even though live mode needs a hosted model, the agent's shell and exfiltrate
tools still cannot reach the open internet -- a CONNECT to any other host is
answered with 403.

Pure standard library.
"""

import os
import select
import socket
import threading

LISTEN_PORT = int(os.environ.get("PROXY_PORT", "8888"))
ALLOW_HOSTS = {
    h.strip().lower()
    for h in os.environ.get("ALLOW_HOSTS", "openrouter.ai").split(",")
    if h.strip()
}


def _pipe(a, b):
    """Shuttle bytes between two sockets until either side closes."""
    try:
        while True:
            readable, _, _ = select.select([a, b], [], [], 120)
            if not readable:
                break
            for source in readable:
                data = source.recv(65536)
                if not data:
                    return
                (b if source is a else a).sendall(data)
    except OSError:
        pass


def handle(client):
    upstream = None
    try:
        client.settimeout(15)
        request = b""
        while b"\r\n\r\n" not in request:
            chunk = client.recv(4096)
            if not chunk:
                return
            request += chunk
            if len(request) > 8192:
                return

        line = request.split(b"\r\n", 1)[0].decode("latin1")
        parts = line.split(" ")
        if len(parts) < 2 or parts[0].upper() != "CONNECT":
            client.sendall(b"HTTP/1.1 405 Method Not Allowed\r\n\r\n")
            return

        host, _, port = parts[1].partition(":")
        port = int(port or 443)
        if host.lower() not in ALLOW_HOSTS:
            print(f"[proxy] DENY {host}:{port}", flush=True)
            client.sendall(b"HTTP/1.1 403 Forbidden\r\n\r\n")
            return

        print(f"[proxy] ALLOW {host}:{port}", flush=True)
        upstream = socket.create_connection((host, port), timeout=15)
        client.sendall(b"HTTP/1.1 200 Connection established\r\n\r\n")
        client.settimeout(None)
        _pipe(client, upstream)
    except Exception:  # noqa: BLE001 - a failed tunnel just closes
        try:
            client.sendall(b"HTTP/1.1 502 Bad Gateway\r\n\r\n")
        except OSError:
            pass
    finally:
        if upstream is not None:
            upstream.close()
        client.close()


def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", LISTEN_PORT))
    server.listen(64)
    print(f"[proxy] allow-list={sorted(ALLOW_HOSTS)} listening on :{LISTEN_PORT}", flush=True)
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()


if __name__ == "__main__":
    main()
