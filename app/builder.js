// builder.js - Конструктор наборов карточек

console.log('builder.js загружен');

// ========== КОНСТАНТЫ ==========
const API_URL = '/backend/cardsets.php';
const AUTH_URL = '/backend/auth.php';
let currentUser = null;
let currentSet = {
    id: null,
    name: '',
    description: '',
    cards: []
};
let currentImageFile = null;

let editingCardId = null;
let editingCardNewImage = null;
let editingCardOldImage = null;

// ========== ОГРАНИЧЕНИЯ ПОЛЕЙ ==========
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 70;
const MAX_TERM_LENGTH = 80;      // ← ИЗМЕНЕНО на 80
const MAX_DEFINITION_LENGTH = 80; // ← ИЗМЕНЕНО на 80

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function sanitizeInput(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
}

function validateLength(str, min, max, fieldName) {
    if (str.length < min) {
        showToast(fieldName + ' должен быть не короче ' + min + ' символов', 'error');
        return false;
    }
    if (str.length > max) {
        showToast(fieldName + ' не может быть длиннее ' + max + ' символов', 'error');
        return false;
    }
    return true;
}

function validateNoHtml(str, fieldName) {
    if (/[<>]/.test(str)) {
        showToast(fieldName + ' не должен содержать HTML-теги (<, >)', 'error');
        return false;
    }
    return true;
}

function updateCounter(input, counterId, maxLength) {
    var counter = document.getElementById(counterId);
    if (!counter) return;
    var len = input.value.length;
    counter.textContent = len + ' / ' + maxLength;
    
    if (len >= maxLength) {
        counter.className = 'char-counter danger';
    } else if (len > maxLength * 0.8) {
        counter.className = 'char-counter warning';
    } else {
        counter.className = 'char-counter';
    }
}

function initCharCounters() {
    var setNameInput = document.getElementById('setName');
    var setDescInput = document.getElementById('setDescription');
    var newTermInput = document.getElementById('newTerm');
    var newDefinitionInput = document.getElementById('newDefinition');
    
    if (setNameInput) {
        setNameInput.addEventListener('input', function() {
            updateCounter(setNameInput, 'titleCounter', MAX_TITLE_LENGTH);
            if (this.value.length > MAX_TITLE_LENGTH) {
                this.value = this.value.substring(0, MAX_TITLE_LENGTH);
                updateCounter(setNameInput, 'titleCounter', MAX_TITLE_LENGTH);
            }
        });
        updateCounter(setNameInput, 'titleCounter', MAX_TITLE_LENGTH);
    }
    
    if (setDescInput) {
        setDescInput.addEventListener('input', function() {
            updateCounter(setDescInput, 'descCounter', MAX_DESCRIPTION_LENGTH);
            if (this.value.length > MAX_DESCRIPTION_LENGTH) {
                this.value = this.value.substring(0, MAX_DESCRIPTION_LENGTH);
                updateCounter(setDescInput, 'descCounter', MAX_DESCRIPTION_LENGTH);
            }
        });
        updateCounter(setDescInput, 'descCounter', MAX_DESCRIPTION_LENGTH);
    }
    
    if (newTermInput) {
        newTermInput.addEventListener('input', function() {
            updateCounter(newTermInput, 'termCounter', MAX_TERM_LENGTH);
            if (this.value.length > MAX_TERM_LENGTH) {
                this.value = this.value.substring(0, MAX_TERM_LENGTH);
                updateCounter(newTermInput, 'termCounter', MAX_TERM_LENGTH);
            }
        });
        updateCounter(newTermInput, 'termCounter', MAX_TERM_LENGTH);
    }
    
    if (newDefinitionInput) {
        newDefinitionInput.addEventListener('input', function() {
            updateCounter(newDefinitionInput, 'defCounter', MAX_DEFINITION_LENGTH);
            if (this.value.length > MAX_DEFINITION_LENGTH) {
                this.value = this.value.substring(0, MAX_DEFINITION_LENGTH);
                updateCounter(newDefinitionInput, 'defCounter', MAX_DEFINITION_LENGTH);
            }
        });
        updateCounter(newDefinitionInput, 'defCounter', MAX_DEFINITION_LENGTH);
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.onload = async function() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        document.getElementById('userName').innerText = currentUser.login || 'Пользователь';
        
        var urlParams = new URLSearchParams(window.location.search);
        var setId = urlParams.get('set_id');
        
        if (setId) {
            await loadSet(setId);
        } else {
            createNewSet();
        }
        
        setupImagePreview();
        initCharCounters();
        
    } catch (e) {
        console.error('Ошибка инициализации:', e);
        showToast('Ошибка загрузки данных', 'error');
    }
};

// ========== НАСТРОЙКА ПРЕВЬЮ КАРТИНКИ ==========
function setupImagePreview() {
    var fileInput = document.getElementById('newCardImage');
    var previewDiv = document.getElementById('imagePreview');
    var previewImg = document.getElementById('previewImg');
    
    if (fileInput && previewDiv && previewImg) {
        fileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                currentImageFile = file;
                var reader = new FileReader();
                reader.onload = function(event) {
                    previewImg.src = event.target.result;
                    previewDiv.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            } else {
                clearImagePreview();
            }
        });
    }
}

function clearImagePreview() {
    var fileInput = document.getElementById('newCardImage');
    var previewDiv = document.getElementById('imagePreview');
    var previewImg = document.getElementById('previewImg');
    
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewDiv) previewDiv.style.display = 'none';
    currentImageFile = null;
}

function getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
        return imagePath;
    }
    return '/uploads/' + imagePath;
}

function showFullImage(imageUrl) {
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImage');
    
    if (modal && modalImg && imageUrl) {
        var fullUrl = getImageUrl(imageUrl);
        modalImg.src = fullUrl;
        modal.style.display = 'flex';
        
        var overlay = modal.querySelector('.image-modal-overlay');
        if (overlay) {
            overlay.onclick = function() {
                modal.style.display = 'none';
            };
        }
    }
}

function closeImageModal() {
    var modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========== ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ КАРТИНКИ ==========
function showImageUploadModal(cardId, currentImageUrl) {
    editingCardId = cardId;
    editingCardOldImage = currentImageUrl;
    editingCardNewImage = null;
    
    var modal = document.getElementById('imageUploadModal');
    var preview = document.getElementById('editImagePreview');
    var fileInput = document.getElementById('editCardImage');
    
    if (modal && preview) {
        if (currentImageUrl && currentImageUrl !== 'null') {
            preview.src = currentImageUrl;
        } else {
            preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" fill="%23f0f0f0"/%3E%3Cpath d="M3 16l5-5 3 3 5-5 5 5" stroke="%23999"/%3E%3C/svg%3E';
        }
        
        modal.style.display = 'flex';
        
        if (fileInput) {
            fileInput.onchange = function(e) {
                var file = e.target.files[0];
                if (file) {
                    editingCardNewImage = file;
                    var reader = new FileReader();
                    reader.onload = function(event) {
                        preview.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
        
        var overlay = modal.querySelector('.image-upload-modal-overlay');
        if (overlay) {
            overlay.onclick = closeImageUploadModal;
        }
    }
}

function closeImageUploadModal() {
    var modal = document.getElementById('imageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingCardId = null;
    editingCardNewImage = null;
    editingCardOldImage = null;
    var fileInput = document.getElementById('editCardImage');
    if (fileInput) fileInput.value = '';
}

async function saveCardImage() {
    if (!editingCardId) {
        showToast('Ошибка: карточка не выбрана', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        var formData = new FormData();
        formData.append('action', 'edit_card_image');
        formData.append('card_id', editingCardId);
        formData.append('user_id', currentUser.id);
        formData.append('set_id', currentSet.id);
        
        if (editingCardNewImage) {
            formData.append('card_image', editingCardNewImage);
        }
        
        var response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        var data = await response.json();
        
        if (data.success) {
            var card = currentSet.cards.find(function(c) { return c.id === editingCardId; });
            if (card) {
                if (editingCardNewImage) {
                    card.card_image = data.card_image || getImageUrl(data.card_image);
                }
            }
            renderMyCards();
            showToast('Картинка обновлена', 'success');
            closeImageUploadModal();
        } else {
            showToast(data.message || 'Ошибка обновления картинки', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка соединения', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteCurrentImage() {
    if (!confirm('Удалить картинку? Она будет удалена безвозвратно.')) return;
    
    editingCardNewImage = null;
    
    showLoading(true);
    
    try {
        var formData = new URLSearchParams();
        formData.append('action', 'delete_card_image');
        formData.append('card_id', editingCardId);
        formData.append('user_id', currentUser.id);
        formData.append('set_id', currentSet.id);
        
        var response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        var data = await response.json();
        
        if (data.success) {
            var card = currentSet.cards.find(function(c) { return c.id === editingCardId; });
            if (card) {
                card.card_image = null;
            }
            renderMyCards();
            showToast('Картинка удалена', 'success');
            closeImageUploadModal();
        } else {
            showToast(data.message || 'Ошибка удаления картинки', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка соединения', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== ЗАГРУЗКА НАБОРА ==========
async function loadSet(setId) {
    showLoading(true);
    try {
        var response = await fetch(API_URL + '?action=get_set&set_id=' + setId);
        var data = await response.json();
        
        if (data.success && data.user && data.user.set) {
            var set = data.user.set;
            var cardsWithImages = [];
            for (var i = 0; i < (set.cards || []).length; i++) {
                var card = set.cards[i];
                cardsWithImages.push({
                    id: card.id,
                    front_content: card.front_content,
                    back_content: card.back_content,
                    card_image: card.card_image ? getImageUrl(card.card_image) : null
                });
            }
            
            currentSet = {
                id: set.id,
                name: set.title,
                description: set.description || '',
                cards: cardsWithImages
            };
            
            document.getElementById('setName').value = currentSet.name;
            document.getElementById('setDescription').value = currentSet.description;
            renderMyCards();
        } else {
            showToast('Набор не найден, создаём новый', 'error');
            createNewSet();
        }
    } catch (error) {
        console.error('Ошибка загрузки набора:', error);
        showToast('Ошибка загрузки набора', 'error');
        createNewSet();
    } finally {
        showLoading(false);
    }
}

function createNewSet() {
    currentSet = {
        id: null,
        name: '',
        description: '',
        cards: []
    };
    
    document.getElementById('setName').value = '';
    document.getElementById('setDescription').value = '';
    renderMyCards();
    window.history.pushState({}, '', window.location.pathname);
}

async function saveSet() {
    var name = document.getElementById('setName').value.trim();
    var description = document.getElementById('setDescription').value.trim();
    
    name = sanitizeInput(name);
    description = sanitizeInput(description);
    
    if (!name) {
        showToast('Введите название набора', 'error');
        return;
    }
    
    if (!validateLength(name, 1, MAX_TITLE_LENGTH, 'Название набора')) {
        return;
    }
    
    if (!validateNoHtml(name, 'Название набора')) {
        return;
    }
    
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        showToast('Описание не может быть длиннее ' + MAX_DESCRIPTION_LENGTH + ' символов', 'error');
        return;
    }
    
    if (description && !validateNoHtml(description, 'Описание')) {
        return;
    }
    
    showLoading(true);
    
    try {
        var formData = new URLSearchParams();
        
        if (currentSet.id) {
            formData.append('action', 'edit_set');
            formData.append('set_id', currentSet.id);
        } else {
            formData.append('action', 'create_set');
        }
        
        formData.append('user_id', currentUser.id);
        formData.append('title', name);
        formData.append('description', description);
        formData.append('is_public', 0);
        
        var response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        var data = await response.json();
        
        if (data.success) {
            if (data.user && data.user.set_id) {
                currentSet.id = data.user.set_id;
            }
            currentSet.name = name;
            currentSet.description = description;
            
            showToast('Набор сохранён', 'success');
            window.history.pushState({}, '', '?set_id=' + currentSet.id);
        } else {
            showToast(data.message || 'Ошибка сохранения', 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showToast('Ошибка соединения', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== ОТРИСОВКА КАРТОЧЕК ==========
function renderMyCards() {
    var container = document.getElementById('myCardsList');
    
    if (!currentSet.cards || currentSet.cards.length === 0) {
        container.innerHTML = '<div class="empty-message">📭 Нет карточек. Добавьте новую карточку</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (var i = 0; i < currentSet.cards.length; i++) {
        var card = currentSet.cards[i];
        var cardDiv = document.createElement('div');
        cardDiv.className = 'my-card-item';
        
        (function(cardId, front, back) {
            cardDiv.ondblclick = function() { editMyCard(cardId, front, back); };
        })(card.id, card.front_content, card.back_content);
        
        var imageUrl = card.card_image ? getImageUrl(card.card_image) : null;
        
        var pencilIcon = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20l4-4"/></svg>';
        
        var imageHtml = '';
        if (imageUrl) {
            imageHtml = '<div class="my-card-image-wrapper">' +
                '<img class="my-card-image" src="' + imageUrl + '" alt="Картинка" onclick="event.stopPropagation(); showFullImage(\'' + card.card_image + '\')">' +
                '<button class="image-edit-btn-circle" onclick="event.stopPropagation(); showImageUploadModal(' + card.id + ', \'' + imageUrl + '\')" title="Редактировать картинку">' +
                pencilIcon +
                '</button>' +
                '</div>';
        } else {
            imageHtml = '<div class="my-card-image-placeholder" onclick="event.stopPropagation(); showImageUploadModal(' + card.id + ', null)">' +
                '🖼️' +
                '<button class="image-edit-btn-circle-placeholder" onclick="event.stopPropagation(); showImageUploadModal(' + card.id + ', null)" title="Добавить картинку">' +
                pencilIcon +
                '</button>' +
                '</div>';
        }
        
        cardDiv.innerHTML = '<div class="my-card-content">' +
            imageHtml +
            '<div class="my-card-text">' +
            '<div class="my-card-term">📝 ' + escapeHtml(card.front_content) + '</div>' +
            '<div class="my-card-def">📖 ' + escapeHtml(card.back_content) + '</div>' +
            '</div>' +
            '</div>' +
            '<button class="delete-card-btn" onclick="event.stopPropagation(); deleteMyCard(' + card.id + ')">🗑️ Удалить</button>';
        
        container.appendChild(cardDiv);
    }
}

async function addNewCard() {
    var term = document.getElementById('newTerm').value.trim();
    var definition = document.getElementById('newDefinition').value.trim();
    
    term = sanitizeInput(term);
    definition = sanitizeInput(definition);
    
    if (!term || !definition) {
        showToast('Заполните термин и определение', 'error');
        return;
    }
    
    if (!validateLength(term, 1, MAX_TERM_LENGTH, 'Термин')) {
        return;
    }
    
    if (!validateLength(definition, 1, MAX_DEFINITION_LENGTH, 'Определение')) {
        return;
    }
    
    if (!validateNoHtml(term, 'Термин')) {
        return;
    }
    
    if (!validateNoHtml(definition, 'Определение')) {
        return;
    }
    
    var isDuplicate = false;
    for (var i = 0; i < currentSet.cards.length; i++) {
        if (currentSet.cards[i].front_content.toLowerCase() === term.toLowerCase() && 
            currentSet.cards[i].back_content.toLowerCase() === definition.toLowerCase()) {
            isDuplicate = true;
            break;
        }
    }
    
    if (isDuplicate) {
        showToast('Такая карточка уже есть в этом наборе!', 'error');
        return;
    }
    
    if (!currentSet.id) {
        showToast('Сначала сохраните набор', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        var formData = new FormData();
        formData.append('action', 'add_card');
        formData.append('set_id', currentSet.id);
        formData.append('user_id', currentUser.id);
        formData.append('front_content', term);
        formData.append('back_content', definition);
        if (currentImageFile) {
            formData.append('card_image', currentImageFile);
        }
        
        var response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        var data = await response.json();
        
        if (data.success) {
            var imagePath = data.user?.card_image || null;
            if (imagePath) {
                imagePath = getImageUrl(imagePath);
            }
            
            currentSet.cards.push({
                id: data.user?.card_id || Date.now(),
                front_content: term,
                back_content: definition,
                card_image: imagePath
            });
            renderMyCards();
            
            document.getElementById('newTerm').value = '';
            document.getElementById('newDefinition').value = '';
            clearImagePreview();
            showToast('Карточка добавлена', 'success');
        } else {
            showToast(data.message || 'Ошибка добавления', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка соединения: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMyCard(cardId) {
    if (!confirm('Удалить эту карточку?')) return;
    
    showLoading(true);
    
    try {
        var formData = new URLSearchParams();
        formData.append('action', 'delete_card');
        formData.append('card_id', cardId);
        formData.append('user_id', currentUser.id);
        
        var response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        var data = await response.json();
        
        if (data.success) {
            var newCards = [];
            for (var i = 0; i < currentSet.cards.length; i++) {
                if (currentSet.cards[i].id !== cardId) {
                    newCards.push(currentSet.cards[i]);
                }
            }
            currentSet.cards = newCards;
            renderMyCards();
            showToast('Карточка удалена', 'success');
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

async function editMyCard(cardId, oldTerm, oldDef) {
    var newTerm = prompt('Редактировать термин:', oldTerm);
    if (newTerm === null) return;
    var newDef = prompt('Редактировать определение:', oldDef);
    if (newDef === null) return;
    
    newTerm = sanitizeInput(newTerm.trim());
    newDef = sanitizeInput(newDef.trim());
    
    if (!newTerm || !newDef) {
        showToast('Термин и определение не могут быть пустыми', 'error');
        return;
    }
    
    if (!validateLength(newTerm, 1, MAX_TERM_LENGTH, 'Термин')) {
        return;
    }
    
    if (!validateLength(newDef, 1, MAX_DEFINITION_LENGTH, 'Определение')) {
        return;
    }
    
    if (!validateNoHtml(newTerm, 'Термин')) {
        return;
    }
    
    if (!validateNoHtml(newDef, 'Определение')) {
        return;
    }
    
    showLoading(true);
    
    try {
        var formData = new URLSearchParams();
        formData.append('action', 'edit_card');
        formData.append('card_id', cardId);
        formData.append('set_id', currentSet.id);
        formData.append('user_id', currentUser.id);
        formData.append('front_content', newTerm);
        formData.append('back_content', newDef);
        
        var response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        var data = await response.json();
        
        if (data.success) {
            for (var i = 0; i < currentSet.cards.length; i++) {
                if (currentSet.cards[i].id === cardId) {
                    currentSet.cards[i].front_content = newTerm;
                    currentSet.cards[i].back_content = newDef;
                    break;
                }
            }
            renderMyCards();
            showToast('Карточка обновлена', 'success');
        } else {
            showToast(data.message || 'Ошибка обновления', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка соединения', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type) {
    type = type || 'info';
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

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

window.showFullImage = showFullImage;
window.showImageUploadModal = showImageUploadModal;
window.deleteMyCard = deleteMyCard;
window.editMyCard = editMyCard;
window.addNewCard = addNewCard;
window.saveSet = saveSet;
window.createNewSet = createNewSet;
window.goToDashboard = goToDashboard;
window.logout = logout;
window.clearImagePreview = clearImagePreview;
window.closeImageModal = closeImageModal;