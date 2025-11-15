const API_BASE = 'https://history-test.onrender.com';

// State Management
let state = {
    questions: [],
    userId: '',
    startTime: null,
    sessionId: '',
    userAnswers: {},
    timerInterval: null,
    timeRemaining: 15 * 60 // 15 minutes in seconds
};

// DOM Elements
const loginSection = document.getElementById('login-section');
const examSection = document.getElementById('exam-section');
const resultSection = document.getElementById('result-section');
const questionsContainer = document.getElementById('questions-container');
const historyList = document.getElementById('history-list');

// --- Event Listeners ---

document.getElementById('startBtn').addEventListener('click', startExam);
document.getElementById('submitBtn').addEventListener('click', submitExam);
document.getElementById('viewHistoryBtn').addEventListener('click', () => {
    const userId = document.getElementById('userIdInput').value.trim();
    if (!userId) return alert("Vui lòng nhập Tên Học Sinh trước.");
    state.userId = userId;
    showHistorySection();
});
document.getElementById('refreshHistory').addEventListener('click', fetchHistory);
document.getElementById('viewAnswersBtn').addEventListener('click', showAnswersView);

// --- Core Functions ---

async function startExam() {
    const userIdInput = document.getElementById('userIdInput').value.trim();
    if (!userIdInput) return alert("Vui lòng nhập Tên Học Sinh của bạn.");

    state.userId = userIdInput;
    state.sessionId = generateSessionId();
    state.startTime = new Date();

    // UI Transition
    loginSection.classList.add('hidden');
    examSection.classList.remove('hidden');
    document.getElementById('student-display').innerText = `Học sinh: ${state.userId}`;

    // Fetch Questions
    try {
        const response = await fetch(`/sheet/question`);
        const json = await response.json();

        if (json.code === 'success') {
            state.questions = json.data;
            renderQuestions(state.questions);
            startCountdownTimer(); // Start the 15-minute countdown
        } else {
            throw new Error(json.message);
        }
    } catch (error) {
        questionsContainer.innerHTML = `<p style="color:red">Lỗi tải kỳ thi: ${error.message}</p>`;
    }
}

function renderQuestions(questions) {
    questionsContainer.innerHTML = '';

    if (questions.length === 0) {
        questionsContainer.innerHTML = '<p>Không có câu hỏi nào.</p>';
        return;
    }

    questions.forEach((q, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        const qId = index;
        
        let html = `<div class="question-text"><strong>Q${index + 1}:</strong> ${q.question}</div>`;
        
        if (q.type === "Đúng sai") {
            // Yes/No question type - each statement has 2 options: "Đúng" or "Sai"
            const statements = [
                { label: q.optionA, name: 'A' },
                { label: q.optionB, name: 'B' },
                { label: q.optionC, name: 'C' },
                { label: q.optionD, name: 'D' }
            ].filter(stmt => stmt.label);
            
            html += `<div class="options">`;
            
            statements.forEach(stmt => {
                html += `
                    <div class="statement-block">
                        <div class="statement-text">${stmt.label}</div>
                        <div class="statement-options">
                            <label>
                                <input type="radio" name="q_${qId}_${stmt.name}" value="Đúng" onchange="saveAnswer('${qId}', '${stmt.name}', 'Đúng')">
                                Đúng
                            </label>
                            <label>
                                <input type="radio" name="q_${qId}_${stmt.name}" value="Sai" onchange="saveAnswer('${qId}', '${stmt.name}', 'Sai')">
                                Sai
                            </label>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            // Multiple choice question type
            const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(opt => opt);
            
            html += `
                <div class="options">
                    ${options.map(opt => {
                        const escapedOpt = opt.replace(/'/g, "\\'");
                        return `
                        <label>
                            <input type="radio" name="q_${qId}" value="${opt}" onchange="saveAnswer('${qId}', '${escapedOpt}')">
                            ${opt}
                        </label>
                    `;
                    }).join('')}
                </div>
            `;
        }
        
        qBlock.innerHTML = html;
        questionsContainer.appendChild(qBlock);
    });
}

// Timer countdown function
function startCountdownTimer() {
    // Clear any existing timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    state.timeRemaining = 15 * 60; // Reset to 15 minutes
    updateTimerDisplay();
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        // Check if time is up
        if (state.timeRemaining <= 0) {
            clearInterval(state.timerInterval);
            // Auto submit when time reaches 0
            autoSubmitExam();
        }
        
        // Warn when 1 minute remaining
        if (state.timeRemaining === 60) {
            alert("⏰ Chú ý! Chỉ còn 1 phút để nộp bài!");
        }
    }, 1000); // Update every 1 second
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    const timerElement = document.getElementById('timer');
    
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerElement.innerText = `Thời gian: ${timeStr}`;
    
    // Change color when time is running out
    if (state.timeRemaining <= 300) { // 5 minutes or less
        timerElement.style.color = '#e74c3c';
        timerElement.style.fontWeight = 'bold';
    }
    if (state.timeRemaining <= 60) { // 1 minute or less
        timerElement.style.color = '#c0392b';
        timerElement.style.animation = 'blink 0.5s infinite';
    }
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
}

function autoSubmitExam() {
    alert("⏱️ Hết thời gian! Bài thi sẽ được nộp tự động.");
    // Auto submit without confirmation
    submitExamInternal();
}

// Save selection to state when radio button changes
window.saveAnswer = (questionId, statementOrAnswer, trueOrFalse) => {
    // For "Đúng sai" questions: saveAnswer(qId, 'A', 'Đúng')
    // For multiple choice: saveAnswer(qId, optionValue)
    if (trueOrFalse) {
        // This is a "Đúng sai" question
        if (!state.userAnswers[questionId]) {
            state.userAnswers[questionId] = {};
        }
        state.userAnswers[questionId][statementOrAnswer] = trueOrFalse;
    } else {
        // This is a multiple choice question
        state.userAnswers[questionId] = statementOrAnswer;
    }
};

async function submitExam() {
    if (!confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    submitExamInternal();
}

async function submitExamInternal() {
    stopTimer(); // Stop the countdown timer
    
    const finishTime = new Date();
    
    // 1. Calculate Score (Client Side Grading)
    let score = 0;
    let metaDetails = [];
    let questionsData = [];

    state.questions.forEach((q, index) => {
        const qId = index;
        const userAnswers = state.userAnswers[qId];
        
        let isCorrect = true;
        let questionData = {
            questionId: qId,
            type: q.type,
            question: q.question
        };
        
        if (q.type === "Đúng sai") {
            // For "Đúng sai" questions, check each statement
            // userAnswers is an object: { A: 'Đúng', B: 'Sai', C: 'Đúng', D: 'Sai' }
            // Correct answers are: { A: q.answerA, B: q.answerB, C: q.answerC, D: q.answerD }
            
            if (!userAnswers || typeof userAnswers !== 'object') {
                isCorrect = false;
            } else {
                // Check if all answers are correct
                if (userAnswers['A'] !== q.answerA ||
                    userAnswers['B'] !== q.answerB ||
                    userAnswers['C'] !== q.answerC ||
                    userAnswers['D'] !== q.answerD) {
                    isCorrect = false;
                }
            }
            
            if (isCorrect) score++;
            
            metaDetails.push({
                questionId: qId,
                userAnswers: userAnswers || {},
                correct: isCorrect
            });
            
            // Store yes/no question data
            questionData.userAnswers = userAnswers || { A: null, B: null, C: null, D: null };
            questionData.optionA = q.optionA;
            questionData.answerA = q.answerA;
            questionData.optionB = q.optionB;
            questionData.answerB = q.answerB;
            questionData.optionC = q.optionC;
            questionData.answerC = q.answerC;
            questionData.optionD = q.optionD;
            questionData.answerD = q.answerD;
            questionData.explain = q.explain;
            questionData.isCorrect = isCorrect;
        } else {
            // Multiple choice questions
            const correctAns = q.answer;
            const isAnswerCorrect = userAnswers === correctAns;
            
            if (isAnswerCorrect) score++;
            
            metaDetails.push({
                questionId: qId,
                userAnswer: userAnswers || null,
                correct: isAnswerCorrect
            });
            
            // Store multiple choice question data
            questionData.userAnswer = userAnswers || null;
            questionData.optionA = q.optionA;
            questionData.optionB = q.optionB;
            questionData.optionC = q.optionC;
            questionData.optionD = q.optionD;
            questionData.correctAnswer = correctAns;
            questionData.isCorrect = isAnswerCorrect;
        }
        
        questionsData.push(questionData);
    });

    const total = state.questions.length;

    // 2. Prepare Payload for POST /score/submit
    const payload = {
        sessionId: state.sessionId,
        userId: state.userId,
        score: score,
        total: total,
        startedAt: state.startTime,
        finishedAt: finishTime,
        meta: { details: metaDetails },
        questions: questionsData  // Store full question data for review
    };

    // 3. Send to API
    try {
        const response = await fetch(`/score/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.code === 'success') {
            showResults(score, total);
        } else {
            alert("Nộp bài thất bại: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi mạng khi nộp bài.");
    }
}

function showResults(score, total) {
    examSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    
    document.getElementById('final-score').innerText = score;
    document.querySelector('.total').innerText = `/ ${total}`;
    
    const percentage = (score / total) * 100;
    const msg = document.getElementById('status-message');
    
    if (percentage >= 80) {
        msg.innerText = "Làm rất tốt! 🌟";
        msg.style.color = "green";
    } else if (percentage >= 50) {
        msg.innerText = "Làm tốt lắm! Bạn đã vượt qua.";
        msg.style.color = "orange";
    } else {
        msg.innerText = "Tiếp tục ôn tập bạn nhé! 📚";
        msg.style.color = "red";
    }

    // Show view answers button
    showViewAnswersButton();
    fetchHistory();
}

function showViewAnswersButton() {
    const btn = document.getElementById('viewAnswersBtn');
    if (btn) {
        btn.style.display = 'inline-block';
    }
}

function showAnswersView() {
    const scoreDisplay = document.getElementById('score-display');
    const actionsDiv = document.querySelector('.actions');
    const historySection = document.querySelector('h3');
    const historyList = document.getElementById('history-list');
    
    scoreDisplay.style.display = 'none';
    actionsDiv.style.display = 'none';
    if (historySection) historySection.style.display = 'none';
    historyList.style.display = 'none';
    
    let answersContainer = document.getElementById('answers-container');
    if (!answersContainer) {
        answersContainer = document.createElement('div');
        answersContainer.id = 'answers-container';
        resultSection.appendChild(answersContainer);
    }
    
    answersContainer.innerHTML = '';
    answersContainer.style.display = 'block';
    
    // Render all questions with answers
    state.questions.forEach((q, index) => {
        const qId = index;
        const userAnswers = state.userAnswers[qId];
        
        const answerDiv = document.createElement('div');
        let isCorrect = false;
        
        if (q.type === "Đúng sai") {
            // Check if all answers are correct
            isCorrect = userAnswers && 
                        userAnswers['A'] === q.answerA &&
                        userAnswers['B'] === q.answerB &&
                        userAnswers['C'] === q.answerC &&
                        userAnswers['D'] === q.answerD;
            
            answerDiv.className = `answer-block ${isCorrect ? 'correct' : 'incorrect'}`;
            
            const statusIcon = isCorrect ? '✓' : '✗';
            const statusText = isCorrect ? 'Đúng' : 'Sai';
            const statusClass = isCorrect ? 'status-correct' : 'status-incorrect';
            
            let answerContent = `
                <div class="answer-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="status ${statusClass}">${statusIcon} ${statusText}</span>
                </div>
                <div class="question-content">
                    <p class="question-text"><strong>Question:</strong> ${q.question}</p>
                    <div class="statements-review">
            `;
            
            // Display each statement with answer
            const statements = ['A', 'B', 'C', 'D'];
            const options = [q.optionA, q.optionB, q.optionC, q.optionD];
            const correctAnswers = [q.answerA, q.answerB, q.answerC, q.answerD];
            
            statements.forEach((stmt, idx) => {
                if (options[idx]) {
                    const userAns = userAnswers ? userAnswers[stmt] : null;
                    const correctAns = correctAnswers[idx];
                    const isStmtCorrect = userAns === correctAns;
                    
                    answerContent += `
                        <div class="statement-review ${isStmtCorrect ? 'stmt-correct' : 'stmt-incorrect'}">
                            <div class="statement-text">${options[idx]}</div>
                            <div class="statement-answers">
                                <span class="user-stmt-answer"><strong>Câu Trả Lời Của Bạn:</strong> <span class="${isStmtCorrect ? 'text-correct' : 'text-incorrect'}">${userAns || 'Không trả lời'}</span></span>
                                ${!isStmtCorrect ? `<span class="correct-stmt-answer"><strong>Đáp Án Đúng:</strong> <span class="text-correct">${correctAns}</span></span>` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            answerContent += `</div>`;
            
            // Add explanation
            if (q.explain) {
                const explainHtml = q.explain.replace(/\n/g, "<br>");
                answerContent += `<p class="explanation"><strong>Giải Thích:</strong><br>${explainHtml}</p>`;
            }
            
            answerContent += `</div>`;
            answerDiv.innerHTML = answerContent;
        } else {
            // Multiple choice question
            const correctAns = q.answer;
            isCorrect = userAnswers === correctAns;
            
            answerDiv.className = `answer-block ${isCorrect ? 'correct' : 'incorrect'}`;
            
            const statusIcon = isCorrect ? '✓' : '✗';
            const statusText = isCorrect ? 'Đúng' : 'Sai';
            const statusClass = isCorrect ? 'status-correct' : 'status-incorrect';
            
            let answerContent = `
                <div class="answer-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="status ${statusClass}">${statusIcon} ${statusText}</span>
                </div>
                <div class="question-content">
                    <p class="question-text"><strong>Câu hỏi:</strong> ${q.question}</p>
                    <p class="user-answer">
                        <strong>Câu Trả Lời Của Bạn:</strong> 
                        <span class="${isCorrect ? 'text-correct' : 'text-incorrect'}">${userAnswers || 'Không trả lời'}</span>
                    </p>
                    ${!isCorrect ? `<p class="correct-answer"><strong>Đáp Án Đúng:</strong> <span class="text-correct">${correctAns}</span></p>` : ''}
                </div>
            `;
            
            answerDiv.innerHTML = answerContent;
        }
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Add back button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn secondary';
    backBtn.innerText = 'Quay Lại Kết Quả';
    backBtn.addEventListener('click', hideAnswersView);
    answersContainer.appendChild(backBtn);
}

function hideAnswersView() {
    const scoreDisplay = document.getElementById('score-display');
    const actionsDiv = document.querySelector('.actions');
    const historySection = document.querySelector('h3');
    const historyList = document.getElementById('history-list');
    const answersContainer = document.getElementById('answers-container');
    
    scoreDisplay.style.display = 'block';
    actionsDiv.style.display = 'block';
    if (historySection) historySection.style.display = 'block';
    historyList.style.display = 'block';
    answersContainer.style.display = 'none';
}

// --- History Functions ---

function showHistorySection() {
    loginSection.classList.add('hidden');
    examSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    // Hide the current score circle if we are just viewing history
    document.getElementById('score-display').style.display = 'none'; 
    fetchHistory();
}

async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE}/score/user/${state.userId}`);
        const json = await response.json();

        historyList.innerHTML = '';
        
        if (json.code === 'success' && json.data.length > 0) {
            json.data.forEach(item => {
                const date = new Date(item.createdAt).toLocaleString();
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <span>${date}</span>
                    <strong>${item.score} / ${item.total}</strong>
                `;
                historyList.appendChild(div);
            });
        } else {
            historyList.innerHTML = '<p>Không tìm thấy lịch sử cho người dùng này.</p>';
        }
    } catch (error) {
        console.error(error);
        historyList.innerHTML = '<p>Lỗi tải lịch sử.</p>';
    }
}

// Helper
function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}