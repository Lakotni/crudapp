// dialog-setup.js - Настройка диалога (без выбора типа и наборов)

// ========== ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ==========
function getCurrentUserId() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        console.log('No user in localStorage');
        return null;
    }
    try {
        var user = JSON.parse(userData);
        console.log('Current user:', user);
        return user.id;
    } catch(e) {
        console.error('Error parsing user:', e);
        return null;
    }
}

// ========== СБОР НАСТРОЕК И ЗАПУСК ДИАЛОГА ==========
async function collectSettingsAndStart() {
    var userId = getCurrentUserId();
    console.log('Creating dialog for user_id:', userId);

    if (!userId) {
        alert('Пользователь не авторизован. Пожалуйста, войдите в систему.');
        window.location.href = 'login.html';
        return;
    }

    // 1. Количество сообщений
    var msgCountRadio = document.querySelector('input[name="msgCount"]:checked');
    var messageCount = msgCountRadio ? parseInt(msgCountRadio.value) : 10;

    // 2. Размер сообщений (сложность)
    var complexityRadio = document.querySelector('input[name="complexity"]:checked');
    var complexity = complexityRadio ? complexityRadio.value : "medium";

    // Сохраняем настройки
    var dialogConfig = {
        messageCount: messageCount,
        complexity: complexity
    };
    localStorage.setItem("englishup_dialog_config", JSON.stringify(dialogConfig));

    try {
        const response = await fetch('/backend/groq.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_dialog',
                user_id: userId,
                complexity: complexity,
                total_messages: messageCount
            })
        });
        const data = await response.json();
        console.log('Create dialog response:', data);

        if (data.success) {
            localStorage.setItem("englishup_current_dialog_id", data.dialog_id);
            window.location.href = "dialog3.html";
        } else {
            alert("Ошибка: " + data.error);
        }
    } catch(error) {
        console.error('Error:', error);
        alert("Ошибка подключения");
    }
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function initMobileMenu() {
    const btn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    if (btn && sidebar) {
        btn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!sidebar.contains(e.target) && !btn.contains(e.target) && sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
            }
        });
    }
}

// ========== ВЫХОД ==========
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", function() {
    initMobileMenu();

    var startBtn = document.getElementById("startDialogBtn");
    if (startBtn) {
        startBtn.addEventListener("click", collectSettingsAndStart);
    }
});