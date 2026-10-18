const $ = id => document.getElementById(id);
let imageData = null;
let busy = false;

function renderMarkdown(text) {
  const html = window.marked
    ? marked.parse(text)
    : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return window.DOMPurify ? DOMPurify.sanitize(html) : html;
}

function addMessage(text, role, image = null) {
  const box = document.createElement("div");
  box.className = "message " + role;

  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "Ảnh đề bài";
    box.appendChild(img);
  }

  const body = document.createElement("div");
  body.innerHTML = role === "assistant"
    ? renderMarkdown(text)
    : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  box.appendChild(body);

  if (role === "assistant") {
    const speak = document.createElement("button");
    speak.className = "secondary";
    speak.textContent = "🔊 Đọc câu trả lời";
    speak.style.marginTop = "10px";
    speak.onclick = () => {
      if (!("speechSynthesis" in window)) {
        alert("Trình duyệt chưa hỗ trợ đọc văn bản.");
        return;
      }
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.95;
      speechSynthesis.speak(utterance);
    };
    box.appendChild(speak);
  }

  $("messages").appendChild(box);

  if (role === "assistant" && window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([box]).catch(() => {});
  }

  $("messages").scrollTop = $("messages").scrollHeight;
}

function showChat() {
  $("home").classList.add("hidden");
  $("chatPage").classList.remove("hidden");
  loadHistory();
}

function showHome() {
  $("chatPage").classList.add("hidden");
  $("home").classList.remove("hidden");
}

async function loadHistory() {
  try {
    const response = await fetch("/api/history");
    const data = await response.json();
    const list = $("history");
    list.replaceChildren();

    const history = data.history || [];

    for (let i = 0; i < history.length; i += 2) {
      if (history[i]?.role !== "user") continue;

      const button = document.createElement("button");
      button.textContent = "♡ " + (history[i].content || "Cuộc trò chuyện").slice(0, 40);

      button.onclick = () => {
        $("messages").replaceChildren();
        for (const item of history.slice(i, i + 2)) {
          addMessage(item.content, item.role);
        }
      };

      list.appendChild(button);
    }
  } catch (error) {
    console.error("History:", error);
  }
}

$("start").onclick = showChat;
$("backHome").onclick = showHome;

$("newChat").onclick = () => {
  $("messages").replaceChildren();
  const welcome = document.createElement("div");
  welcome.className = "welcome";
  welcome.innerHTML = "<h2>Học tiếp nhé, bestie! ♡</h2><p>Gửi câu hỏi mới của bạn.</p>";$("messages").appendChild(welcome);
  imageData = null;
  $("preview").classList.add("hidden");
};

$("clearHistory").onclick = async () => {
  if (!confirm("Bạn có muốn xóa lịch sử không?")) return;
  await fetch("/api/history", { method: "DELETE" });
  $("messages").replaceChildren();
  $("history").replaceChildren();
};

document.querySelectorAll(".suggest").forEach(button => {
  button.onclick = () => {
    $("question").value = button.dataset.q;
    $("question").focus();
  };
});

$("image").onchange = event => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
    alert("Chọn ảnh hợp lệ có dung lượng tối đa 4 MB nhé.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    $("preview").src = imageData;
    $("preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
};

$("voice").onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Nhập giọng nói chưa được hỗ trợ trên trình duyệt này. Hãy thử Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "vi-VN";
  recognition.interimResults = false;

  recognition.onresult = event => {
    $("question").value += ($("question").value ? " " : "") +
      event.results[0][0].transcript;
  };

  recognition.onerror = () => alert("Không nhận được giọng nói. Hãy kiểm tra quyền micro.");
  recognition.start();
};

$("chatForm").onsubmit = async event => {
  event.preventDefault();
  if (busy) return;

  const message = $("question").value.trim();
  if (!message && !imageData) {
    alert("Nhập câu hỏi hoặc chọn ảnh trước nhé.");
    return;
  }

  const sentImage = imageData;
  addMessage(message || "Hãy phân tích ảnh này.", "user", sentImage);

  $("question").value = "";
  $("preview").classList.add("hidden");
  $("image").value = "";
  imageData = null;
  busy = true;
  $("send").disabled = true;

  const waiting = document.createElement("div");
  waiting.className = "message assistant";
  waiting.textContent = "Bestie đang suy nghĩ…";
  $("messages").appendChild(waiting);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, image: sentImage })
    });

    const data = await response.json();
    waiting.remove();

    if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");

    addMessage(data.answer, "assistant");
    await loadHistory();
  } catch (error) {
    waiting.remove();
    addMessage("Mình chưa trả lời được: " + error.message, "assistant");
  } finally {
    busy = false;
    $("send").disabled = false;
  }
};
