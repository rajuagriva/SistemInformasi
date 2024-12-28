class Quiz {  
    constructor(questions) {  
        this.questions = questions;  
        this.currentQuestionIndex = 0;  
        this.selectedAnswers = new Array(questions.length).fill(null);  
        
        // Elemen DOM  
        this.questionNumberElement = document.getElementById('question-number');  
        this.questionTextElement = document.getElementById('question-text');  
        this.optionsContainer = document.getElementById('options-container');  
        this.prevBtn = document.getElementById('prev-btn');  
        this.nextBtn = document.getElementById('next-btn');  
        this.submitBtn = document.getElementById('submit-btn');  
        this.timerElement = document.getElementById('timer');  
        this.quizArea = document.getElementById('quiz-area');  
        this.resultArea = document.getElementById('result-area');  
        this.scoreSummary = document.getElementById('score-summary');  
        this.detailedResults = document.getElementById('detailed-results');  

        this.timeLimit = questions.length * 60; // 1 menit per soal  
        this.timeRemaining = this.timeLimit;  
        this.timer = null;  

        // Pelacakan waktu per soal  
        this.questionTimings = questions.map(() => ({  
            startTime: null,  
            endTime: null,  
            interactions: []  
        }));  

        this.bindEvents();  
    }  

    bindEvents() {  
        this.nextBtn.addEventListener('click', () => this.nextQuestion());  
        this.prevBtn.addEventListener('click', () => this.previousQuestion());  
        this.submitBtn.addEventListener('click', () => this.submitQuiz());  
    }  

    start() {  
        // Reset tampilan  
        this.quizArea.style.display = 'block';  
        this.resultArea.style.display = 'none';  

        // Mulai dari pertanyaan pertama  
        this.currentQuestionIndex = 0;  
        this.displayQuestion();  
        this.startTimer();  
    }  

    displayQuestion() {  
        const currentQuestion = this.questions[this.currentQuestionIndex];  
        
        // Catat waktu mulai untuk soal saat ini  
        const currentTiming = this.questionTimings[this.currentQuestionIndex];  
        currentTiming.startTime = new Date();  
        currentTiming.interactions.push({  
            type: 'display',  
            timestamp: new Date()  
        });  

        // Update nomor soal  
        this.questionNumberElement.textContent = `Soal ${this.currentQuestionIndex + 1} dari ${this.questions.length}`;  
        
        // Update teks soal  
        this.questionTextElement.textContent = currentQuestion.question;  
        
        // Bersihkan opsi sebelumnya  
        this.optionsContainer.innerHTML = '';  
        
        // Tampilkan opsi jawaban  
        currentQuestion.options.forEach(option => {  
            const optionButton = document.createElement('button');  
            optionButton.textContent = option;  
            optionButton.classList.add('option-btn');  
            optionButton.addEventListener('click', () => this.selectOption(option));  
            
            // Tandai jawaban yang sudah dipilih sebelumnya  
            if (this.selectedAnswers[this.currentQuestionIndex] === option) {  
                optionButton.classList.add('selected');  
            }  
            
            this.optionsContainer.appendChild(optionButton);  
        });  

        this.updateNavigationButtons();  
    }  

    selectOption(option) {  
        const currentTiming = this.questionTimings[this.currentQuestionIndex];  
        
        // Catat interaksi pemilihan  
        currentTiming.interactions.push({  
            type: 'select',  
            option: option,  
            timestamp: new Date()  
        });  

        // Hapus seleksi sebelumnya  
        this.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {  
            btn.classList.remove('selected');  
        });  

        // Pilih opsi baru  
        event.target.classList.add('selected');  
        this.selectedAnswers[this.currentQuestionIndex] = option;  
    }  

    nextQuestion() {  
        const currentTiming = this.questionTimings[this.currentQuestionIndex];  
        
        // Catat transisi  
        currentTiming.interactions.push({  
            type: 'next',  
            timestamp: new Date()  
        });  
        currentTiming.endTime = new Date();  

        if (this.currentQuestionIndex < this.questions.length - 1) {  
            this.currentQuestionIndex++;  
            this.displayQuestion();  
        }  
    }  

    previousQuestion() {  
        const currentTiming = this.questionTimings[this.currentQuestionIndex];  
        
        // Catat transisi  
        currentTiming.interactions.push({  
            type: 'previous',  
            timestamp: new Date()  
        });  
        currentTiming.endTime = new Date();  

        if (this.currentQuestionIndex > 0) {  
            this.currentQuestionIndex--;  
            this.displayQuestion();  
        }  
    }  

    updateNavigationButtons() {  
        this.prevBtn.style.display = this.currentQuestionIndex > 0 ? 'block' : 'none';  
        this.nextBtn.style.display = this.currentQuestionIndex < this.questions.length - 1 ? 'block' : 'none';  
        this.submitBtn.style.display = this.currentQuestionIndex === this.questions.length - 1 ? 'block' : 'none';  
    }  

    startTimer() {  
        this.timer = setInterval(() => {  
            this.timeRemaining--;  
            
            const minutes = Math.floor(this.timeRemaining / 60);  
            const seconds = this.timeRemaining % 60;  
            
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;  

            if (this.timeRemaining <= 0) {  
                this.submitQuiz();  
            }  
        }, 1000);  
    }  

    submitQuiz() {  
        // Hentikan timer  
        clearInterval(this.timer);  
        
        // Sembunyikan area kuis  
        this.quizArea.style.display = 'none';  
        
        // Tampilkan area hasil  
        this.resultArea.style.display = 'block';  

        // Hitung jawaban benar  
        let correctAnswers = 0;  
        const resultDetails = this.questions.map((question, index) => {  
            const userAnswer = this.selectedAnswers[index];  
            const isCorrect = userAnswer === question.correct;  
            
            if (isCorrect) correctAnswers++;  

            return `  
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">  
                    <strong>Soal ${index + 1}:</strong> ${question.question}<br>  
                    Jawaban Anda: ${userAnswer || 'Tidak dijawab'}<br>  
                    Jawaban Benar: ${question.correct}<br>  
                    Status: ${isCorrect ? '✅ Benar' : '❌ Salah'}  
                </div>  
            `;  
        });  

        // Hitung skor  
        const scorePercentage = ((correctAnswers / this.questions.length) * 100).toFixed(2);  
        const isPassed = scorePercentage >= 70;  

        // Tampilkan ringkasan skor  
        this.scoreSummary.innerHTML = `  
            <p>Total Soal: ${this.questions.length}</p>  
            <p>Jawaban Benar: ${correctAnswers}</p>  
            <p>Skor: ${scorePercentage}%</p>  
            <p>Status: ${isPassed ? 'LULUS 🎉' : 'TIDAK LULUS 😔'}</p>  
        `;  

        // Tampilkan detail hasil  
        this.detailedResults.innerHTML = resultDetails.join('');  

        // Analisis waktu per soal  
        this.analyzeQuestionTimes();  
    }  

    analyzeQuestionTimes() {  
        const timeAnalysis = this.questionTimings.map((timing, index) => {  
            const totalTime = timing.endTime && timing.startTime   
                ? (timing.endTime - timing.startTime) / 1000   
                : 0;  

            return {  
                questionNumber: index + 1,  
                time: totalTime,  
                interactions: timing.interactions.map(i => i.type)  
            };  
        });  

        // Tambahkan analisis waktu ke hasil  
        const timeAnalysisSection = document.createElement('div');  
        timeAnalysisSection.classList.add('time-analysis');  
        timeAnalysisSection.innerHTML = `  
            <h3>Analisis Waktu Pengerjaan Soal</h3>  
            ${timeAnalysis.map(analysis => `  
                <div class="time-item">  
                    Soal ${analysis.questionNumber}:   
                    ${analysis.time.toFixed(2)} detik   
                    (Interaksi: ${analysis.interactions.join(', ')})  
                </div>  
            `).join('')}  
        `;  

        this.detailedResults.appendChild(timeAnalysisSection);  
    }  
}  

class QuizApp {  
    constructor() {  
        this.questions = [];  
        this.currentQuiz = null;  
        
        // Elemen DOM  
        this.startButton = document.getElementById('start-quiz');  
        this.quizIntro = document.getElementById('quiz-intro');  
        this.quizArea = document.getElementById('quiz-area');  
        this.questionCountSelect = document.getElementById('question-count');  
        
        this.initializeEventListeners();  
    }  

    initializeEventListeners() {  
        this.startButton.addEventListener('click', () => this.startQuiz());  
        document.getElementById('restart-quiz').addEventListener('click', () => this.restartQuiz());  
    }  

    async loadQuestions() {  
        try {  
            const response = await fetch('SI.json');  
            const data = await response.json();  

            if (!data.questions || data.questions.length === 0) {  
                throw new Error('Tidak ada pertanyaan yang ditemukan');  
            }  

            this.questions = data.questions;  
        } catch (error) {  
            console.error('Error memuat soal:', error);  
            alert('Gagal memuat soal. Silakan coba lagi.');  
        }  
    }  

    startQuiz() {  
        const questionCount = parseInt(this.questionCountSelect.value);  
        
        if (questionCount > this.questions.length) {  
            alert(`Jumlah soal melebihi total soal (${this.questions.length})`);  
            return;  
        }  

        const selectedQuestions = this.shuffleQuestions(this.questions, questionCount);  

        this.quizIntro.style.display = 'none';  
        this.quizArea.style.display = 'block';  
        
        this.currentQuiz = new Quiz(selectedQuestions);  
        this.currentQuiz.start();  
    }  

    restartQuiz() {  
        location.reload();  
    }  

    shuffleQuestions(questions, count) {  
        let shuffled = [...questions];  
        for (let i = shuffled.length - 1; i > 0; i--) {  
            const j = Math.floor(Math.random() * (i + 1));  
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];  
        }  
        return shuffled.slice(0, count);  
    }  
}  

// Inisialisasi Aplikasi  
document.addEventListener('DOMContentLoaded', async () => {  
    const quizApp = new QuizApp();  
    await quizApp.loadQuestions();  
});