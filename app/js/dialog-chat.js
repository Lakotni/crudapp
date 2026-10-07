// ========== НАСТРОЙКИ ДИАЛОГА ==========
let dialogConfig = null;
let currentDialogId = null;
let messagesSent = 0;
let totalAssistantMessages = 0;
let dialogActive = true;
let errorsList = [];
let positivePoints = [];
let currentMessageNumber = 0;
let allMessages = [];

const GROQ_API_URL = '/backend/groq.php';

// Элементы DOM
const messagesArea = document.getElementById("messagesArea");
const userInput = document.getElementById("userMessageInput");
const sendBtn = document.getElementById("sendMessageBtn");
const exitBtn = document.getElementById("exitDialogBtn");
const messagesDoneSpan = document.getElementById("messagesDone");
const messagesTotalSpan = document.getElementById("messagesTotal");
const confirmModal = document.getElementById("confirmModal");
const reportModal = document.getElementById("reportModal");
const reportContent = document.getElementById("reportContent");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");
const closeReportBtn = document.getElementById("closeReportBtn");

// ========== ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ==========
function getCurrentUser() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        return null;
    }
    return JSON.parse(userData);
}


// ========== СОХРАНЕНИЕ СООБЩЕНИЯ ==========
function getCurrentUserId() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        return null;
    }
    try {
        var user = JSON.parse(userData);
        return user.id;
    } catch(e) {
        return null;
    }
}
async function saveMessageToDB(messageNumber, senderType, messageText) {
    if (!currentDialogId) return false;
    
    allMessages.push({ 
        sender_type: senderType, 
        message_text: messageText 
    });
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_message',
                dialog_id: currentDialogId,
                message_number: messageNumber,
                sender_type: senderType,
                message_text: messageText
            })
        });
        const data = await response.json();
        return data.success;
    } catch(error) {
        console.error("Error saving message:", error);
        return false;
    }
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadDialogData() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const storedConfig = localStorage.getItem("englishup_dialog_config");
    if (storedConfig) {
        dialogConfig = JSON.parse(storedConfig);
        totalAssistantMessages = dialogConfig.messageCount;
        messagesTotalSpan.textContent = totalAssistantMessages;
    } else {
        dialogConfig = {
            messageCount: 10,
            complexity: "medium",
            dialogType: "free"
        };
        totalAssistantMessages = 10;
        messagesTotalSpan.textContent = "10";
    }

    currentDialogId = localStorage.getItem("englishup_current_dialog_id");
    
    if (!currentDialogId) {
        await createNewDialog();
    } else {
        await loadMessagesFromDB();
    }
}

async function createNewDialog() {
    var userId = getCurrentUserId();
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Creating dialog for user_id:', userId);
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_dialog',
                user_id: userId,
                complexity: dialogConfig.complexity,
                total_messages: totalAssistantMessages
            })
        });
        const data = await response.json();
        
        if (data.success) {
            currentDialogId = data.dialog_id;
            localStorage.setItem("englishup_current_dialog_id", currentDialogId);
            setTimeout(() => {
                sendAssistantMessages();
            }, 500);
        } else {
            console.error("Failed to create dialog:", data.error);
            showErrorMessage('Ошибка создания диалога: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch(error) {
        console.error("Error creating dialog:", error);
        showErrorMessage('Ошибка подключения к серверу');
    }
}

async function loadMessagesFromDB() {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'get_messages', 
                dialog_id: currentDialogId 
            })
        });
        const data = await response.json();
        
        if (data.success && data.messages && data.messages.length > 0) {
            messagesArea.innerHTML = "";
            let assistantCount = 0;
            let maxMessageNumber = 0;
            
            for (const msg of data.messages) {
                addMessageToUI(msg.message_text, msg.sender_type);
                allMessages.push(msg);
                if (msg.sender_type === "assistant") {
                    assistantCount++;
                } else if (msg.sender_type === "user") {
                    messagesSent++;
                }
                if (msg.message_number > maxMessageNumber) {
                    maxMessageNumber = msg.message_number;
                }
            }
            
            currentMessageNumber = maxMessageNumber;
            messagesDoneSpan.textContent = assistantCount;
            
            if (assistantCount >= totalAssistantMessages) {
                finishDialog();
            }
        }
    } catch(error) {
        console.error("Error loading messages:", error);
    }
}

// ========== ОТПРАВКА СООБЩЕНИЙ ==========
async function sendUserMessage() {
    if (!dialogActive) return;
    const text = userInput.value.trim();
    if (!text) return;

    addMessageToUI(text, "user");
    currentMessageNumber++;
    await saveMessageToDB(currentMessageNumber, "user", text);
    userInput.value = "";
    messagesSent++;

    showLoading(true);
    
    try {
        const analysisRes = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'analyze_message',
                text: text,
                complexity: dialogConfig.complexity
            })
        });
        const analysisData = await analysisRes.json();
        
        if (analysisData.success && analysisData.analysis) {
            const analysis = analysisData.analysis;
            
            if (analysis.hasError) {
                if (analysis.errorDescription) {
                    addMessageToUI("📌 " + analysis.errorDescription, "correction");
                    currentMessageNumber++;
                    await saveMessageToDB(currentMessageNumber, "correction", "📌 " + analysis.errorDescription);
                }
                const correctionText = "✏️ Исправление: " + analysis.correction;
                addMessageToUI(correctionText, "correction");
                currentMessageNumber++;
                await saveMessageToDB(currentMessageNumber, "correction", correctionText);
                errorsList.push({ 
                    original: text, 
                    correction: analysis.correction, 
                    description: analysis.errorDescription 
                });
            } else if (analysis.praise) {
                positivePoints.push(analysis.praise);
                addMessageToUI("👍 " + analysis.praise, "correction");
                currentMessageNumber++;
                await saveMessageToDB(currentMessageNumber, "correction", "👍 " + analysis.praise);
            }
        }
    } catch(e) {
        console.error("Analysis error:", e);
    }
    
    showLoading(false);
    
    if (getAssistantMessagesCount() >= totalAssistantMessages) {
        finishDialog();
        return;
    }
    await sendAssistantMessages();
}

async function sendAssistantMessages() {
    if (!dialogActive) return;
    if (getAssistantMessagesCount() >= totalAssistantMessages) {
        finishDialog();
        return;
    }
    
    showLoading(true);
    
    const history = [];
    const messageElements = messagesArea.querySelectorAll(".message");
    
    for (const el of messageElements) {
        if (el.classList.contains("user-message")) {
            history.push({ role: "user", text: el.innerText });
        } else if (el.classList.contains("assistant-message")) {
            history.push({ role: "assistant", text: el.innerText });
        }
    }
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_response',
                messages: history,
                complexity: dialogConfig.complexity
            })
        });
        const data = await response.json();
        
        if (data.success && data.message) {
            addMessageToUI(data.message, "assistant");
            currentMessageNumber++;
            await saveMessageToDB(currentMessageNumber, "assistant", data.message);
            messagesDoneSpan.textContent = getAssistantMessagesCount();
        } else {
            throw new Error("No response");
        }
    } catch(e) {
        console.error("Error:", e);
        const fallbackMsg = "Can you tell me more about that?";
        addMessageToUI(fallbackMsg, "assistant");
        currentMessageNumber++;
        await saveMessageToDB(currentMessageNumber, "assistant", fallbackMsg);
        messagesDoneSpan.textContent = getAssistantMessagesCount();
    }
    
    showLoading(false);
    
    if (getAssistantMessagesCount() >= totalAssistantMessages) {
        finishDialog();
    }
}

// ========== ЗАВЕРШЕНИЕ ДИАЛОГА ==========
async function finishDialog() {
    if (!dialogActive) return;
    dialogActive = false;
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    if (currentDialogId) {
        try {
            await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'complete_dialog', 
                    dialog_id: currentDialogId 
                })
            });
        } catch(e) {}
    }
    
    await generateAdvancedReport();
}

async function generateAdvancedReport() {
    showLoading(true);
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'generate_report', 
                messages: allMessages 
            })
        });
        const data = await response.json();
        
        if (data.success && data.report) {
            let reportHtml = `
                <div class="report-section">
                    <h4>📊 Статистика</h4>
                    <ul>
                        <li>Сообщений от ассистента: ${getAssistantMessagesCount()} / ${totalAssistantMessages}</li>
                        <li>Ваших ответов: ${messagesSent}</li>
                        <li>Уровень сложности: ${dialogConfig.complexity === "easy" ? "Начальный" : dialogConfig.complexity === "medium" ? "Средний" : "Продвинутый"}</li>
                    </ul>
                </div>
                <div class="report-section">
                    <h4>🤖 Анализ от ИИ</h4>
                    <div style="white-space: pre-wrap;">${escapeHtml(data.report)}</div>
                </div>
            `;
            
            if (errorsList.length > 0) {
                let errorsHtml = '<div class="report-section"><h4>⚠️ Ошибки</h4><ul>';
                for (var i = 0; i < errorsList.length; i++) {
                    errorsHtml += '<li><strong>Было:</strong> "' + escapeHtml(errorsList[i].original) + '"<br><strong>Правильно:</strong> "' + escapeHtml(errorsList[i].correction) + '"</li>';
                }
                errorsHtml += '</ul></div>';
                reportHtml += errorsHtml;
            }
            reportContent.innerHTML = reportHtml;
        } else {
            generateSimpleReport();
        }
    } catch(e) {
        generateSimpleReport();
    }
    
    showLoading(false);
    reportModal.classList.remove("hidden");
}

function generateSimpleReport() {
    let reportHtml = `
        <div class="report-section">
            <h4>📊 Статистика</h4>
            <ul>
                <li>Сообщений от ассистента: ${getAssistantMessagesCount()} / ${totalAssistantMessages}</li>
                <li>Ваших ответов: ${messagesSent}</li>
            </ul>
        </div>
    `;
    
    if (errorsList.length > 0) {
        let errorsHtml = '<div class="report-section"><h4>⚠️ Ошибки</h4><ul>';
        for (var i = 0; i < errorsList.length; i++) {
            errorsHtml += '<li><strong>Было:</strong> "' + escapeHtml(errorsList[i].original) + '"<br><strong>Правильно:</strong> "' + escapeHtml(errorsList[i].correction) + '"</li>';
        }
        errorsHtml += '</ul></div>';
        reportHtml += errorsHtml;
    } else {
        reportHtml += '<div class="report-section"><h4>✅ Отлично!</h4><p>Вы не допустили ошибок!</p></div>';
    }
    reportContent.innerHTML = reportHtml;
}

function getAssistantMessagesCount() {
    return document.querySelectorAll(".assistant-message").length;
}

function addMessageToUI(text, type) {
    var messageDiv = document.createElement("div");
    var className = "message ";
    if (type === "assistant") {
        className += "assistant-message";
    } else if (type === "user") {
        className += "user-message";
    } else {
        className += "correction-message";
    }
    
    messageDiv.className = className;
    messageDiv.innerText = text;
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    var welcome = messagesArea.querySelector(".welcome-message");
    if (welcome) welcome.remove();
}

function showLoading(show) {
    if (sendBtn) {
        sendBtn.disabled = show;
        sendBtn.textContent = show ? "⏳" : "➤";
    }
    if (userInput) userInput.disabled = show;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showConfirmModal() { 
    confirmModal.classList.remove("hidden"); 
}

function hideConfirmModal() { 
    confirmModal.classList.add("hidden"); 
}

function closeReportModal() {
    reportModal.classList.add("hidden");
    localStorage.removeItem("englishup_current_dialog_id");
    localStorage.removeItem("englishup_dialog_config");
    window.location.href = "dialog1.html";
}

function showErrorMessage(message) {
    var welcomeDiv = messagesArea.querySelector('.welcome-message');
    if (welcomeDiv) {
        welcomeDiv.innerHTML = '<div class="welcome-icon">⚠️</div><h3>Ошибка</h3><p style="color: red;">' + message + '</p><button onclick="location.reload()">Повторить</button>';
    }
}

// События
if (sendBtn) sendBtn.addEventListener("click", sendUserMessage);
if (userInput) {
    userInput.addEventListener("keypress", function(e) { 
        if (e.key === "Enter" && dialogActive) sendUserMessage(); 
    });
}
if (exitBtn) exitBtn.addEventListener("click", showConfirmModal);
if (confirmYesBtn) confirmYesBtn.addEventListener("click", function() { 
    hideConfirmModal(); 
    finishDialog(); 
});
if (confirmNoBtn) confirmNoBtn.addEventListener("click", hideConfirmModal);
if (closeReportBtn) closeReportBtn.addEventListener("click", closeReportModal);

// Запуск
document.addEventListener("DOMContentLoaded", function() { 
    loadDialogData(); 
});

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
