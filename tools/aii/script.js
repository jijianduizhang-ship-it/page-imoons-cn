// API配置


//let API_KEY = localStorage.getItem('api_key') || 'sk-c2f2ce816b3f43b09b6740f702ad3f36';
//let API_URL = localStorage.getItem('api_url') || 'https://api.deepseek.com/v1/chat/completions';
//let MODEL = localStorage.getItem('model') || 'deepseek-chat';
let API_KEY = localStorage.getItem('api_key') || 'sk-H9Sgx6IeVY3mbxkJu1oAj8NuYUFM0AAT2XZ5ACMoQ4bIWxkh';
let API_URL = localStorage.getItem('api_url') || 'https://chatapi.littlewheat.com/v1/chat/completions';
let MODEL = localStorage.getItem('model') || 'GPT-4';

// DOM元素
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const exportButton = document.getElementById('export-btn');
const clearButton = document.getElementById('clear-btn');

// 存储聊天记录
let messages = [];
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('chats')) || [];

// 在文件开头添加打字速度配置
const TYPING_SPEED = 30; // 打字速度（毫秒/字符）


//https://api.vvhan.com/api/horoscope?type=scorpio&time=today
// 添加一个测试API连接的函数
async function testAPIConnection(apiUrl, apiKey, model) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: 'Hello'
                }],
                temperature: 0.7,
                max_tokens: 10
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('API测试失败:', error);
        return false;
    }
}

// 发送消息
async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // 添加用户消息到界面
    addMessage('user', userMessage);
    userInput.value = '';

    // 添加加载状态
    sendButton.disabled = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.textContent = '正在思考...';
    chatHistory.appendChild(loadingDiv);

    try {
        // 构建包含历史消息的请求
        const contextMessages = messages.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // 添加当前用户消息
        contextMessages.push({
            role: 'user',
            content: userMessage
        });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: contextMessages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败 (${response.status}): 请检查API设置是否正确`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;
            addMessage('ai', aiResponse);
        } else {
            throw new Error('API返回格式错误');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('ai', `抱歉，发生了错误：${error.message}\n如果是API相关错误，请检查设置中的API配置。`);
    } finally {
        chatHistory.removeChild(loadingDiv);
        sendButton.disabled = false;
    }
}

// 添加消息到界面
function addMessage(role, content) {
    const time = new Date().toISOString();
    addMessageToUI(role, content, time);
    
    // 更新当前对话的消息
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat) {
        currentChat.messages.push({ role, content, time });
        // 更新对话标题（使用用户的第一条消息）
        if (role === 'user' && currentChat.messages.length === 1) {
            currentChat.title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
            loadChats();
        }
        saveChats();
    }
}

// 修改 addMessageToUI 函数
function addMessageToUI(role, content, time) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'message-icon';
    iconSpan.innerHTML = role === 'user' ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'message-label';
    labelSpan.textContent = role === 'user' ? '我' : 'AI助手';
    
    headerDiv.appendChild(iconSpan);
    headerDiv.appendChild(labelSpan);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date(time).toLocaleTimeString();
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    chatHistory.appendChild(messageDiv);

    // 如果是AI回复，使用打字机效果
    if (role === 'ai') {
        const formattedContent = formatContent(content);
        typeMessage(contentDiv, formattedContent);
    } else {
        // 用户消息直接显示
        contentDiv.innerHTML = formatContent(content);
    }
    
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 添加打字机效果函数
async function typeMessage(element, html) {
    element.className = 'message-content typing';
    
    // 创建临时div来解析HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // 递归处理HTML节点
    async function processNode(node) {
        for (let child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                await typeText(element, child.textContent);
            } else {
                const clone = child.cloneNode(false);
                element.appendChild(clone);
                await processNode(child);
            }
        }
    }
    
    await processNode(temp);
    element.classList.remove('typing');
}

// 逐字打印文本
async function typeText(element, text) {
    const words = text.split('');
    for (let char of words) {
        const span = document.createElement('span');
        span.textContent = char;
        element.appendChild(span);
        await new Promise(resolve => setTimeout(resolve, TYPING_SPEED));
    }
}

// 创建新对话
function createNewChat() {
    const newChat = {
        id: Date.now().toString(),
        title: `新对话 ${chats.length + 1}`,
        messages: []
    };
    chats.push(newChat);
    saveChats();
    loadChats();
    loadChat(newChat.id);
}

// 加载对话列表
function loadChats() {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>${chat.title}</span>
        `;
        chatItem.onclick = () => loadChat(chat.id);
        chatList.appendChild(chatItem);
    });
}

// 加载特定对话
function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    messages = chat.messages;
    chatHistory.innerHTML = '';
    messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content, msg.time);
    });
    loadChats(); // 更新侧边栏选中状态
}

// 保存对话到本地存储
function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// 其他辅助函数保持不变
function formatContent(content) {
    // 处理代码块
    content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 处理行内代码
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 处理换行
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 导出Word文档
function exportToWord() {
    const title = `智能问答记录 - ${new Date().toLocaleDateString()}`;
    let content = `<h1 style="text-align: center;">${title}</h1>\n\n`;
    
    messages.forEach(msg => {
        const time = new Date(msg.time).toLocaleString();
        const role = msg.role === 'user' ? '我' : 'AI助手';
        content += `<p style="margin: 20px 0;"><strong>${role}</strong> (${time})</p>\n`;
        content += `<div style="margin: 10px 0; padding: 10px; background-color: ${msg.role === 'user' ? '#f0f0f0' : '#ffffff'};">`;
        content += msg.content.replace(/\n/g, '<br>');
        content += '</div>\n\n';
    });

    const blob = new Blob([`
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    .code-block { background-color: #f5f5f5; padding: 10px; border-radius: 4px; }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `], { type: 'application/msword' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对话记录_${new Date().toLocaleDateString()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 事件监听
function initializeEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    exportButton.addEventListener('click', exportToWord);
    clearButton.addEventListener('click', () => {
        if (confirm('确定要清空当前对话吗？')) {
            chatHistory.innerHTML = '';
            const currentChat = chats.find(c => c.id === currentChatId);
            if (currentChat) {
                currentChat.messages = [];
                saveChats();
            }
        }
    });

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    document.getElementById('new-chat-btn').addEventListener('click', createNewChat);

    // 添加侧边栏切换功能
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // 切换侧边栏
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // 关闭侧边栏
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // 点击聊天区域时关闭侧边栏
    document.querySelector('.chat-container').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });

    // 处理移动端滑动手势
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        const threshold = 100; // 最小滑动距离

        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                // 向右滑动，打开侧边栏
                sidebar.classList.add('active');
                overlay.classList.add('active');
            } else {
                // 向左滑动，关闭侧边栏
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    }

    // 设置按钮点击事件
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveSettings = document.getElementById('save-settings');

    // 加载已保存的设置
    document.getElementById('api-url').value = API_URL;
    document.getElementById('api-key').value = API_KEY;
    document.getElementById('model').value = MODEL;

    // 打开设置
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    // 关闭设置
    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // 点击遮罩层关闭设置
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // 保存设置
    saveSettings.addEventListener('click', async () => {
        const newApiUrl = document.getElementById('api-url').value.trim();
        const newApiKey = document.getElementById('api-key').value.trim();
        const newModel = document.getElementById('model').value;

        if (!newApiUrl || !newApiKey) {
            alert('请填写完整的API信息');
            return;
        }

        // 显示加载状态
        const saveButton = document.getElementById('save-settings');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试连接中...';
        saveButton.disabled = true;

        try {
            // 测试新的API连接
            const isConnected = await testAPIConnection(newApiUrl, newApiKey, newModel);
            
            if (isConnected) {
                // 保存设置
                API_URL = newApiUrl;
                API_KEY = newApiKey;
                MODEL = newModel;

                // 保存到本地存储
                localStorage.setItem('api_url', API_URL);
                localStorage.setItem('api_key', API_KEY);
                localStorage.setItem('model', MODEL);

                // 关闭设置窗口
                settingsModal.style.display = 'none';
                alert('设置已保存并测试成功！');
            } else {
                alert('API连接测试失败，请检查配置是否正确。');
            }
        } catch (error) {
            alert('保存设置时发生错误：' + error.message);
        } finally {
            // 恢复按钮状态
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        }
    });
}

// 初始化应用
function initializeApp() {
    loadChats();
    if (chats.length === 0) {
        createNewChat();
    } else {
        loadChat(chats[0].id);
    }
    initializeEventListeners();
}

// 在页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initializeApp); 