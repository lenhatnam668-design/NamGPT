import base64
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from flask import Flask, jsonify, render_template, request

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "nam_smart.db"
app = Flask(__name__)
app.json.ensure_ascii = False
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT NOT NULL,
            role TEXT NOT NULL, content TEXT NOT NULL, image TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        );
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id);
        """)

init_db()

def now():
    return datetime.now(timezone.utc).isoformat()

def validate_image(data):
    if not data:
        return None
    if not isinstance(data, str) or not data.startswith("data:image/") or ";base64," not in data:
        raise ValueError("Ảnh không đúng định dạng.")
    header, payload = data.split(",", 1)
    mime = header[5:].split(";", 1)[0]
    if mime not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise ValueError("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.")
    try:
        raw = base64.b64decode(payload, validate=True)
    except (ValueError, base64.binascii.Error):
        raise ValueError("Dữ liệu ảnh không hợp lệ.")
    if len(raw) > 7 * 1024 * 1024:
        raise ValueError("Ảnh vượt quá 7 MB.")
    return data

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/conversations")
def conversations():
    with db() as conn:
        rows = conn.execute("SELECT id, title, updated_at FROM conversations ORDER BY updated_at DESC").fetchall()
    return jsonify([dict(row) for row in rows])

@app.get("/api/conversations/<conversation_id>")
def get_conversation(conversation_id):
    with db() as conn:
        conversation = conn.execute("SELECT id, title FROM conversations WHERE id=?", (conversation_id,)).fetchone()
        if not conversation:
            return jsonify(error="Không tìm thấy cuộc trò chuyện."), 404
        messages = conn.execute("SELECT role, content, image FROM messages WHERE conversation_id=? ORDER BY id", (conversation_id,)).fetchall()
    return jsonify(id=conversation["id"], title=conversation["title"], messages=[dict(m) for m in messages])

@app.delete("/api/conversations/<conversation_id>")
def delete_conversation(conversation_id):
    with db() as conn:
        conn.execute("DELETE FROM messages WHERE conversation_id=?", (conversation_id,))
        conn.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))
    return jsonify(ok=True)

@app.post("/api/chat")
def chat():
    data = request.get_json() or {}
    conv_id = data.get("conversation_id")
    user_msg = data.get("message", "").strip()
    image_data = data.get("image")

    if not user_msg and not image_data:
        return jsonify(error="Vui lòng nhập tin nhắn hoặc gửi ảnh."), 400

    try:
        validated_img = validate_image(image_data)
    except ValueError as e:
        return jsonify(error=str(e)), 400

    with db() as conn:
        if not conv_id:
            conv_id = str(uuid.uuid4())
            title = user_msg[:30] + ("..." if len(user_msg) > 30 else "") or "Hình ảnh bài tập"
            conn.execute("INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                         (conv_id, title, now(), now()))
        else:
            conn.execute("UPDATE conversations SET updated_at=? WHERE id=?", (now(), conv_id))

        conn.execute("INSERT INTO messages (conversation_id, role, content, image, created_at) VALUES (?, ?, ?, ?, ?)",
                     (conv_id, "user", user_msg, validated_img, now()))

        # Phản hồi thông minh giả lập đa môn học tích hợp MathJax
        response_content = (
            f"Chào bạn, **NamGPT** đã tiếp nhận câu hỏi của bạn: *\"{user_msg}\"*.\n\n"
            "Dưới đây là phần hướng dẫn chi tiết từng bước:\n\n"
            "1. **Phân tích đề bài**: Xác định rõ các dữ kiện đã cho và yêu cầu cần giải quyết.\n"
            "2. **Giải chi tiết bằng công thức Toán học (LaTeX)**:\n"
            "   - Công thức dòng: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$\n"
            "   - Công thức hiển thị riêng dòng:\n"
            "     $$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$\n"
            "3. **Kết luận**: Bài toán được giải quyết hoàn toàn chính xác và khoa học."
        )

        conn.execute("INSERT INTO messages (conversation_id, role, content, image, created_at) VALUES (?, ?, ?, ?, ?)",
                     (conv_id, "assistant", response_content, None, now()))
        conn.commit()

    return jsonify(conversation_id=conv_id, reply=response_content)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
