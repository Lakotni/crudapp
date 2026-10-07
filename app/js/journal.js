// journal.js - Журнал активности (диалоги и тесты из БД, прогресс из localStorage)

let currentUser = null;
let pendingDelete = null;

// Элементы DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');
const confirmModal = document.getElementById('confirmDeleteModal');
const confirmYesBtn = document.getElementById('confirmDeleteYesBtn');
const confirmNoBtn = document.getElementById('confirmDeleteNoBtn');
const deleteMessageSpan = document.getElementById('deleteMessage');

const API_URL = '/backend/journal.php';
const CARDSETS_URL = '/backend/cardsets.php';

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showLoading(show) {
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ========== ПРОГРЕСС ИЗ localStorage ==========
function getProgressKey(userId, setId) {
  return `card_progress_${userId}_${setId}`;
}

function loadAllProgressFromLocal() {
  if (!currentUser) return {};
  
  const allProgress = {};
  const prefix = `card_progress_${currentUser.id}_`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const setId = key.replace(prefix, '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const learnedCards = data.cardRatings ? 
          Object.keys(data.cardRatings).filter(cardId => data.cardRatings[cardId] === 'easy').length : 0;
        allProgress[setId] = {
          learnedCards: learnedCards,
          totalCards: 0,
          percent: 0
        };
      } catch(e) {
        console.error('Error parsing progress:', e);
      }
    }
  }
  return allProgress;
}

// ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ==========
function loadUser() {
  const userData = localStorage.getItem('user');
  if (!userData) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    return true;
  } catch(e) {
    console.error('Error loading user:', e);
    return false;
  }
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadJournalData() {
  if (!currentUser) return;
  
  showLoading(true);
  try {
    // 1. Загружаем диалоги и тесты из БД через journal.php
    const response = await fetch(`${API_URL}?action=get_journal&user_id=${currentUser.id}`);
    const data = await response.json();
    
    let dialogs = [];
    let tests = [];
    let visitStatus = 'rare';
    
    if (data.success && data.data) {
      dialogs = data.data.actions || [];
      tests = data.data.tests || [];
      visitStatus = data.data.visitStatus || 'rare';
    }
    
    // 2. Загружаем наборы пользователя из БД
    const setsResponse = await fetch(`${CARDSETS_URL}?action=my_sets&user_id=${currentUser.id}`);
    const setsData = await setsResponse.json();
    
    let setsProgress = [];
    
    if (setsData.success && setsData.user && setsData.user.sets) {
      const sets = setsData.user.sets;
      const allProgress = loadAllProgressFromLocal();
      
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        const totalCards = set.cards_count || 0;
        const learnedCards = allProgress[set.id]?.learnedCards || 0;
        const percent = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;
        
        setsProgress.push({
          id: set.id,
          title: set.title,
          totalCards: totalCards,
          learnedCards: learnedCards,
          percent: percent
        });
      }
    }
    
    renderJournal({
      visitStatus: visitStatus,
      actions: dialogs,
      tests: tests,
      setsProgress: setsProgress
    });
    
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    showToast('Ошибка соединения с сервером', 'error');
    renderEmptyState();
  } finally {
    showLoading(false);
  }
}

function renderEmptyState() {
  renderActionsEmpty();
  renderTestsEmpty();
  renderSetsProgressEmpty();
}

function renderActionsEmpty() {
  const container = document.getElementById('actionsList');
  if (container) container.innerHTML = '<div class="empty-message">📭 Нет записей о диалогах</div>';
}

function renderTestsEmpty() {
  const container = document.getElementById('testsList');
  if (container) container.innerHTML = '<div class="empty-message">📭 Нет записей о тестированиях</div>';
}

function renderSetsProgressEmpty() {
  const container = document.getElementById('setsProgressList');
  if (container) container.innerHTML = '<div class="empty-message">📭 Нет наборов карточек</div>';
}

// ========== ОТРИСОВКА ==========
function renderJournal(data) {
  renderVisitStatus(data.visitStatus);
  renderActions(data.actions);
  renderTests(data.tests);
  renderSetsProgress(data.setsProgress);
}

function renderVisitStatus(status) {
  const statusEl = document.getElementById('visitStatus');
  if (!statusEl) return;

  let statusText = '';
  let statusClass = '';
  if (status === 'frequent') { 
    statusText = '🔥 Частое посещение'; 
    statusClass = 'frequent'; 
  }
  else if (status === 'normal') { 
    statusText = '📘 Нормальное посещение'; 
    statusClass = 'normal'; 
  }
  else { 
    statusText = '⚠️ Редкое посещение'; 
    statusClass = 'rare'; 
  }

  statusEl.textContent = statusText;
  statusEl.className = `status-badge ${statusClass}`;
}

function renderActions(actions) {
  const container = document.getElementById('actionsList');
  if (!container) return;

  if (!actions || actions.length === 0) {
    renderActionsEmpty();
    return;
  }

  let html = '';
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const complexityText = action.complexity === 'easy' ? 'Начальный' : action.complexity === 'medium' ? 'Средний' : 'Продвинутый';
    html += `
      <div class="action-item">
        <div class="action-date">📅 ${action.dialog_date || action.date}</div>
        <div class="action-type">💬 Диалог (${complexityText})</div>
        <div class="action-stats">✉️ Сообщений: ${action.message_count || 0}</div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderTests(tests) {
  const container = document.getElementById('testsList');
  if (!container) return;

  if (!tests || tests.length === 0) {
    renderTestsEmpty();
    return;
  }

  let html = '';
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const percentage = test.percentage || Math.round((test.score / test.total_questions) * 100);
    
    html += `
      <div class="test-item">
        <div class="test-date">📅 ${test.test_date || test.date}</div>
        <div class="test-stats">
          <span>🎯 Результат: ${test.score}/${test.total_questions}</span>
          <span>📊 Процент: ${percentage}%</span>
        </div>
        <div class="test-level">📈 Уровень: ${test.level || 'Не определён'}</div>
        <div class="test-details">
          <span class="correct">✅ Правильно: ${test.score}</span>
          <span class="wrong">❌ Неправильно: ${test.total_questions - test.score}</span>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderSetsProgress(sets) {
  const container = document.getElementById('setsProgressList');
  if (!container) return;

  if (!sets || sets.length === 0) {
    renderSetsProgressEmpty();
    return;
  }

  let html = '';
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const shortTitle = truncateText(set.title, 30);
    
    html += `
      <div class="set-progress-item" data-set-id="${set.id}">
        <div class="set-title">📦 ${escapeHtml(shortTitle)}</div>
        <div class="progress-stats">
          <span>✅ Выучено: ${set.learnedCards || 0}</span>
          <span>📖 Осталось: ${(set.totalCards || 0) - (set.learnedCards || 0)}</span>
          <span>📊 Всего: ${set.totalCards || 0}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${set.percent || 0}%;"></div>
        </div>
        <div class="chart-container">
          <canvas class="mini-chart" width="60" height="60"></canvas>
          <span class="percent-text">${set.percent || 0}%</span>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;

  // Отрисовка круговых диаграмм
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const canvas = document.querySelector(`.set-progress-item[data-set-id="${set.id}"] canvas`);
    if (canvas) {
      drawMiniChart(canvas, set.percent || 0);
    }
  }
}

function drawMiniChart(canvas, percent) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 60;
  const height = canvas.height = 60;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 25;

  ctx.clearRect(0, 0, width, height);

  // Фоновый круг
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();

  // Заливка прогресса
  const angle = (percent / 100) * 2 * Math.PI;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, angle);
  ctx.fillStyle = '#4f46e5';
  ctx.fill();

  // Внутренний круг (белый)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 6, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Текст процента
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(percent + '%', centerX, centerY);
}

// ========== НАВИГАЦИЯ ==========
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      switch(view) {
        case 'cards': window.location.href = 'dashboard.html'; break;
        case 'dialogs': window.location.href = 'dialog1.html'; break;
        case 'testing': window.location.href = 'testing.html'; break;
        case 'journal': break;
        case 'settings': window.location.href = 'settings.html'; break;
        default: showToast('Раздел в разработке', 'info');
      }
    });
  }
}

function setupMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 720 && !sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}

// ========== ВЫХОД ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Глобальные функции
window.logout = logout;

// События модального окна
if (confirmYesBtn) confirmYesBtn.addEventListener('click', function() {
  if (pendingDelete) pendingDelete();
  if (confirmModal) confirmModal.classList.add('hidden');
});
if (confirmNoBtn) confirmNoBtn.addEventListener('click', function() {
  if (confirmModal) confirmModal.classList.add('hidden');
});

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', function() {
  if (!loadUser()) return;
  setupMobileMenu();
  setupNavigation();
  loadJournalData();
});