// settings.js - страница настроек

// ========== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ==========
function loadUserData() {
  const userData = localStorage.getItem('user');
  if (!userData) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userData);
    document.getElementById('userLogin').textContent = user.login || '—';
    document.getElementById('userId').textContent = user.id || '—';
    document.getElementById('userEmail').textContent = user.email || '—';
  } catch (e) {
    console.error('Ошибка загрузки данных пользователя:', e);
    showToast('Ошибка загрузки профиля', 'error');
  }
}

// ========== НАСТРОЙКА ПЕРЕКЛЮЧАТЕЛЯ ТЕМЫ ==========
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Устанавливаем состояние переключателя в соответствии с текущей темой
  const isDarkTheme = document.body.classList.contains('dark-theme');
  themeToggle.checked = isDarkTheme;

  // Обработчик изменения переключателя
  themeToggle.addEventListener('change', function() {
    // Используем глобальную функцию toggleTheme из theme.js
    if (typeof window.toggleTheme === 'function') {
      window.toggleTheme();
    } else {
      // fallback, если theme.js не загрузился
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      }
    }

    // Синхронизируем состояние переключателя
    setTimeout(() => {
      themeToggle.checked = document.body.classList.contains('dark-theme');
    }, 10);
  });
}

// ========== НАПИСАТЬ РАЗРАБОТЧИКАМ ==========
function contactDevelopers() {
  const email = 'support@englishup.com';
  const subject = 'Вопрос о работе приложения EnglishUP';
  const body = 'Здравствуйте! У меня есть вопрос...\n\n(Опишите вашу проблему или предложение)';

  // Пробуем открыть почтовый клиент
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Также копируем email в буфер обмена
  navigator.clipboard.writeText(email).then(() => {
    showToast('📧 Email скопирован: ' + email, 'success');
  }).catch(() => {
    showToast('📧 ' + email, 'success');
  });
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function setupMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');

  if (btn && sidebar) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 720) {
        if (sidebar && btn && !sidebar.contains(e.target) && !btn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
}

// ========== НАВИГАЦИЯ ==========
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const view = this.getAttribute('data-view');

      const routes = {
        'cards': 'dashboard.html',
        'dialogs': 'dialog1.html',
        'testing': 'testing.html',
        'journal': 'journal.html',
        'settings': 'settings.html'
      };

      if (routes[view]) {
        window.location.href = routes[view];
      }
    });
  });
}

// ========== ВЫХОД ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// ========== TOAST УВЕДОМЛЕНИЯ ==========
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    // Создаём toast, если его нет
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
  // Загружаем данные пользователя
  loadUserData();

  // Настраиваем переключатель темы
  setupThemeToggle();

  // Настраиваем мобильное меню
  setupMobileMenu();

  // Настраиваем навигацию
  setupNavigation();

  // Обработчик кнопки "Написать разработчикам"
  const contactBtn = document.getElementById('contactDevsBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', contactDevelopers);
  }
});