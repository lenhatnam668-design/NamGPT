import os
import logging
import requests

from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-secret")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

logging.basicConfig(level=logging.INFO)

API_KEY = os.getenv("GROQ_API_KEY", "").strip()
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """
Bạn là Bestie, người bạn AI học tập thân thiện.
Mặc định trả lời bằng tiếng Việt; dùng tiếng Anh khi người dùng yêu cầu.
Giải Toán theo từng bước, kiểm tra phép tính và điều kiện.
Không bịa kiến thức. Nếu đề bài thiếu dữ kiện, hãy hỏi lại.
Nếu không chắc chắn, hãy nói rõ và hướng dẫn cách kiểm tra.
Dùng Markdown và LaTeX khi phù hợp.
"""

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/status")
def status():
    return jsonify({
        "ok": True,
        "api_configured": bool(API_KEY),
        "model": MODEL
    })

@app.get("/api/history")
def get_history():
    return jsonify({"history": session.get("history", [])})

@app.delete("/api/history")
def clear_history():
    session["history"] = []
    return jsonify({"ok": True})

@app.post("/api/chat")
def chat():
    if not API_KEY:
        return jsonify({
            "error": "Chưa cấu hình GROQ_API_KEY trên Render."
        }), 503

    data = request.get_json(silent=True) or {}
    question = str(data.get("message", "")).strip()
    image = data.get("image")

    if not question and not image:
        return jsonify({"error": "Bạn hãy nhập câu hỏi nhé."}), 400

    if image and (
        not isinstance(image, str)
        or not image.startswith("data:image/")
        or len(image) > 5_500_000
    ):
        return jsonify({"error": "Ảnh không hợp lệ hoặc quá lớn."}), 400

    history = session.get("history", [])
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-12:])

    content = question or "Hãy phân tích ảnh đề bài này."

    if image:
        content = [
            {"type": "text", "text": content},
            {
                "type": "image_url",
                "image_url": {"url": image}
            }
        ]

    messages.append({"role": "user", "content": content})

    try:
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MODEL,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1800
            },
            timeout=60
        )

        if response.status_code >= 400:
            logging.error(
                "AI API error %s: %s",response.status_code,
                response.text[:500]
            )
            return jsonify({
                "error": (
                    "API key, model hoặc yêu cầu không hợp lệ. "
                    "Hãy kiểm tra Environment và model đang sử dụng."
                )
            }), 502

        result = response.json()
        answer = result["choices"][0]["message"]["content"]

        history = history + [
            {"role": "user", "content": question or "[Đã gửi ảnh]"},
            {"role": "assistant", "content": answer}
        ]
        session["history"] = history[-24:]

        return jsonify({"answer": answer})

    except requests.Timeout:
        return jsonify({"error": "AI phản hồi quá lâu, hãy thử lại."}), 504
    except (requests.RequestException, KeyError, IndexError, ValueError):
        logging.exception("Bestie request failed")
        return jsonify({
            "error": "Không kết nối được AI hoặc phản hồi không hợp lệ."
        }), 502

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000"))
    )
