#!/usr/bin/env python3
"""Send an image to the DeepSeek vision model and print its answer.

Usage: python3 scripts/vision-check.py <image-path> "<question>"
Used by the agent to self-verify screenshots and rendered diagrams.
"""
import base64
import json
import os
import sys
import urllib.request

BASE_URL = os.environ.get("AI_BASE_URL", "https://code-api.erix.vip/v1")
API_KEY = os.environ.get("AI_API_KEY", "")
MODEL = os.environ.get("AI_VISION_MODEL", "deepseek-v4-flash-vision-exp")

if not API_KEY:
    # fall back to .env.local parsing
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    for line in open(env_file):
        if line.startswith("AI_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1].strip('"')

def call_once(image_path: str, question: str) -> str:
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    mime = "image/png"
    if image_path.lower().endswith((".jpg", ".jpeg")):
        mime = "image/jpeg"
    elif image_path.lower().endswith(".webp"):
        mime = "image/webp"
    body = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{data}"},
                    },
                ],
            }
        ],
        "max_tokens": 800,
    }
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        payload = json.loads(resp.read().decode())
    if "error" in payload:
        raise RuntimeError(str(payload["error"])[:300])
    return payload["choices"][0]["message"]["content"] or ""


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    image_path = sys.argv[1]
    question = sys.argv[2] if len(sys.argv) > 2 else "描述这张图的内容，并检查是否有元素重叠、标签截断、连线穿过节点等布局问题。"
    last_err = None
    for attempt in range(3):
        try:
            content = call_once(image_path, question)
            if content.strip():
                print(content)
                return
            last_err = "empty response"
        except Exception as exc:  # noqa: BLE001 - retry then report
            last_err = str(exc)
        import time

        time.sleep(3 * (attempt + 1))
    print(f"[vision-check failed after retries: {last_err}]", file=sys.stderr)
    sys.exit(2)

if __name__ == "__main__":
    main()
