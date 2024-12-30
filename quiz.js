class Quiz {
    constructor() {
        this.questions = [];
        this.selectedQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        
        // Elements
        this.questionCountSelect = document.getElementById('question-count');
        this.startButton = document.getElementById('start-quiz');
        this.quizIntro = document.getElementById('quiz-intro');
        this.quizArea = document.getElementById('quiz-area');
        this.questionList = document.getElementById('question-list');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.questionNumber = document.getElementById('question-number');
        this.timerElement = document.getElementById('timer');
        this.nextButton = document.getElementById('next-btn');
        this.prevButton = document.getElementById('prev-btn');
        this.submitButton = document.getElementById('submit-btn');
        this.resultArea = document.getElementById('result-area');
        this.scoreSummary = document.getElementById('score-summary');
        this.detailedResults = document.getElementById('detailed-results');
        this.restartButton = document.getElementById('restart-quiz');
        this.restartButton.addEventListener('click', () => this.restartQuiz());
        this.questionStartTime = 0;
        this.questionDurations = [];
        
        // Tambahkan event listeners untuk tombol navigasi
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.prevButton.addEventListener('click', () => this.prevQuestion());
        this.submitButton.addEventListener('click', () => this.finishQuiz());
        
        this.userAnswers = [];
        
        this.initializeQuiz();
    }

    async initializeQuiz() {
        try {
            await this.loadQuestions();
            this.setupQuestionCountOptions();
            this.addEventListeners();
        } catch (error) {
            console.error('Error initializing quiz:', error);
        }
    }

    async loadQuestions() {
        try {
            const response = await fetch('SI.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Format data soal tidak valid');
            }
            
            this.questions = data.questions;
            console.log(`Berhasil memuat ${this.questions.length} soal`);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Gagal memuat soal: ' + error.message);
        }
    }

    setupQuestionCountOptions() {
        // Bersihkan opsi yang ada
        this.questionCountSelect.innerHTML = '';
        
        // Tentukan increment dan maksimum jumlah soal
        const totalQuestions = this.questions.length;
        const increments = [5, 10, 15, 20, 25, 30, 40, 50];
        
        // Tambahkan opsi berdasarkan jumlah soal yang tersedia
        increments.forEach(num => {
            if (num <= totalQuestions) {
                const option = document.createElement('option');
                option.value = num;
                option.textContent = `${num} Soal`;
                this.questionCountSelect.appendChild(option);
            }
        });

        // Jika jumlah soal tidak sesuai dengan increment, tambahkan sebagai opsi terakhir
        if (!increments.includes(totalQuestions)) {
            const option = document.createElement('option');
            option.value = totalQuestions;
            option.textContent = `${totalQuestions} Soal`;
            this.questionCountSelect.appendChild(option);
        }

        console.log(`Opsi jumlah soal telah diperbarui. Total soal tersedia: ${totalQuestions}`);
    }

    addEventListeners() {
        // Event listener untuk select box
        this.questionCountSelect.addEventListener('change', (e) => {
            console.log(`Jumlah soal dipilih: ${e.target.value}`);
        });

        // Event listener untuk tombol mulai
        this.startButton.addEventListener('click', () => {
            const selectedCount = parseInt(this.questionCountSelect.value);
            this.startQuiz(selectedCount);
        });
    }

    startQuiz(questionCount) {
        // Validasi jumlah soal
        if (!questionCount || questionCount <= 0) {
            alert('Silakan pilih jumlah soal terlebih dahulu');
            return;
        }

        // Acak dan pilih soal sesuai jumlah yang diminta
        this.selectedQuestions = this.shuffleQuestions(questionCount);
        this.currentQuestionIndex = 0;
        
        // Sembunyikan intro dan tampilkan area kuis
        this.quizIntro.style.display = 'none';
        this.quizArea.style.display = 'flex';

        // Setup navigasi soal di sidebar
        this.setupQuestionNavigation();
        
        // Set waktu 1 menit per soal
        this.timeLeft = questionCount * 60; // 60 detik per soal
        this.startTimer();
        
        // Tampilkan soal pertama
        this.displayQuestion();

        console.log('Kuis dimulai dengan', questionCount, 'soal');
    }

    shuffleQuestions(count) {
        // Acak soal dan ambil sejumlah yang diminta
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    setupQuestionNavigation() {
        this.questionList.innerHTML = '';
        this.selectedQuestions.forEach((_, index) => {
            const button = document.createElement('button');
            button.className = 'question-nav-item';
            button.textContent = `Soal ${index + 1}`;
            button.addEventListener('click', () => this.jumpToQuestion(index));
            this.questionList.appendChild(button);
        });
    }

    displayQuestion() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        this.questionNumber.textContent = `Soal ${this.currentQuestionIndex + 1}`;
        this.questionText.textContent = question.question;
        
        // Tampilkan opsi jawaban
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option;
            button.addEventListener('click', () => this.selectAnswer(index));
            this.optionsContainer.appendChild(button);
        });

        // Update status tombol navigasi
        this.updateNavigationButtons();
        
        // Update navigasi sidebar
        this.updateQuestionNavigation();
        this.questionStartTime = Date.now();
    }

    updateQuestionNavigation() {
        const navButtons = this.questionList.getElementsByClassName('question-nav-item');
        Array.from(navButtons).forEach((button, index) => {
            button.classList.toggle('active', index === this.currentQuestionIndex);
        });
    }

    jumpToQuestion(index) {
        if (index >= 0 && index < this.selectedQuestions.length) {
            this.currentQuestionIndex = index;
            this.displayQuestion();
        }
    }

    selectAnswer(optionIndex) {
        const duration = (Date.now() - this.questionStartTime) / 1000;
        this.questionDurations[this.currentQuestionIndex] = duration;
        
        // Simpan jawaban user
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        // Update tampilan tombol
        const buttons = this.optionsContainer.getElementsByClassName('option-button');
        Array.from(buttons).forEach((button, index) => {
            button.classList.toggle('selected', index === optionIndex);
        });

        // Update status soal di sidebar
        this.updateQuestionStatus(this.currentQuestionIndex, true);
    }

    updateQuestionStatus(index, answered) {
        const navButtons = this.questionList.getElementsByClassName('question-nav-item');
        if (answered) {
            navButtons[index].classList.add('answered');
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.endQuiz();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Warna merah jika waktu < 20% tersisa
        if (this.timeLeft < (this.selectedQuestions.length * 60 * 0.2)) {
            this.timerElement.style.color = '#dc3545';
        }
    }

    endQuiz() {
        clearInterval(this.timer);
        // Implementasi logika ketika waktu habis
        alert('Waktu telah habis!');
        this.showResults();
    }

    showResults() {
        // Sembunyikan area kuis
        this.quizArea.style.display = 'none';
        
        // Tampilkan area hasil
        this.resultArea.style.display = 'block';
        
        // Hitung dan tampilkan skor
        const totalQuestions = this.selectedQuestions.length;
        const percentage = (this.score / totalQuestions) * 100;
        
        this.scoreSummary.innerHTML = `
            <h3>Ringkasan Hasil</h3>
            <p>Jawaban Benar: ${this.score} dari ${totalQuestions}</p>
            <p>Nilai: ${percentage.toFixed(2)}%</p>
        `;

        // Tampilkan detail jawaban
        this.detailedResults.innerHTML = '<h3>Detail Jawaban</h3>';
        this.selectedQuestions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index] !== undefined ? 
                question.options[this.userAnswers[index]] : 'Tidak dijawab';
            const isCorrect = userAnswer === question.correct;
            
            this.detailedResults.innerHTML += `
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <p><strong>Soal ${index + 1}:</strong> ${question.question}</p>
                    <p>Jawaban Anda: ${userAnswer}</p>
                    <p>Jawaban Benar: ${question.correct}</p>
                </div>
            `;
        });

        // Tambahkan section untuk durasi dan grafik
        this.detailedResults.innerHTML += `
            <div class="duration-section">
                <h3>Durasi Pengerjaan per Soal</h3>
                <div class="duration-chart">
                    <canvas id="durationChart"></canvas>
                </div>
                <div class="duration-list">
                    ${this.questionDurations.map((duration, index) => `
                        <div class="duration-item">
                            <span>Soal ${index + 1}:</span>
                            <span>${duration.toFixed(1)} detik</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Buat grafik menggunakan Chart.js
        this.createDurationChart();
    }

    createDurationChart() {
        const ctx = document.getElementById('durationChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.questionDurations.map((_, i) => `Soal ${i + 1}`),
                datasets: [{
                    label: 'Durasi (detik)',
                    data: this.questionDurations,
                    backgroundColor: '#4A90E2',
                    borderColor: '#357ABD',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Waktu (detik)'
                        }
                    }
                }
            }
        });
    }

    // Tambahkan method untuk membersihkan timer saat quiz selesai
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    updateNavigationButtons() {
        // Tampilkan/sembunyikan tombol Sebelumnya
        this.prevButton.style.display = this.currentQuestionIndex > 0 ? 'inline-block' : 'none';
        
        // Tampilkan/sembunyikan tombol Selanjutnya dan Selesai
        if (this.currentQuestionIndex === this.selectedQuestions.length - 1) {
            this.nextButton.style.display = 'none';
            this.submitButton.style.display = 'inline-block';
        } else {
            this.nextButton.style.display = 'inline-block';
            this.submitButton.style.display = 'none';
        }
    }

    finishQuiz() {
        clearInterval(this.timer);
        this.calculateScore();
        this.showResults();
    }

    calculateScore() {
        this.score = 0;
        this.userAnswers.forEach((answer, index) => {
            const question = this.selectedQuestions[index];
            if (answer !== undefined && question.options[answer] === question.correct) {
                this.score++;
            }
        });
    }

    restartQuiz() {
        // Reset semua state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.timeLeft = 0;
        this.questionDurations = [];
        
        // Reset tampilan
        this.resultArea.style.display = 'none';
        this.quizArea.style.display = 'none';
        this.quizIntro.style.display = 'block';
        
        // Reset timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// Inisialisasi quiz
document.addEventListener('DOMContentLoaded', () => {
    const quiz = new Quiz();
});