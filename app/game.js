// game.js - Мини-игры для запоминания карточек (с прогрессом в localStorage)

const API_URL = '/backend/cardsets.php';
let currentUser = null;
let currentSet = null;
let currentCards = [];

// Состояния для разных режимов
let flashcardIndex = 0;
let quizQuestions = [];
let quizCurrentIndex = 0;
let quizScore = 0;
let userAnswers = [];
let matchingCards = [];
let selectedMatchingIndex = null;
let matchesFound = 0;
let attempts = 0;
let currentMode = 'flashcards';

// Статистика для завершения
let startTime = null;
let cardRatings = {};

// ========== РАБОТА С ПРОГРЕССОМ В localStorage ==========
function getProgressKey() {
    if (!currentUser || !currentSet || !currentSet.id) return null;
    return `card_progress_${currentUser.id}_${currentSet.id}`;
}

function loadProgressFromLocal() {
    const key = getProgressKey();
    if (!key) {
        console.log('Нет ключа для прогресса');
        return;
    }
    
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            cardRatings = parsed.cardRatings || {};
            console.log('📚 Прогресс загружен:', Object.keys(cardRatings).length, 'карточек выучено');
            
            // Обновляем отображение прогресса
            updateProgressDisplay();
        } catch(e) {
            console.error('Ошибка загрузки прогресса:', e);
            cardRatings = {};
        }
    } else {
        cardRatings = {};
        console.log('📚 Нет сохранённого прогресса для этого набора');
    }
}

function saveProgressToLocal() {
    const key = getProgressKey();
    if (!key) {
        console.log('Не могу сохранить: нет ключа');
        return;
    }
    
    const toSave = {
        cardRatings: cardRatings,
        lastUpdated: new Date().toISOString(),
        setId: currentSet.id,
        setTitle: currentSet.title
    };
    localStorage.setItem(key, JSON.stringify(toSave));
    
    const learnedCount = Object.keys(cardRatings).filter(id => cardRatings[id] === 'easy').length;
    console.log('💾 Прогресс сохранён:', learnedCount, 'карточек выучено из', currentCards.length);
    
    // Обновляем отображение
    updateProgressDisplay();
}

function updateProgressDisplay() {
    const totalCards = currentCards.length;
    const learnedCards = Object.keys(cardRatings).filter(cardId => cardRatings[cardId] === 'easy').length;
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.innerHTML = `📚 Выучено: ${learnedCards}/${totalCards}`;
    }
}

function markCardAsLearned(cardId) {
    // Проверяем, не отмечена ли уже карточка как выученная
    if (cardRatings[cardId] === 'easy') {
        console.log('Карточка уже была выучена ранее');
        return false;
    }
    
    // Отмечаем карточку как выученную
    cardRatings[cardId] = 'easy';
    saveProgressToLocal();
    
    const learnedCount = Object.keys(cardRatings).filter(id => cardRatings[id] === 'easy').length;
    showToast(`✅ Карточка выучена! (${learnedCount}/${currentCards.length})`, 'success');
    return true;
}

function isCardLearned(cardId) {
    return cardRatings[cardId] === 'easy';
}

function getLearnedCount() {
    return Object.keys(cardRatings).filter(id => cardRatings[id] === 'easy').length;
}

function getProgressPercent() {
    if (currentCards.length === 0) return 0;
    return Math.round((getLearnedCount() / currentCards.length) * 100);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
    }, 2000);
}

function getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
        return imagePath;
    }
    return '/uploads/' + imagePath;
}

// ========== ЗАГРУЗКА КАРТОЧЕК ==========
window.onload = async function() {
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        
        const urlParams = new URLSearchParams(window.location.search);
        const setId = urlParams.get('set_id');
        
        if (!setId) {
            showToast('Набор не выбран', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
            return;
        }
        
        await loadSetCards(setId);
        setupEventListeners();
        
        startTime = Date.now();
        
    } catch (e) {
        console.error('Ошибка инициализации:', e);
        showToast('Ошибка загрузки данных', 'error');
    }
};

async function loadSetCards(setId) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}?action=get_set&set_id=${setId}`);
        const data = await response.json();
        
        if (data.success && data.user && data.user.set) {
            currentSet = data.user.set;
            document.getElementById('gameSetTitle').innerText = currentSet.title || 'Набор карточек';
            currentCards = currentSet.cards || [];
            
            if (currentCards.length === 0) {
                showToast('В этом наборе нет карточек', 'error');
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
                return;
            }
            
            // Загружаем прогресс из localStorage
            loadProgressFromLocal();
            
            initFlashcards();
            initQuiz();
            initMatching();
            
            updateProgressDisplay();
        } else {
            showToast('Не удалось загрузить карточки', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка соединения', 'error');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchMode(mode);
        });
    });
    
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
        });
    }
    
    const prevBtn = document.getElementById('prevCardBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevFlashcard);
    }
    
    const nextBtn = document.getElementById('nextCardBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextFlashcard);
    }
    
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = btn.dataset.rating;
            rateCurrentCard(rating);
        });
    });
    
    const nextQuizBtn = document.getElementById('nextQuizBtn');
    if (nextQuizBtn) {
        nextQuizBtn.addEventListener('click', nextQuizQuestion);
    }
}

function switchMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.game-mode').forEach(el => el.classList.remove('active'));
    const modeElement = document.getElementById(`${mode}Mode`);
    if (modeElement) {
        modeElement.classList.add('active');
    }
}

// ========== ФЛЕШ-КАРТОЧКИ ==========
function initFlashcards() {
    flashcardIndex = 0;
    updateFlashcardDisplay();
}

function updateFlashcardDisplay() {
    if (currentCards.length === 0) return;
    
    const card = currentCards[flashcardIndex];
    const imageUrl = getImageUrl(card.card_image);
    const isLearned = isCardLearned(card.id);
    
    const shortTerm = truncateText(card.front_content, 100);
    const shortDef = truncateText(card.back_content, 100);
    
    let frontContent = '';
    if (imageUrl) {
        frontContent = `
            <div class="card-image-container">
                <img src="${imageUrl}" alt="Изображение" class="card-front-image" onerror="this.style.display='none'">
            </div>
            <div class="card-term">${escapeHtml(shortTerm)}</div>
        `;
    } else {
        frontContent = `<div class="card-term">${escapeHtml(shortTerm)}</div>`;
    }
    
    let backContent = '';
    if (imageUrl) {
        backContent = `
            <div class="card-image-container">
                <img src="${imageUrl}" alt="Изображение" class="card-back-image" onerror="this.style.display='none'">
            </div>
            <div class="card-definition">${escapeHtml(shortDef)}</div>
        `;
    } else {
        backContent = `<div class="card-definition">${escapeHtml(shortDef)}</div>`;
    }
    
    // Добавляем индикатор выученной карточки
    const learnedBadge = isLearned ? '<div style="position: absolute; top: 10px; right: 10px; background: #10b981; color: white; padding: 4px 8px; border-radius: 20px; font-size: 11px;">✓ Выучено</div>' : '';
    
    const frontElement = document.getElementById('flashcardTerm');
    const backElement = document.getElementById('flashcardDef');
    if (frontElement) frontElement.innerHTML = frontContent + learnedBadge;
    if (backElement) backElement.innerHTML = backContent;
    
    const counterElement = document.getElementById('cardCounter');
    if (counterElement) {
        counterElement.innerText = `Карточка ${flashcardIndex + 1} из ${currentCards.length}`;
    }
    
    const flashcard = document.getElementById('flashcard');
    if (flashcard) flashcard.classList.remove('flipped');
    
    const prevBtn = document.getElementById('prevCardBtn');
    if (prevBtn) prevBtn.disabled = flashcardIndex === 0;
    
    const nextBtn = document.getElementById('nextCardBtn');
    if (nextBtn) nextBtn.disabled = flashcardIndex === currentCards.length - 1;
}

function prevFlashcard() {
    if (flashcardIndex > 0) {
        flashcardIndex--;
        updateFlashcardDisplay();
    }
}

function nextFlashcard() {
    if (flashcardIndex < currentCards.length - 1) {
        flashcardIndex++;
        updateFlashcardDisplay();
    } else {
        showCompletion('Флеш-карточки', {
            total: currentCards.length,
            studied: currentCards.length,
            learned: getLearnedCount(),
            percent: getProgressPercent()
        });
    }
}

function rateCurrentCard(rating) {
    const cardId = currentCards[flashcardIndex].id;
    const currentCard = currentCards[flashcardIndex];
    
    if (rating === 'easy') {
        // ТОЛЬКО ПРИ НАЖАТИИ "ЛЕГКО" - карточка становится выученной
        markCardAsLearned(cardId);
    } else if (rating === 'medium') {
        showToast(`📘 "${truncateText(currentCard.front_content, 30)}" - Средне, повторите позже`, 'info');
    } else if (rating === 'hard') {
        showToast(`📙 "${truncateText(currentCard.front_content, 30)}" - Сложно, будет повторено`, 'info');
    }
    
    // Автоматический переход к следующей карточке
    setTimeout(() => {
        if (flashcardIndex < currentCards.length - 1) {
            nextFlashcard();
        } else {
            showCompletion('Флеш-карточки', {
                total: currentCards.length,
                studied: currentCards.length,
                learned: getLearnedCount(),
                percent: getProgressPercent()
            });
        }
    }, 600);
}

// ========== ВИКТОРИНА ==========
function initQuiz() {
    quizQuestions = [];
    
    for (let i = 0; i < currentCards.length; i++) {
        const card = currentCards[i];
        const shortTerm = truncateText(card.front_content, 50);
        const shortDef = truncateText(card.back_content, 50);
        
        quizQuestions.push({
            id: card.id,
            term: shortTerm,
            correctDef: shortDef,
            type: 'termToDef'
        });
        quizQuestions.push({
            id: card.id,
            term: shortDef,
            correctDef: shortTerm,
            type: 'defToTerm'
        });
    }
    
    shuffleArray(quizQuestions);
    
    quizCurrentIndex = 0;
    quizScore = 0;
    userAnswers = [];
    
    updateQuizScore();
    showQuizQuestion();
}

function showQuizQuestion() {
    if (quizCurrentIndex >= quizQuestions.length) {
        const percent = Math.round((quizScore / quizQuestions.length) * 100);
        showCompletion('Викторина', {
            total: quizQuestions.length,
            correct: quizScore,
            percent: percent,
            learned: getLearnedCount(),
            totalCards: currentCards.length
        });
        return;
    }
    
    const question = quizQuestions[quizCurrentIndex];
    let questionText = question.type === 'termToDef' 
        ? `Что означает: "${question.term}"?`
        : `Как переводится: "${question.term}"?`;
    
    if (questionText.length > 100) {
        questionText = questionText.substring(0, 97) + '...?';
    }
    
    const questionElement = document.getElementById('quizQuestion');
    if (questionElement) questionElement.innerText = questionText;
    
    const feedbackDiv = document.getElementById('quizFeedback');
    if (feedbackDiv) {
        feedbackDiv.innerHTML = '';
        feedbackDiv.className = 'quiz-feedback';
    }
    
    const nextBtn = document.getElementById('nextQuizBtn');
    if (nextBtn) nextBtn.style.display = 'none';
    
    const options = generateOptions(question.correctDef, question.type);
    const optionsContainer = document.getElementById('quizOptions');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        
        shuffleArray(options);
        
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            const displayText = truncateText(opt, 60);
            btn.innerText = displayText;
            
            (function(selected, correct, button, cardId) {
                btn.onclick = function() { checkQuizAnswer(selected, correct, button, cardId); };
            })(opt, question.correctDef, btn, question.id);
            
            optionsContainer.appendChild(btn);
        }
    }
}

function generateOptions(correctDef, type) {
    const options = [correctDef];
    const otherDefs = [];
    
    for (let i = 0; i < currentCards.length; i++) {
        const def = type === 'termToDef' ? currentCards[i].back_content : currentCards[i].front_content;
        if (def !== correctDef) {
            otherDefs.push(def);
        }
    }
    
    const uniqueOthers = [];
    for (let i = 0; i < otherDefs.length; i++) {
        if (uniqueOthers.indexOf(otherDefs[i]) === -1) {
            uniqueOthers.push(otherDefs[i]);
        }
    }
    
    for (let i = 0; i < Math.min(3, uniqueOthers.length); i++) {
        const randomIndex = Math.floor(Math.random() * uniqueOthers.length);
        options.push(uniqueOthers[randomIndex]);
        uniqueOthers.splice(randomIndex, 1);
    }
    
    return options;
}

function checkQuizAnswer(selected, correct, buttonElement, cardId) {
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.classList.add('disabled');
        btn.onclick = null;
    });
    
    const isCorrect = selected === correct;
    const feedbackDiv = document.getElementById('quizFeedback');
    
    if (isCorrect) {
        quizScore++;
        if (feedbackDiv) {
            feedbackDiv.innerHTML = '✅ Правильно! +1 балл';
            feedbackDiv.className = 'quiz-feedback correct';
        }
        buttonElement.classList.add('correct');
    } else {
        if (feedbackDiv) {
            feedbackDiv.innerHTML = `❌ Неправильно. Правильный ответ: "${correct}"`;
            feedbackDiv.className = 'quiz-feedback wrong';
        }
        buttonElement.classList.add('wrong');
        
        document.querySelectorAll('.quiz-option').forEach(btn => {
            if (btn.innerText === correct) {
                btn.classList.add('correct');
            }
        });
    }
    
    userAnswers.push({
        question: quizQuestions[quizCurrentIndex],
        selected: selected,
        correct: isCorrect
    });
    
    updateQuizScore();
    const nextBtn = document.getElementById('nextQuizBtn');
    if (nextBtn) nextBtn.style.display = 'block';
}

function nextQuizQuestion() {
    quizCurrentIndex++;
    showQuizQuestion();
}

function updateQuizScore() {
    const scoreElement = document.getElementById('quizScore');
    if (scoreElement) {
        scoreElement.innerText = `Правильно: ${quizScore} / ${quizQuestions.length}`;
    }
}

// ========== НАЙДИ ПАРУ ==========
function initMatching() {
    matchingCards = [];
    currentCards.forEach((card, idx) => {
        matchingCards.push({
            id: `term_${idx}`,
            cardId: card.id,
            text: truncateText(card.front_content, 30),
            pairId: idx,
            type: 'term',
            matched: isCardLearned(card.id),
            image: card.card_image
        });
        matchingCards.push({
            id: `def_${idx}`,
            cardId: card.id,
            text: truncateText(card.back_content, 30),
            pairId: idx,
            type: 'def',
            matched: false,
            image: null
        });
    });
    
    shuffleArray(matchingCards);
    
    matchesFound = matchingCards.filter(c => c.matched).length / 2;
    attempts = 0;
    selectedMatchingIndex = null;
    
    updateMatchingStats();
    renderMatchingGrid();
}

function renderMatchingGrid() {
    const grid = document.getElementById('matchingGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    matchingCards.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `matching-card ${card.matched ? 'matched' : ''} ${selectedMatchingIndex === idx ? 'selected' : ''}`;
        
        if (card.type === 'term' && card.image && !card.matched) {
            const imageUrl = getImageUrl(card.image);
            cardDiv.innerHTML = `
                <div class="matching-card-content">
                    <img src="${imageUrl}" class="matching-card-image" onerror="this.style.display='none'">
                    <span class="matching-card-text">${escapeHtml(card.text)}</span>
                </div>
            `;
        } else {
            cardDiv.innerText = card.text;
        }
        
        if (!card.matched) {
            cardDiv.onclick = () => onMatchingCardClick(idx);
        }
        grid.appendChild(cardDiv);
    });
}

function onMatchingCardClick(clickedIndex) {
    const clickedCard = matchingCards[clickedIndex];
    
    if (clickedCard.matched) return;
    
    if (selectedMatchingIndex === null) {
        selectedMatchingIndex = clickedIndex;
        renderMatchingGrid();
    } else {
        attempts++;
        const selectedCard = matchingCards[selectedMatchingIndex];
        
        if (selectedCard.pairId === clickedCard.pairId && selectedMatchingIndex !== clickedIndex) {
            matchesFound++;
            matchingCards[selectedMatchingIndex].matched = true;
            matchingCards[clickedIndex].matched = true;
            
            // Отмечаем карточку как выученную при нахождении пары
            markCardAsLearned(selectedCard.cardId);
            
            showToast('Пара найдена! 🎉 Карточка выучена!', 'success');
        } else {
            showToast(`❌ "${selectedCard.text}" не подходит к "${clickedCard.text}"`, 'error');
        }
        
        selectedMatchingIndex = null;
        renderMatchingGrid();
        updateMatchingStats();
        
        if (matchesFound === currentCards.length) {
            showCompletion('Найди пару', {
                total: currentCards.length,
                matches: matchesFound,
                attempts: attempts,
                accuracy: Math.round((matchesFound * 2 / attempts) * 100),
                learned: getLearnedCount(),
                percent: getProgressPercent()
            });
        }
    }
}

function updateMatchingStats() {
    const matchesSpan = document.getElementById('matchesFound');
    if (matchesSpan) {
        matchesSpan.innerText = `${matchesFound} / ${currentCards.length}`;
    }
    const attemptsSpan = document.getElementById('attemptsCount');
    if (attemptsSpan) {
        attemptsSpan.innerText = attempts;
    }
}

function resetMatchingGame() {
    initMatching();
    showToast('Колода перемешана!', 'info');
}

// ========== ЗАВЕРШЕНИЕ ==========
function showCompletion(gameName, stats) {
    const overlay = document.getElementById('completionOverlay');
    const messageEl = document.getElementById('completionMessage');
    const statsEl = document.getElementById('completionStats');
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    const learnedCount = getLearnedCount();
    const totalCards = currentCards.length;
    const progressPercent = getProgressPercent();
    
    let statsHtml = `<p>⏱ Время: ${minutes} мин ${seconds} сек</p>`;
    statsHtml += `<p>🎯 Выучено карточек: ${learnedCount} / ${totalCards} (${progressPercent}%)</p>`;
    
    if (stats.total) {
        statsHtml += `<p>📊 Всего заданий: ${stats.total}</p>`;
    }
    if (stats.correct !== undefined) {
        statsHtml += `<p>✅ Правильно: ${stats.correct} / ${stats.total} (${stats.percent}%)</p>`;
    }
    if (stats.matches !== undefined) {
        statsHtml += `<p>🎯 Найдено пар: ${stats.matches} / ${stats.total}</p>`;
        statsHtml += `<p>🖱 Попыток: ${stats.attempts}</p>`;
        if (stats.accuracy) {
            statsHtml += `<p>📈 Точность: ${stats.accuracy}%</p>`;
        }
    }
    
    if (messageEl) messageEl.innerText = `Вы завершили игру "${gameName}"!`;
    if (statsEl) statsEl.innerHTML = statsHtml;
    if (overlay) overlay.style.display = 'flex';
}

function retryCurrentGame() {
    const overlay = document.getElementById('completionOverlay');
    if (overlay) overlay.style.display = 'none';
    
    switch (currentMode) {
        case 'flashcards':
            initFlashcards();
            break;
        case 'quiz':
            initQuiz();
            break;
        case 'matching':
            resetMatchingGame();
            break;
    }
    
    startTime = Date.now();
}

function goBack() {
    window.location.href = 'dashboard.html';
}

// Глобальные функции для onclick
window.retryCurrentGame = retryCurrentGame;
window.goBack = goBack;
window.resetMatchingGame = resetMatchingGame;