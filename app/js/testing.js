// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUserId = null;
let testSession = null;
let questions = [];
let currentQuestionIndex = 0;
let attemptNumber = 1;

const TESTING_API_URL = '/backend/testing.php';

// Элементы DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');

// ========== ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ==========
function getCurrentUser() {
    var userData = localStorage.getItem('user');
    if (!userData) {
        return null;
    }
    try {
        return JSON.parse(userData);
    } catch(e) {
        console.error('Error parsing user:', e);
        return null;
    }
}

function getCurrentUserId() {
    var user = getCurrentUser();
    return user ? user.id : null;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(text, isError = false) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    toast.className = isError ? 'toast error show' : 'toast success show';
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== ПОЛУЧЕНИЕ КОЛИЧЕСТВА ПОПЫТОК ==========
async function loadAttemptCount() {
    var userId = getCurrentUserId();
    if (!userId) {
        attemptNumber = 1;
        return;
    }
    
    try {
        const response = await fetch(TESTING_API_URL + '?action=get_attempt_count&user_id=' + userId);
        const data = await response.json();
        
        if (data.success) {
            attemptNumber = data.attempt_count + 1;
        } else {
            attemptNumber = 1;
        }
    } catch(error) {
        console.error('Error loading attempt count:', error);
        attemptNumber = 1;
    }
    
    console.log('Current attempt number:', attemptNumber);
    
    var attemptCountElem = document.getElementById('attemptCount');
    if (attemptCountElem) {
        attemptCountElem.textContent = attemptNumber;
    }
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadTestSession() {
    var userId = getCurrentUserId();
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = userId;
    
    testSession = {
        answers: {}
    };
    
    await loadAttemptCount();
    loadFromLocalStorage();
    updateStatsUI();
}

async function loadQuestions() {
    showLoading(true);
    
    try {
        const response = await fetch(TESTING_API_URL + '?action=get_questions&limit=30');
        const data = await response.json();
        console.log('Questions response:', data);
        
        if (data.success && data.questions) {
            questions = data.questions;
            renderCurrentQuestion();
            updateStatsUI();
            updateButtonsState();
        } else {
            showMessage('Ошибка загрузки вопросов: ' + (data.error || 'Неизвестная ошибка'), true);
        }
    } catch(error) {
        console.error('Error loading questions:', error);
        showMessage('Ошибка подключения к серверу', true);
    } finally {
        showLoading(false);
    }
}

function getAnsweredCount() {
    return Object.keys(testSession.answers).length;
}

function updateStatsUI() {
    if (!questions.length) return;

    var answeredCount = getAnsweredCount();
    var answeredCountElem = document.getElementById('answeredCount');
    var totalQuestionsElem = document.getElementById('totalQuestions');
    var attemptCountElem = document.getElementById('attemptCount');
    var currentScoreElem = document.getElementById('currentScore');
    
    if (answeredCountElem) answeredCountElem.textContent = answeredCount;
    if (totalQuestionsElem) totalQuestionsElem.textContent = questions.length;
    if (attemptCountElem) attemptCountElem.textContent = attemptNumber;
    if (currentScoreElem) currentScoreElem.textContent = '?';
}

function updateButtonsState() {
    var prevBtn = document.getElementById('prevQuestionBtn');
    var nextBtn = document.getElementById('nextQuestionBtn');
    
    if (prevBtn) {
        prevBtn.disabled = (currentQuestionIndex === 0);
    }
    
    if (nextBtn) {
        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-block';
        }
    }
}

function renderCurrentQuestion() {
    if (!questions.length) return;

    var question = questions[currentQuestionIndex];
    var questionNumberElem = document.getElementById('questionNumber');
    var questionTopicElem = document.getElementById('questionTopic');
    var questionTextElem = document.getElementById('questionText');
    var answersListElem = document.getElementById('answersList');
    
    if (questionNumberElem) {
        questionNumberElem.textContent = 'Вопрос ' + (currentQuestionIndex + 1) + ' / ' + questions.length;
    }
    if (questionTopicElem) {
        questionTopicElem.textContent = 'Тема: ' + (question.topic || 'Общий');
    }
    if (questionTextElem) {
        questionTextElem.textContent = question.text;
    }
    
    var savedAnswer = testSession.answers[question.id];
    var letters = ['A', 'B', 'C'];
    
    var answersHtml = '';
    for (var idx = 0; idx < question.options.length; idx++) {
        var checkedAttr = (savedAnswer === idx) ? 'checked' : '';
        answersHtml += '<div class="answer-option" data-answer-index="' + idx + '">' +
            '<input type="radio" name="answer" value="' + idx + '" id="answer_' + idx + '" ' + checkedAttr + '>' +
            '<label for="answer_' + idx + '">' + letters[idx] + '. ' + escapeHtml(question.options[idx]) + '</label>' +
            '</div>';
    }
    
    if (answersListElem) {
        answersListElem.innerHTML = answersHtml;
    }
    
    var answerOptions = document.querySelectorAll('.answer-option');
    for (var i = 0; i < answerOptions.length; i++) {
        var option = answerOptions[i];
        var radio = option.querySelector('input');
        
        option.addEventListener('click', (function(r) {
            return function() {
                r.checked = true;
                saveCurrentAnswer();
            };
        })(radio));
        
        if (radio) {
            radio.addEventListener('change', function() {
                saveCurrentAnswer();
            });
        }
    }
    
    updateButtonsState();
}

function saveCurrentAnswer() {
    var selectedRadio = document.querySelector('input[name="answer"]:checked');
    if (!selectedRadio) return;
    
    var question = questions[currentQuestionIndex];
    var selectedIndex = parseInt(selectedRadio.value);
    
    testSession.answers[question.id] = selectedIndex;
    
    saveToLocalStorage();
}

function onNextClick() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
        updateStatsUI();
    }
}

function onPrevClick() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
        updateStatsUI();
    }
}

function calculateFinalScore() {
    var score = 0;
    for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        var userAnswer = testSession.answers[q.id];
        if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
            score++;
        }
    }
    return score;
}

function determineLanguageLevel(score, totalQuestions) {
    if (score >= 25 && score <= 30) {
        return { level: 'C2', description: 'Вы свободно владеете языком', color: '#4f46e5' };
    }
    if (score >= 20 && score <= 24) {
        return { level: 'C1', description: 'Отличный уровень для работы и учёбы', color: '#4f46e5' };
    }
    if (score >= 15 && score <= 19) {
        return { level: 'B2', description: 'Уверенное владение', color: '#3b82f6' };
    }
    if (score >= 10 && score <= 14) {
        return { level: 'B1', description: 'Можете поддерживать беседу', color: '#10b981' };
    }
    if (score >= 5 && score <= 9) {
        return { level: 'A2', description: 'Понимаете простые фразы', color: '#f59e0b' };
    }
    return { level: 'A1', description: 'Начните с основ', color: '#ef4444' };
}

async function saveResultsToDB(score) {
    var userId = getCurrentUserId();
    if (!userId) return;
    
    var totalQuestions = questions.length;
    var levelInfo = determineLanguageLevel(score, totalQuestions);
    
    try {
        const response = await fetch(TESTING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_results',
                user_id: userId,
                score: score,
                total_questions: totalQuestions,
                level: levelInfo.level,
                attempt_number: attemptNumber
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('Results saved successfully');
            localStorage.removeItem('testSession_' + currentUserId);
        } else {
            console.error('Error saving results:', data.error);
        }
    } catch(error) {
        console.error('Error saving results:', error);
    }
}

async function finishTest() {
    var answeredCount = getAnsweredCount();
    if (answeredCount === 0) {
        showMessage('Ответьте хотя бы на один вопрос перед завершением', true);
        return;
    }
    
    showLoading(true);
    
    var finalScore = calculateFinalScore();
    
    var currentScoreElem = document.getElementById('currentScore');
    if (currentScoreElem) {
        currentScoreElem.textContent = finalScore;
    }
    
    await saveResultsToDB(finalScore);
    
    showLoading(false);
    showResultModal(finalScore);
}

function showResultModal(finalScore) {
    var totalQuestions = questions.length;
    var levelInfo = determineLanguageLevel(finalScore, totalQuestions);
    var percentage = Math.round((finalScore / totalQuestions) * 100);
    
    var resultHtml = 
        '<div class="result-row">' +
            '<span class="result-label">Попытка №</span>' +
            '<span class="result-value">' + attemptNumber + '</span>' +
        '</div>' +
        '<div class="result-row">' +
            '<span class="result-label">Дата</span>' +
            '<span class="result-value">' + new Date().toLocaleDateString() + '</span>' +
        '</div>' +
        '<div class="result-row">' +
            '<span class="result-label">Правильных ответов</span>' +
            '<span class="result-value">' + finalScore + ' / ' + totalQuestions + '</span>' +
        '</div>' +
        '<div class="result-row">' +
            '<span class="result-label">Процент выполнения</span>' +
            '<span class="result-value">' + percentage + '%</span>' +
        '</div>' +
        '<div class="result-row">' +
            '<span class="result-label">Уровень языка</span>' +
            '<span class="result-value" style="color: ' + levelInfo.color + '; font-weight: bold;">' + levelInfo.level + '</span>' +
        '</div>' +
        '<div class="result-row">' +
            '<span class="result-label">Рекомендация</span>' +
            '<span class="result-value">' + levelInfo.description + '</span>' +
        '</div>';
    
    var resultContent = document.getElementById('resultContent');
    if (resultContent) {
        resultContent.innerHTML = resultHtml;
    }
    
    var resultModal = document.getElementById('resultModal');
    if (resultModal) {
        resultModal.classList.remove('hidden');
    }
}

function confirmFinish() {
    var confirmModal = document.getElementById('confirmFinishModal');
    if (confirmModal) {
        confirmModal.classList.remove('hidden');
    }
}

function saveToLocalStorage() {
    if (currentUserId && testSession) {
        localStorage.setItem('testSession_' + currentUserId, JSON.stringify(testSession));
    }
}

function loadFromLocalStorage() {
    if (currentUserId) {
        var saved = localStorage.getItem('testSession_' + currentUserId);
        if (saved) {
            try {
                var parsed = JSON.parse(saved);
                testSession.answers = parsed.answers || {};
                if (questions.length > 0) {
                    renderCurrentQuestion();
                }
                updateStatsUI();
            } catch(e) {
                console.error('Error parsing saved session:', e);
            }
        }
    }
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

function setupNavigation() {
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function() {
            var view = this.getAttribute('data-view');
            switch(view) {
                case 'cards':
                    window.location.href = 'dashboard.html';
                    break;
                case 'dialogs':
                    window.location.href = 'dialog1.html';
                    break;
                case 'testing':
                    break;
                case 'journal':
                    window.location.href = 'journal.html';
                    break;
                case 'settings':
                    alert('⚙️ Настройки в разработке');
                    break;
                default:
                    alert('Раздел в разработке');
            }
        });
    }
}

function initEvents() {
    var prevBtn = document.getElementById('prevQuestionBtn');
    var nextBtn = document.getElementById('nextQuestionBtn');
    var finishTestBtn = document.getElementById('finishTestBtn');
    var closeResultBtn = document.getElementById('closeResultBtn');
    var confirmFinishYesBtn = document.getElementById('confirmFinishYesBtn');
    var confirmFinishNoBtn = document.getElementById('confirmFinishNoBtn');

    if (prevBtn) prevBtn.addEventListener('click', onPrevClick);
    if (nextBtn) nextBtn.addEventListener('click', onNextClick);
    if (finishTestBtn) finishTestBtn.addEventListener('click', confirmFinish);
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', function() {
            document.getElementById('resultModal').classList.add('hidden');
            window.location.href = 'dashboard.html';
        });
    }
    if (confirmFinishYesBtn) {
        confirmFinishYesBtn.addEventListener('click', function() {
            document.getElementById('confirmFinishModal').classList.add('hidden');
            finishTest();
        });
    }
    if (confirmFinishNoBtn) {
        confirmFinishNoBtn.addEventListener('click', function() {
            document.getElementById('confirmFinishModal').classList.add('hidden');
        });
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    showLoading(true);
    await loadTestSession();
    await loadQuestions();
    initEvents();
    setupNavigation();
    showLoading(false);
});
function goToDashboard() {
    window.location.href = 'dashboard.html';
}