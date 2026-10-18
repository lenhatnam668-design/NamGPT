let currentImageBase64 = null;
let recognition = null;
let isRecording = false;

window.onload = function() {
    fetch('/api/history')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                showChatView();
                data.forEach(item => {
                    appendMessage(item.user, 'user', false, item.image);
                    appendMessage(item.bot, 'bot', false);
                    addHistorySidebar(item.user);
                });
                triggerMathJax();
            }
        })
        .catch(err => {
            console.log("Chưa có lịch sử hoặc lỗi kết nối API:", err);
        });
    setupSpeechRecognition();
};

function showChatView() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('messageContainer').style.display = 'flex';
}

function triggerMathJax() {
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
        MathJax.typesetPromise().catch(err => console.log(err));
    }
}

function handleImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageBase64 = e.target.result;
        document.getElementById('previewImg').src = currentImageBase64;
        document.getElementById('previewName').textContent = file.name;
        document.getElementById('imagePreviewBar').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    currentImageBase64 = null;
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreviewBar').style.display = 'none';
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
        const speechText = event.results[0][0].transcript;
        document.getElementById('userInput').value = speechText;
        stopRecordingUI();
    };

    recognition.onerror = function() { stopRecordingUI(); };
    recognition.onend = function() { stopRecordingUI(); };
}

function toggleSpeechRecognition() {
    if (!recognition) {
        alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            startRecordingUI();
        } catch (e) {
            console.error(e);
        }
    }
}

function startRecordingUI() {
    isRecording = true;
    document.getElementById('micBtn').classList.add('recording');
    document.getElementById('userInput').placeholder = "Đang lắng nghe bạn nói...";
}

function stopRecordingUI() {
    isRecording = false;
    document.getElementById('micBtn').classList.remove('recording');
    document.getElementById('userInput').placeholder = "Nhập câu hỏi, chụp ảnh đề bài hoặc bấm micro nói...";
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#`_\[\]]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt không hỗ trợ phát âm thanh.");
    }
}

function appendMessage(text, sender, scroll = true, imageUrl = null) {
    showChatView();
    const container = document.getElementById('messageContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    let contentHtml = "";
    if (imageUrl) {
        contentHtml += `<img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%; max-height: 250px; border-radius: 8px; margin-bottom: 8px; display: block;">`;
    }

    if (sender === 'bot') {
        contentHtml += marked.parse(text || "");
        const escapedText = (text || "").replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        contentHtml += `<button class="speak-btn" onclick="speakText('${escapedText}')"><i class="fa-solid fa-volume-high"></i> Nghe đọc</button>`;
        msgDiv.innerHTML = contentHtml;
    } else {
        if (text) {
            contentHtml += `<div>${text}</div>`;
        }
        msgDiv.innerHTML = contentHtml;
    }

    container.appendChild(msgDiv);
    triggerMathJax();

    if (scroll) {
        const chatBox = document.getElementById('chatBox');
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function addHistorySidebar(text) {
    const historyList = document.getElementById('historyList');
    const li = document.createElement('li');
    li.className = 'history-item';
    li.textContent = text || "[Hình ảnh đề bài]";
    historyList.appendChild(li);
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text && !currentImageBase64) return;

    const imageToSend = currentImageBase64;
    appendMessage(text, 'user', true, imageToSend);
    
    input.value = '';
    clearImage();

    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, image: imageToSend })
    })
    .then(res => res.json())
    .then(data => {
        const replyText = data.answer || data.error || "Có lỗi xảy ra.";
        appendMessage(replyText, 'bot');
        addHistorySidebar(text || "Giải bài qua ảnh");
    })
    .catch(err => {
        console.error("Lỗi gửi tin nhắn:", err);
        appendMessage("Lỗi kết nối máy chủ!", 'bot');
    });
}

function sendPrompt(promptText) {
    document.getElementById('userInput').value = promptText;
    sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function clearHistory() {
    fetch('/api/clear', { method: 'POST' })
        .then(() => {
            document.getElementById('messageContainer').innerHTML = '';
            document.getElementById('messageContainer').style.display = 'none';
            document.getElementById('welcomeScreen').style.display = 'block';
            document.getElementById('historyList').innerHTML = '';
        })
        .catch(err => console.error(err));
}
