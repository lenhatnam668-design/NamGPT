document.addEventListener('DOMContentLoaded', () => {
    let currentConversationId = null;
    let selectedImageBase64 = null;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const breadcrumb = document.getElementById('breadcrumb');

    const homeScreen = document.getElementById('homeScreen');
    const historyScreen = document.getElementById('historyScreen');
    const chatScreen = document.getElementById('chatScreen');

    const homeNav = document.getElementById('homeNav');
    const historyNav = document.getElementById('historyNav');
    const newChatBtn = document.getElementById('newChat');

    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const messageContainer = document.getElementById('messageContainer');
    const historyList = document.getElementById('historyList');
    const historyGrid = document.getElementById('historyGrid');
    const refreshHistoryBtn = document.getElementById('refreshHistory');

    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const bannerUpload = document.getElementById('bannerUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const previewName = document.getElementById('previewName');
    const removeImageBtn = document.getElementById('removeImage');
    const micBtn = document.getElementById('micBtn');
    const toast = document.getElementById('toast');

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2500);
    }

    function switchScreen(screen) {
        homeScreen.classList.add('hidden');
        historyScreen.classList.add('hidden');
        chatScreen.classList.add('hidden');

        homeNav.classList.remove('active');
        historyNav.classList.remove('active');

        if (screen === 'home') {
            homeScreen.classList.remove('hidden');
            homeNav.classList.add('active');
            breadcrumb.innerHTML = '<i class="fa-solid fa-house"></i> / Trang chủ';
            currentConversationId = null;
        } else if (screen === 'history') {
            historyScreen.classList.remove('hidden');
            historyNav.classList.add('active');
            breadcrumb.innerHTML = '<i class="fa-solid fa-house"></i> / Lịch sử trò chuyện';
            loadHistoryList();
        } else if (screen === 'chat') {
            chatScreen.classList.remove('hidden');
            breadcrumb.innerHTML = '<i class="fa-solid fa-house"></i> / Cuộc trò chuyện';
        }
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        }
    }

    openSidebarBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('open'); });
    closeSidebarBtn.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });

    homeNav.addEventListener('click', () => switchScreen('home'));
    historyNav.addEventListener('click', () => switchScreen('history'));
    newChatBtn.addEventListener('click', () => {
        currentConversationId = null;
        messageContainer.innerHTML = '';
        switchScreen('chat');
    });
    refreshHistoryBtn.addEventListener('click', loadHistoryList);

    // Auto resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Image Upload Handling
    uploadBtn.addEventListener('click', () => imageInput.click());
    bannerUpload.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 7 * 1024 * 1024) {
            showToast('Ảnh vượt quá dung lượng cho phép (7MB).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            selectedImageBase64 = event.target.result;
            previewImg.src = selectedImageBase64;
            previewName.textContent = file.name;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    });

    removeImageBtn.addEventListener('click', () => {
        selectedImageBase64 = null;
        imageInput.value = '';
        imagePreview.classList.add('hidden');
    });

    // Voice Input Speech Recognition
    micBtn.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Trình duyệt không hỗ trợ nhận diện giọng nói.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.start();
        showToast('Đang nghe giọng nói...');
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value += (userInput.value ? ' ' : '') + transcript;
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
        };
        recognition.onerror = () => showToast('Không nhận diện được giọng nói.');
    });

    // Feature card click prompts
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
                userInput.value = prompt;
                switchScreen('chat');
                sendMessage();
            }
        });
    });

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const text = userInput.value.trim();
        const img = selectedImageBase64;
        if (!text && !img) return;

        switchScreen('chat');
        userInput.value = '';
        userInput.style.height = 'auto';
        selectedImageBase64 = null;
        imageInput.value = '';
        imagePreview.classList.add('hidden');

        appendMessage('user', text, img);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: currentConversationId, message: text, image: img })
            });
            const data = await res.json();
            if (res.ok) {
                currentConversationId = data.conversation_id;
                appendMessage('assistant', data.reply);
                loadHistoryList();
            } else {
                showToast(data.error || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            showToast('Lỗi kết nối máy chủ.');
        }
    }

    function appendMessage(role, content, image = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message \${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (image) {
            const imgEl = document.createElement('img');
            imgEl.src = image;
            imgEl.className = 'message-image';
            contentDiv.appendChild(imgEl);
        }

        if (content) {
            const textDiv = document.createElement('div');
            textDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
            contentDiv.appendChild(textDiv);
        }

        if (role === 'assistant') {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'speak-btn';
            speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Đọc giọng nói';
            speakBtn.addEventListener('click', () => {
                const utterance = new SpeechSynthesisUtterance(content.replace(/[*#`\$\\]/g, ''));
                utterance.lang = 'vi-VN';
                window.speechSynthesis.speak(utterance);
            });
            contentDiv.appendChild(speakBtn);
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(contentDiv);
        messageContainer.appendChild(msgDiv);
        chatScreen.scrollTop = chatScreen.scrollHeight;

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([contentDiv]).catch((err) => console.log('MathJax error:', err));
        }
    }

    async function loadHistoryList() {
        try {
            const res = await fetch('/api/conversations');
            const list = await res.json();
            historyList.innerHTML = '';
            historyGrid.innerHTML = '';

            if (list.length === 0) {
                historyList.innerHTML = '<p class="muted-history">Chưa có cuộc trò chuyện nào.</p>';
                historyGrid.innerHTML = '<p class="muted-history">Chưa có lịch sử trò chuyện.</p>';
                return;
            }

            list.forEach(item => {
                // Sidebar item
                const sItem = document.createElement('button');
                sItem.className = 'nav-link';
                sItem.style.width = '100%';
                sItem.style.justifyContent = 'space-between';
                sItem.innerHTML = `<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;"><i class="fa-regular fa-message"></i> ${item.title}</span>`;
                sItem.addEventListener('click', () => loadConversation(item.id));
                historyList.appendChild(sItem);

                // History Grid item
                const card = document.createElement('div');
                card.className = 'history-card';
                card.innerHTML = `
                    <strong>${item.title}</strong>
                    <small><i class="fa-regular fa-clock"></i> ${new Date(item.updated_at).toLocaleString('vi-VN')}</small>
                    <button class="delete-conv" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                `;
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-conv')) {
                        loadConversation(item.id);
                    }
                });
                card.querySelector('.delete-conv').addEventListener('click', async () => {
                    await fetch(`/api/conversations/${item.id}`, { method: 'DELETE' });
                    loadHistoryList();
                    showToast('Đã xóa cuộc trò chuyện.');
                });
                historyGrid.appendChild(card);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function loadConversation(id) {
        try {
            const res = await fetch(`/api/conversations/${id}`);
            const data = await res.json();
            if (res.ok) {
                currentConversationId = data.id;
                messageContainer.innerHTML = '';
                data.messages.forEach(m => {
                    appendMessage(m.role, m.content, m.image);
                });
                switchScreen('chat');
            }
        } catch (err) {
            showToast('Không thể tải cuộc trò chuyện.');
        }
    }

    loadHistoryList();
});
