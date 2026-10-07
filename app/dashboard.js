// dashboard.js - личный кабинет с новым дизайном

const API_URL = '/backend/cardsets.php';
const AUTH_URL = '/backend/auth.php';
let currentUser = null;
let pendingDeleteSet = null;
let pendingDeleteSetTitle = null;

// Элементы DOM модального окна
const confirmModal = document.getElementById('confirmDeleteModal');
const confirmYesBtn = document.getElementById('confirmDeleteYesBtn');
const confirmNoBtn = document.getElementById('confirmDeleteNoBtn');
const deleteMessageSpan = document.getElementById('deleteMessage');

// ========== МОДАЛЬНОЕ ОКНО ==========
function showConfirmModal(message, onConfirm) {
  pendingDeleteSet = onConfirm;
  if (deleteMessageSpan) deleteMessageSpan.textContent = message;
  if (confirmModal) confirmModal.classList.remove('hidden');
}

function hideConfirmModal() {
  if (confirmModal) confirmModal.classList.add('hidden');
  pendingDeleteSet = null;
  pendingDeleteSetTitle = null;
}

function confirmDelete() {
  if (pendingDeleteSet) {
    pendingDeleteSet();
  }
  hideConfirmModal();
}

// ========== ОБРЕЗКА ДЛИННОГО ТЕКСТА ==========
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.onload = async function() {
  const userData = localStorage.getItem('user');
  if (!userData) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    currentUser = JSON.parse(userData);
 
    await loadMySets();
    setupMobileMenu();
    setupNavigation();
    
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
    
  } catch (e) {
    console.error('Ошибка инициализации:', e);
    showToast('Ошибка загрузки данных', 'error');
  }
};

// ========== ЗАГРУЗКА НАБОРОВ ==========
async function loadMySets() {
  showLoading(true);
  const container = document.getElementById('setsList');
  
  if (!container) {
    console.error('Element setsList not found');
    showLoading(false);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}?action=my_sets&user_id=${currentUser.id}`);
    const data = await response.json();
    
    if (data.success && data.user && data.user.sets) {
      const sets = data.user.sets;
      if (sets.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            📭 У вас пока нет наборов<br>
            <a href="builder.html" style="color: #4f46e5;">Создайте первый набор</a>
          </div>
        `;
      } else {
        renderSets(sets);
      }
    } else {
      container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки наборов</div>';
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    container.innerHTML = '<div class="empty-state">❌ Ошибка соединения с сервером</div>';
  } finally {
    showLoading(false);
  }
}

function renderSets(sets) {
  const container = document.getElementById('setsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    // Обрезаем длинное название (максимум 30 символов)
    const shortTitle = truncateText(set.title, 30);
    
    const setCard = document.createElement('div');
    setCard.className = 'set-card';
    setCard.innerHTML = `
      <div class="set-info">
        <h3>📦 ${escapeHtml(shortTitle)}</h3>
        <div class="card-count">${set.cards_count || 0} карточек</div>
        <div class="card-count" style="font-size: 0.7rem; margin-top: 4px;">
          ${set.is_public == 1 ? '🌍 Публичный' : '🔒 Личный'}
        </div>
      </div>
      <div class="set-actions">
        <button class="play-btn" onclick="playGame(${set.id})" title="Играть">🎮</button>
        <button class="edit-btn" onclick="editSet(${set.id})" title="Редактировать">✏️</button>
        <button class="delete-btn" onclick="confirmDeleteSet(${set.id}, '${escapeHtml(shortTitle)}')" title="Удалить">🗑️</button>
      </div>
    `;
    container.appendChild(setCard);
  }
}

// ========== ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ==========
function confirmDeleteSet(setId, title) {
  showConfirmModal(`Удалить набор "${title}"? Все карточки будут удалены безвозвратно.`, function() {
    deleteSet(setId, title);
  });
}

// ========== ДЕЙСТВИЯ С НАБОРАМИ ==========
function editSet(setId) {
  window.location.href = `builder.html?set_id=${setId}`;
}

async function deleteSet(setId, title) {
  showLoading(true);
  
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'delete_set');
    formData.append('set_id', setId);
    formData.append('user_id', currentUser.id);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    const data = await response.json();
    
    if (data.success) {
      showToast('Набор удалён', 'success');
      await loadMySets();
    } else {
      showToast(data.message || 'Ошибка удаления', 'error');
    }
  } catch (error) {
    console.error('Ошибка:', error);
    showToast('Ошибка соединения', 'error');
  } finally {
    showLoading(false);
  }
}

// ========== ВЫХОД ==========
async function logout() {
  try {
    await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=logout'
    });
  } catch(e) {}
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function playGame(setId) {
  window.location.href = `game.html?set_id=${setId}`;
}

function setupMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 720) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      
      if (view === 'cards') {
        // Уже на странице наборов
      } else if (view === 'dialogs') {
        window.location.href = `dialog1.html`;
      } else if (view === 'testing') {
        window.location.href = 'testing.html';
      } else if (view === 'journal') {
        window.location.href = 'journal.html';
      } else if (view === 'settings') {
        window.location.href = 'settings.html';
      }
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Глобальные функции для onclick
window.playGame = playGame;
window.editSet = editSet;
window.confirmDeleteSet = confirmDeleteSet;
window.logout = logout;