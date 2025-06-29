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

    // Test selection UI
    const selectDiv = document.createElement('div');
    selectDiv.className = 'test-select-container';
    tests.forEach((test, idx) => {
        const btn = document.createElement('button');
        btn.className = 'test-btn';
        btn.innerHTML = `<span class="test-btn-icon">📝</span>Test ${idx + 1}`;
        btn.onclick = () => startTest(idx);
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

                    // Highlight the selected option
                    radios.forEach(r => {
                        const li = r.closest('li');
                        if (li) li.classList.remove('selected');
                    });
                    const selectedLi = radio.closest('li');
                    if (selectedLi) selectedLi.classList.add('selected');

                    answers[idx] = radio.value;
                    // Show correct answer
                    const correctAns = q['Correct Answer'].toUpperCase();
                    let userAns = radio.value.toUpperCase();
                    if (userAns === correctAns) {
                        showAnswerDiv.style.color = 'green';
                        showAnswerDiv.innerHTML = `Correct! The answer is <b>${correctAns}</b>.`;
                    } else {
                        showAnswerDiv.style.color = 'red';
                        showAnswerDiv.innerHTML = `Incorrect. The correct answer is <b>${correctAns}</b>.`;
                    }
                    showAnswerDiv.style.display = 'block';
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
            // Show results
            container.innerHTML = `
                <div class="question-block" style="text-align:center;">
                    <h2>Test Complete</h2>
                    <div style="font-size:1.3em;margin:12px 0;">Score: <strong>${score}/100</strong></div>
                    <div style="font-size:1.1em;color:${passed ? 'green' : 'red'};">
                        ${passed ? 'PASS' : 'FAIL'} (Pass mark: 75)
                    </div>
                    <div style="margin:18px 0;">
                        <button class="fancy-btn" onclick="location.reload()">Return to Test Selection</button>
                    </div>
                </div>
            `;
            // Optionally, show correct answers and explanations
            for (let i = 0; i < testQuestions.length; i++) {
                const q = testQuestions[i];
                const userAns = answers[i] || 'No Answer';
                const isCorrect = userAns.toUpperCase() === q['Correct Answer'].toUpperCase();
                const block = document.createElement('div');
                block.className = 'question-block';
                block.style.background = isCorrect ? '#e8ffe8' : '#ffe8e8';
                block.innerHTML = `
                    <div class="question-title">${i + 1}. ${q['Question']}</div>
                    <div><strong>Your Answer:</strong> ${userAns}</div>
                    <div><strong>Correct Answer:</strong> ${q['Correct Answer']}</div>
                    <div><strong>Explanation:</strong> ${q['Explanation']}</div>
                    <div style="color:#aaa;font-size:0.85em;">
                        <strong>Domain:</strong> ${q['Domain']} | <strong>Competency:</strong> ${q['Competency']}
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
