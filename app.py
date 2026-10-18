import os
import base64
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)

# Khởi tạo Gemini Client với API Key từ tệp .env
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

chat_history = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(chat_history)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    image_data = data.get('image', None)
    
    if not user_message and not image_data:
        return jsonify({"error": "Nội dung trống!"}), 400

    try:
        contents = []
        
        context_prompt = "Bạn là Nam Smart, trợ lý học tập thông minh, thân thiện, giỏi Toán, Văn, Anh, Sinh... Hãy giải thích chi tiết, rõ ràng từng bước và định dạng công thức toán học bằng chuẩn LaTeX.\n\n"
        for item in chat_history[-3:]:
            context_prompt += f"Học sinh: {item['user']}\nNam Smart: {item['bot']}\n"
            
        if user_message:
            contents.append(context_prompt + f"Học sinh: {user_message}")
        else:
            contents.append(context_prompt + "Học sinh gửi một hình ảnh đề bài cần giải đáp.")

        if image_data:
            if "," in image_data:
                header, encoded = image_data.split(",", 1)
                image_bytes = base64.b64decode(encoded)
                
                mime_type = "image/jpeg"
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"

                contents.append(
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    )
                )

        # Sử dụng model gemini-2.5-flash hoặc gemini-1.5-flash
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
        )
        
        bot_reply = response.text
        
        chat_history.append({
            "user": user_message if user_message else "[Hình ảnh đề bài]",
            "bot": bot_reply,
            "image": image_data
        })
        
        return jsonify({"answer": bot_reply})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clear', methods=['POST'])
def clear_history():
    chat_history.clear()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
