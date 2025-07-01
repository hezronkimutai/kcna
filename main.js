// Automatically load and display quiz.csv if present
fetch('quiz.csv')
    .then(response => response.text())
    .then(csvText => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                renderQuiz(results.data);
            }
        });
    });

// Test engine: splits questions into tests of 60, timed, scored
function renderQuiz(questions) {
    const container = document.getElementById('table-container');
    container.innerHTML = '';
    const tests = [];
    for (let i = 0; i < questions.length; i += 60) {
        tests.push(questions.slice(i, i + 60));
    }

    // Test selection UI with enhanced design
    const selectDiv = document.createElement('div');
    selectDiv.className = 'test-select-container';
    
    // Add a header for the test selection
    const headerDiv = document.createElement('div');
    headerDiv.className = 'test-select-label';
    headerDiv.innerHTML = '<i class="fas fa-graduation-cap"></i>Choose Your Practice Test<i class="fas fa-rocket"></i>';
    selectDiv.appendChild(headerDiv);
    
    // Create enhanced test buttons
    tests.forEach((test, idx) => {
        const btn = document.createElement('button');
        btn.className = 'test-btn';
        
        // Add different icons for variety
        const icons = ['🎯', '🚀', '⚡', '🔥', '💎', '🌟', '⭐', '💫'];
        const icon = icons[idx % icons.length];
        
        // Calculate questions count
        const questionCount = test.length;
        
        btn.innerHTML = `
            <div class="test-btn-icon">${icon}</div>
            <div class="test-btn-label">Practice Test ${idx + 1}</div>
            <div class="test-btn-subtitle">${questionCount} Questions • 90 Minutes</div>
        `;
        
        // Add a subtle pulse animation on load
        setTimeout(() => {
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 3000);
        }, idx * 500);
        
        btn.onclick = () => {
            startTest(idx);
        };
        
        selectDiv.appendChild(btn);
    });
    container.appendChild(selectDiv);

    // Timer and test state
    let timerInterval = null;
    let timeLeft = 90 * 60; // 90 minutes in seconds

    function startTest(testIdx) {
        container.innerHTML = '';
        const testQuestions = tests[testIdx];
        const answers = Array(testQuestions.length).fill(null);

        // Score UI (fixed)
        let scoreDiv = document.getElementById('score-bar');
        if (!scoreDiv) {
            scoreDiv = document.createElement('div');
            scoreDiv.id = 'score-bar';
            document.body.prepend(scoreDiv);
        }
        // Spacer to prevent content from hiding under fixed bar
        const spacer = document.createElement('div');
        spacer.className = 'score-bar-spacer';
        container.appendChild(spacer);

        // Timer UI
        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer-fancy';
        scoreDiv.appendChild(timerDiv);

        function updateScoreBar() {
            let correct = 0;
            for (let i = 0; i < testQuestions.length; i++) {
                if (answers[i] && answers[i].toUpperCase() === testQuestions[i]['Correct Answer'].toUpperCase()) {
                    correct++;
                }
            }
            // Only update the score numbers
            let scoreValue = scoreDiv.querySelector('#score-value');
            if (scoreValue) scoreValue.innerHTML = `<strong>${correct}</strong> / ${testQuestions.length}`;
        }

        function updateTimer() {
            const min = Math.floor(timeLeft / 60);
            const sec = timeLeft % 60;
            timerDiv.innerHTML = `<span>${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}</span>`;
        }
        updateScoreBar();
        updateTimer();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitTest();
            }
        }, 1000);

        // Questions UI
        testQuestions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = 'question-block';
            block.innerHTML = `
                <div class="question-title">${idx + 1}. ${q['Question']}</div>
                <ul class="options-list">
                    <li><label><input type="radio" name="q${idx}" value="A"> A. ${q['Option A']}</label></li>
                    <li><label><input type="radio" name="q${idx}" value="B"> B. ${q['Option B']}</label></li>
                    <li><label><input type="radio" name="q${idx}" value="C"> C. ${q['Option C']}</label></li>
                    <li><label><input type="radio" name="q${idx}" value="D"> D. ${q['Option D']}</label></li>
                    ${q['Option E'] ? `<li><label><input type="radio" name="q${idx}" value="E"> E. ${q['Option E']}</label></li>` : ''}
                </ul>
                <div class="show-answer" style="display:none;margin-top:10px;font-weight:bold;"></div>
            `;
            container.appendChild(block);

            // Add event listeners to radio buttons for live feedback and scoring
            const radios = block.querySelectorAll('input[type="radio"]');
            const showAnswerDiv = block.querySelector('.show-answer');
            radios.forEach(radio => {
                radio.addEventListener('change', function () {
                    // Prevent changing answer after selection
                    radios.forEach(r => r.disabled = true);
                    
                    // Add answered class to question block
                    block.classList.add('answered');

                    // Highlight the selected option with enhanced animation
                    radios.forEach(r => {
                        const li = r.closest('li');
                        if (li) li.classList.remove('selected');
                    });
                    const selectedLi = radio.closest('li');
                    if (selectedLi) {
                        selectedLi.classList.add('selected');
                        selectedLi.style.animation = 'selectedPulse 0.6s ease';
                    }

                    answers[idx] = radio.value;
                    
                    // Show correct answer with enhanced feedback
                    const correctAns = q['Correct Answer'].toUpperCase();
                    let userAns = radio.value.toUpperCase();
                    const isCorrect = userAns === correctAns;
                    
                    if (isCorrect) {
                        showAnswerDiv.style.cssText = `
                            color: #00ff88; 
                            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05));
                            padding: 15px;
                            border-radius: 10px;
                            border-left: 4px solid #00ff88;
                            margin-top: 15px;
                            animation: correctAnswer 0.8s ease;
                        `;
                        showAnswerDiv.innerHTML = `✅ ${getRandomFeedback(true)}<br><b>Answer: ${correctAns}</b>`;
                    } else {
                        showAnswerDiv.style.cssText = `
                            color: #ff6b6b; 
                            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05));
                            padding: 15px;
                            border-radius: 10px;
                            border-left: 4px solid #ff6b6b;
                            margin-top: 15px;
                            animation: incorrectAnswer 0.8s ease;
                        `;
                        showAnswerDiv.innerHTML = `❌ ${getRandomFeedback(false)}<br><b>Correct Answer: ${correctAns}</b>`;
                    }
                    showAnswerDiv.style.display = 'block';
                    
                    // Update progress and score
                    const answeredCount = answers.filter(a => a !== null).length;
                    quizUX.updateProgress(answeredCount, testQuestions.length);
                    updateScoreBar();
                });
            });
        });

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Test';
        submitBtn.className = 'fancy-btn';
        submitBtn.style.margin = '24px auto';
        submitBtn.onclick = submitTest;
        container.appendChild(submitBtn);

        function submitTest() {
            clearInterval(timerInterval);
            
            // Collect answers
            for (let i = 0; i < testQuestions.length; i++) {
                const radios = document.getElementsByName(`q${i}`);
                for (const radio of radios) {
                    if (radio.checked) {
                        answers[i] = radio.value;
                        break;
                    }
                }
            }
            
            // Score calculation
            let correct = 0;
            for (let i = 0; i < testQuestions.length; i++) {
                if (answers[i] && answers[i].toUpperCase() === testQuestions[i]['Correct Answer'].toUpperCase()) {
                    correct++;
                }
            }
            
            const score = Math.round((correct / testQuestions.length) * 100);
            const passed = score >= 75;
            
            // Show confetti for pass (visual only)
            if (passed) {
                setTimeout(() => quizUX.createConfetti(), 500);
            }
            
            // Hide progress indicator
            if (quizUX.progressCircle) {
                quizUX.progressCircle.style.display = 'none';
            }
            
            // Show enhanced results
            container.innerHTML = `
                <div class="question-block" style="
                    text-align: center; 
                    background: linear-gradient(135deg, ${passed ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)'} 0%, rgba(255,255,255,0.1) 100%);
                    border: 2px solid ${passed ? '#00ff88' : '#ff6b6b'};
                    animation: resultReveal 1s ease;
                ">
                    <h2 style="margin-bottom: 30px; font-size: 2.5em;">
                        ${passed ? '🎉 Test Complete! 🎉' : '📚 Test Complete 📚'}
                    </h2>
                    <div style="font-size: 3em; margin: 20px 0; font-weight: bold; color: ${passed ? '#00ff88' : '#ff6b6b'};">
                        ${score}%
                    </div>
                    <div style="font-size: 1.5em; margin: 20px 0; color: ${passed ? '#00ff88' : '#ff6b6b'}; font-weight: bold;">
                        ${passed ? '✅ CONGRATULATIONS! YOU PASSED!' : '❌ KEEP STUDYING! TRY AGAIN!'}
                    </div>
                    <div style="font-size: 1.1em; margin: 15px 0; color: #ccc;">
                        Pass mark: 75% | Questions correct: ${correct}/${testQuestions.length}
                    </div>
                    <div style="margin: 30px 0;">
                        <button class="fancy-btn" onclick="location.reload()" style="margin: 10px; padding: 20px 40px; font-size: 1.2em;">
                            🔄 Take Another Test
                        </button>
                    </div>
                    ${passed ? '<div style="margin-top: 20px; font-size: 1.1em; color: #00eaff;">You\'re ready for the KCNA exam! 🚀</div>' : '<div style="margin-top: 20px; font-size: 1.1em; color: #ff6b6b;">Review the explanations below and try again! 💪</div>'}
                </div>
            `;
            
            // Show detailed results with enhanced styling
            for (let i = 0; i < testQuestions.length; i++) {
                const q = testQuestions[i];
                const userAns = answers[i] || 'No Answer';
                const isCorrect = userAns.toUpperCase() === q['Correct Answer'].toUpperCase();
                const block = document.createElement('div');
                block.className = 'question-block';
                block.style.cssText = `
                    background: linear-gradient(135deg, ${isCorrect ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)'} 0%, rgba(255,255,255,0.05) 100%);
                    border-left: 5px solid ${isCorrect ? '#00ff88' : '#ff6b6b'};
                    animation: fadeInUp 0.8s ease ${i * 0.1}s both;
                `;
                block.innerHTML = `
                    <div class="question-title" style="color: ${isCorrect ? '#00ff88' : '#ff6b6b'};">
                        ${isCorrect ? '✅' : '❌'} ${i + 1}. ${q['Question']}
                    </div>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <div style="margin: 8px 0;"><strong>Your Answer:</strong> <span style="color: ${isCorrect ? '#00ff88' : '#ff6b6b'};">${userAns}</span></div>
                        <div style="margin: 8px 0;"><strong>Correct Answer:</strong> <span style="color: #00ff88;">${q['Correct Answer']}</span></div>
                    </div>
                    ${q['Explanation'] ? `<div style="margin: 15px 0; padding: 15px; background: rgba(0, 234, 255, 0.1); border-radius: 10px; border-left: 3px solid #00eaff;"><strong>💡 Explanation:</strong> ${q['Explanation']}</div>` : ''}
                    <div style="color: #aaa; font-size: 0.9em; margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 5px;">
                        <strong>📋 Domain:</strong> ${q['Domain']} | <strong>🎯 Competency:</strong> ${q['Competency']}
                    </div>
                `;
                container.appendChild(block);
            }
        }
    }
}

document.getElementById('upload')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
        const headers = rows[0].map(h => h.trim().replace(/"/g, ''));
        let html = '';

        // Find indices for extra fields
        const idxAnswer = headers.findIndex(h => h.toLowerCase().includes('correct answer'));
        const idxExplanation = headers.findIndex(h => h.toLowerCase().includes('explanation'));
        const idxDomain = headers.findIndex(h => h.toLowerCase().includes('domain'));
        const idxCompetency = headers.findIndex(h => h.toLowerCase().includes('competency'));

        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length === headers.length) {
                const cells = rows[i].map(cell => cell.trim().replace(/"/g, ''));
                html += `<div class="question-block">`;
                html += `<div class="question-title">Q${i}: ${cells[0]}</div>`;
                html += `<ol class="options-list" type="A">`;
                for (let j = 1; j < cells.length; j++) {
                    // Stop at empty cell or if header is one of the extra fields
                    if (!cells[j] || [idxAnswer, idxExplanation, idxDomain, idxCompetency].includes(j)) break;
                    html += `<li>${cells[j]}</li>`;
                }
                html += `</ol>`;
                if (idxAnswer !== -1 && cells[idxAnswer]) {
                    html += `<div><strong>Correct Answer:</strong> ${cells[idxAnswer]}</div>`;
                }
                if (idxExplanation !== -1 && cells[idxExplanation]) {
                    html += `<div><strong>Explanation:</strong> ${cells[idxExplanation]}</div>`;
                }
                if (idxDomain !== -1 && cells[idxDomain]) {
                    html += `<div><strong>Domain:</strong> ${cells[idxDomain]}</div>`;
                }
                if (idxCompetency !== -1 && cells[idxCompetency]) {
                    html += `<div><strong>Competency:</strong> ${cells[idxCompetency]}</div>`;
                }
                html += `</div>`;
            }
        }

        document.getElementById('table-container').innerHTML = html;
    };
    reader.readAsText(file);
});

// Enhanced UX Features - Visual Only
class QuizUX {
    constructor() {
        this.progressCircle = null;
        this.confettiActive = false;
        this.addProgressIndicator();
        this.addKeyboardShortcuts();
    }

    addProgressIndicator() {
        const progressContainer = document.createElement('div');
        progressContainer.innerHTML = `
            <div id="progress-container" style="position: fixed; top: 80px; right: 32px; z-index: 1999;">
                <div id="progress-circle" style="
                    width: 60px; 
                    height: 60px; 
                    border-radius: 50%; 
                    background: conic-gradient(#00eaff 0deg, transparent 0deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    color: white;
                    border: 2px solid rgba(0, 234, 255, 0.3);
                    backdrop-filter: blur(10px);
                    display: none;
                ">0%</div>
            </div>
        `;
        document.body.appendChild(progressContainer);
        this.progressCircle = document.getElementById('progress-circle');
    }

    updateProgress(current, total) {
        if (!this.progressCircle) return;
        
        const percentage = Math.round((current / total) * 100);
        const degrees = (percentage / 100) * 360;
        
        this.progressCircle.style.background = `conic-gradient(#00eaff ${degrees}deg, transparent ${degrees}deg)`;
        this.progressCircle.textContent = `${percentage}%`;
        this.progressCircle.style.display = 'flex';
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys 1-5 for selecting options
            if (e.key >= '1' && e.key <= '5') {
                const activeQuestion = document.querySelector('.question-block:not(.answered)');
                if (activeQuestion) {
                    const options = activeQuestion.querySelectorAll('input[type="radio"]');
                    const index = parseInt(e.key) - 1;
                    if (options[index] && !options[index].disabled) {
                        options[index].click();
                    }
                }
            }
            
            // Space or Enter to submit
            if (e.key === ' ' || e.key === 'Enter') {
                const submitBtn = document.querySelector('.fancy-btn');
                if (submitBtn && submitBtn.textContent.includes('Submit')) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 234, 255, 0.9), rgba(0, 114, 255, 0.9));
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-family: 'Montserrat', Arial, sans-serif;
            font-weight: 700;
            z-index: 10000;
            backdrop-filter: blur(15px);
            box-shadow: 0 10px 30px rgba(0, 234, 255, 0.3);
            animation: notificationSlide 0.5s ease-out;
        `;
        notification.textContent = message;
        
        // Add keyframe animation
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlide {
                    from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'notificationSlide 0.5s ease-in reverse';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    createConfetti() {
        if (this.confettiActive) return;
        this.confettiActive = true;
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${['#00eaff', '#0072ff', '#00c6fb', '#fff'][Math.floor(Math.random() * 4)]};
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    z-index: 9999;
                    border-radius: 50%;
                    animation: confettiFall ${2 + Math.random() * 3}s ease-in forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 5000);
            }, i * 100);
        }
        
        // Add confetti animation
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => { this.confettiActive = false; }, 3000);
    }

    addLoadingAnimation() {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            animation: fadeOut 1s ease 2s forwards;
        `;
        
        loader.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    width: 80px;
                    height: 80px;
                    border: 4px solid rgba(0, 234, 255, 0.3);
                    border-top: 4px solid #00eaff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <h2 style="color: #00eaff; font-family: 'Montserrat', Arial, sans-serif; margin: 0;">
                    Loading KCNA Quiz...
                </h2>
            </div>
        `;
        
        // Add animations
        if (!document.getElementById('loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes fadeOut {
                    to { opacity: 0; pointer-events: none; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loader);
    }
}

// Initialize UX enhancements
const quizUX = new QuizUX();
quizUX.addLoadingAnimation();

// Enhanced feedback messages
const feedbackMessages = {
    correct: [
        "🎉 Excellent! You got it right!",
        "✨ Perfect! Well done!",
        "🔥 Outstanding! Keep it up!",
        "⭐ Brilliant! You're on fire!",
        "🎯 Spot on! Great job!"
    ],
    incorrect: [
        "💭 Not quite, but you're learning!",
        "🤔 Good try! Review and try again.",
        "📚 Close! Check the explanation below.",
        "🎯 Keep practicing! You'll get it next time.",
        "💪 Don't give up! Learning is a process."
    ]
};

function getRandomFeedback(isCorrect) {
    const messages = isCorrect ? feedbackMessages.correct : feedbackMessages.incorrect;
    return messages[Math.floor(Math.random() * messages.length)];
}
