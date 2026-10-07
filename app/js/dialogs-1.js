// dialogs-1.js - список диалогов с модальным окном

let dialogsList = [];
let deleteTimeoutId = null;
let pendingDeleteDialogId = null;
let pendingDeleteDialogTitle = null;

const GROQ_API_URL = '/backend/groq.php';

// Элементы DOM модального окна
const confirmModal = document.getElementById('confirmDeleteModal');
const confirmYesBtn = document.getElementById('confirmDeleteYesBtn');
const confirmNoBtn = document.getElementById('confirmDeleteNoBtn');
const deleteMessageSpan = document.getElementById('deleteMessage');

// ========== МОДАЛЬНОЕ ОКНО ==========
function showConfirmModal(message, onConfirm) {
  pendingDeleteDialogId = onConfirm;
  if (deleteMessageSpan) deleteMessageSpan.textContent = message;
  if (confirmModal) confirmModal.classList.remove('hidden');
}

function hideConfirmModal() {
  if (confirmModal) confirmModal.classList.add('hidden');
  pendingDeleteDialogId = null;
  pendingDeleteDialogTitle = null;
}

function confirmDelete() {
  if (pendingDeleteDialogId) {
    pendingDeleteDialogId();
  }
  hideConfirmModal();
}

function getCurrentUserId() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        return null;
    }
    try {
        var user = JSON.parse(userData);
        return user.id;
    } catch(e) {
        console.error('Error parsing user:', e);
        return null;
    }
}

async function loadDialogsFromDB() {
    var userId = getCurrentUserId();
    if (!userId) {
        console.log('No user found');
        renderEmptyList('Пожалуйста, войдите в систему');
        return;
    }
    
    console.log('Loading dialogs for user_id:', userId);
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'get_dialogs',
                user_id: userId 
            })
        });
        const data = await response.json();
        console.log('Dialogs response:', data);
        
        if (data.success) {
            dialogsList = data.dialogs;
            renderDialogsList();
        } else {
            console.error('Error:', data.error);
            renderEmptyList('Ошибка загрузки: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch(error) {
        console.error("Error loading dialogs:", error);
        renderEmptyList('Ошибка подключения к серверу');
    }
}

async function deleteDialogFromDB(dialogId) {
    var userId = getCurrentUserId();
    if (!userId) return false;
    
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'delete_dialog', 
                dialog_id: parseInt(dialogId),
                user_id: userId 
            })
        });
        const data = await response.json();
        console.log('Delete response:', data);
        return data.success;
    } catch(error) {
        console.error('Delete error:', error);
        return false;
    }
}

function renderDialogsList() {
    var container = document.getElementById("sessionsContainer");
    if (!container) return;

    if (!dialogsList || dialogsList.length === 0) {
        renderEmptyList('✨ Нет диалогов. Создайте первый диалог!');
        return;
    }

    var html = '';
    for (var i = 0; i < dialogsList.length; i++) {
        var d = dialogsList[i];
        var status = d.completed ? '✓ Завершён' : '⏳ В процессе';
        var complexityText = '';
        if (d.complexity === 'easy') complexityText = 'Начальный';
        else if (d.complexity === 'medium') complexityText = 'Средний';
        else complexityText = 'Продвинутый';
        
        html += `
            <div class="session-card" data-id="${d.id}">
                <div class="session-info" data-id="${d.id}">
                    <div class="session-title">Диалог от ${d.dialog_date}</div>
                    <div class="session-date">📅 ${d.dialog_date}</div>
                    <div class="session-stats">
                        <span>💬 ${d.message_count || 0} сообщений</span>
                        <span class="status-badge ${d.completed ? 'completed' : 'in-progress'}">${status}</span>
                        <span>📊 ${complexityText}</span>
                    </div>
                </div>
                <button class="delete-session-btn" data-id="${d.id}" data-delete="${d.id}">🗑️</button>
            </div>
        `;
    }
    container.innerHTML = html;

    // Обработка клика по диалогу (просмотр)
    var infoElements = document.querySelectorAll(".session-info");
    for (var i = 0; i < infoElements.length; i++) {
        infoElements[i].addEventListener("click", function(e) {
            e.stopPropagation();
            var id = this.getAttribute("data-id");
            showDialogHistory(id);
        });
    }

    // Обработка кнопок удаления
    var deleteButtons = document.querySelectorAll(".delete-session-btn");
    for (var i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", function(e) {
            e.stopPropagation();
            var id = this.getAttribute("data-id");
            var dialog = null;
            for (var j = 0; j < dialogsList.length; j++) {
                if (dialogsList[j].id == id) {
                    dialog = dialogsList[j];
                    break;
                }
            }
            var title = dialog ? dialog.dialog_date : 'этот диалог';
            showConfirmModal(`Удалить диалог от ${title}?`, function() {
                deleteDialogWithConfirm(id);
            });
        });
    }
}

function renderEmptyList(message) {
    var container = document.getElementById("sessionsContainer");
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">' + message + '</div>';
    }
}

async function showDialogHistory(dialogId) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'get_messages', 
                dialog_id: parseInt(dialogId) 
            })
        });
        const data = await response.json();
        console.log('Messages response:', data);
        
        if (data.success && data.messages && data.messages.length > 0) {
            var text = "📜 История диалога:\n\n";
            for (var i = 0; i < data.messages.length; i++) {
                var m = data.messages[i];
                var icon = m.sender_type === "user" ? "👤" : (m.sender_type === "assistant" ? "🤖" : "✏️");
                text += (i+1) + ". " + icon + " " + m.message_text + "\n";
            }
            alert(text);
        } else {
            alert("📭 Диалог пуст");
        }
    } catch(error) {
        console.error('Show history error:', error);
        alert("Ошибка загрузки истории");
    }
}

function deleteDialogWithConfirm(dialogId) {
    deleteDialogFromDB(dialogId).then(function(success) {
        if (success) {
            console.log('Dialog deleted, reloading list...');
            loadDialogsFromDB();
            showToastMessage('Диалог удалён', 'success');
        } else {
            showToastMessage('Ошибка при удалении', 'error');
        }
    });
}

function showToastMessage(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.right = '30px';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '1';
    }, 10);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function createNewSession() {
    window.location.href = "dialog2.html";
}

// События модального окна
if (confirmYesBtn) confirmYesBtn.addEventListener('click', confirmDelete);
if (confirmNoBtn) confirmNoBtn.addEventListener('click', hideConfirmModal);

if (confirmModal) {
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            hideConfirmModal();
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    console.log('DOM loaded, initializing dialogs page');
    loadDialogsFromDB();
    
    var createBtn = document.getElementById("createNewSessionBtn");
    if (createBtn) {
        createBtn.addEventListener("click", createNewSession);
    }
});