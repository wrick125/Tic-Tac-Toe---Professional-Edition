// Select all box elements in the grid
let boxes = document.querySelectorAll(".box");

// Game state variables
let turn = "X";
let isGameOver = false;
let gameMode = "human"; // human, easy, hard
let scores = { x: 0, o: 0, draw: 0 };
let gameStats = {
    gamesPlayed: 0,
    currentStreak: 0,
    bestStreak: 0,
    streakPlayer: null,
    totalMoves: 0,
    wins: { x: 0, o: 0 }
};

// Audio elements
let audioTurn = new Audio("ting.mp3");
let music = new Audio("music.mp3");
let gameOver = new Audio("gameover.mp3");

// Initialize music settings
music.loop = true;
music.volume = 0.05;
let isMuted = true;

// Winning combinations
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Initialize game
initializeGame();

function initializeGame() {
    createParticles();
    loadGameData();
    updateDisplay();
    updateStats();
    resetGame();
    
    // Event listeners
    setupEventListeners();
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyPress);
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

function setupEventListeners() {
    // Box click events
    boxes.forEach((box, index) => {
        box.innerHTML = "";
        box.addEventListener("click", () => handleBoxClick(box, index));
    });

    // Button events
    document.querySelector("#play-again").addEventListener("click", playAgain);
    document.querySelector("#reset-game").addEventListener("click", resetGame);
    document.querySelector("#clear-scores").addEventListener("click", clearScores);
    document.querySelector("#mute-unmute").addEventListener("click", toggleMute);
    document.querySelector("#difficulty").addEventListener("change", changeDifficulty);
}

function handleKeyPress(e) {
    if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (boxes[index] && boxes[index].innerHTML === "" && !isGameOver) {
            handleBoxClick(boxes[index], index);
        }
    } else if (e.key === 'r' || e.key === 'R') {
        resetGame();
    } else if (e.key === ' ') {
        e.preventDefault();
        playAgain();
    }
}

function handleBoxClick(box, index) {
    if (!isGameOver && box.innerHTML === "") {
        makeMove(box, index, turn);
        
        if (!isGameOver && gameMode !== "human" && turn === "O") {
            setTimeout(() => {
                aiMove();
            }, 500);
        }
    }
}

function makeMove(box, index, player) {
    if (!isMuted) audioTurn.play();
    box.innerHTML = player;
    box.classList.add('filled');
    
    // Add symbol animation
    animateSymbol(box, player);
    
    gameStats.totalMoves++;
    
    if (checkWin()) {
        handleWin();
    } else if (checkDraw()) {
        handleDraw();
    } else {
        changeTurn();
    }
}

function animateSymbol(box, player) {
    box.style.color = player === 'X' ? '#FF6B6B' : '#4CAF50';
    box.style.textShadow = `0 0 20px ${player === 'X' ? 'rgba(255, 107, 107, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`;
    box.style.transform = 'scale(1.2)';
    setTimeout(() => {
        box.style.transform = 'scale(1)';
    }, 200);
}

function aiMove() {
    if (isGameOver) return;
    
    let move;
    if (gameMode === "easy") {
        move = getRandomMove();
    } else if (gameMode === "hard") {
        move = getBestMove();
    }
    
    if (move !== -1) {
        makeMove(boxes[move], move, "O");
    }
}

function getRandomMove() {
    const availableMoves = [];
    boxes.forEach((box, index) => {
        if (box.innerHTML === "") {
            availableMoves.push(index);
        }
    });
    
    if (availableMoves.length > 0) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    return -1;
}

function getBestMove() {
    // Minimax algorithm for hard AI
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (boxes[i].innerHTML === "") {
            boxes[i].innerHTML = "O";
            let score = minimax(false, 0);
            boxes[i].innerHTML = "";
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(isMaximizing, depth) {
    let winner = checkWinForMinimax();
    
    if (winner === "O") return 10 - depth;
    if (winner === "X") return depth - 10;
    if (checkDrawForMinimax()) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (boxes[i].innerHTML === "") {
                boxes[i].innerHTML = "O";
                let score = minimax(false, depth + 1);
                boxes[i].innerHTML = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (boxes[i].innerHTML === "") {
                boxes[i].innerHTML = "X";
                let score = minimax(true, depth + 1);
                boxes[i].innerHTML = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinForMinimax() {
    for (let pattern of winPatterns) {
        let [a, b, c] = pattern;
        if (boxes[a].innerHTML && 
            boxes[a].innerHTML === boxes[b].innerHTML && 
            boxes[b].innerHTML === boxes[c].innerHTML) {
            return boxes[a].innerHTML;
        }
    }
    return null;
}

function checkDrawForMinimax() {
    return [...boxes].every(box => box.innerHTML !== "");
}

function checkWin() {
    for (let i = 0; i < winPatterns.length; i++) {
        let [a, b, c] = winPatterns[i];
        if (boxes[a].innerHTML && 
            boxes[a].innerHTML === boxes[b].innerHTML && 
            boxes[b].innerHTML === boxes[c].innerHTML) {
            
            // Draw winning line
            drawWinningLine(i);
            return true;
        }
    }
    return false;
}

function checkDraw() {
    return [...boxes].every(box => box.innerHTML !== "");
}

function drawWinningLine(patternIndex) {
    const winningLine = document.getElementById('winning-line');
    if (!winningLine) return;
    
    const lineStyles = [
        // Horizontal lines
        { transform: 'translateX(-50%) rotate(0deg)', top: '16.66%', left: '50%', width: '80%', height: '3px' },
        { transform: 'translateX(-50%) rotate(0deg)', top: '50%', left: '50%', width: '80%', height: '3px' },
        { transform: 'translateX(-50%) rotate(0deg)', top: '83.33%', left: '50%', width: '80%', height: '3px' },
        // Vertical lines
        { transform: 'translateY(-50%) rotate(90deg)', top: '50%', left: '16.66%', width: '80%', height: '3px' },
        { transform: 'translateY(-50%) rotate(90deg)', top: '50%', left: '50%', width: '80%', height: '3px' },
        { transform: 'translateY(-50%) rotate(90deg)', top: '50%', left: '83.33%', width: '80%', height: '3px' },
        // Diagonal lines
        { transform: 'translate(-50%, -50%) rotate(45deg)', top: '50%', left: '50%', width: '113%', height: '3px' },
        { transform: 'translate(-50%, -50%) rotate(-45deg)', top: '50%', left: '50%', width: '113%', height: '3px' }
    ];
    
    const style = lineStyles[patternIndex];
    Object.assign(winningLine.style, style);
    winningLine.style.opacity = '1';
}

function handleWin() {
    isGameOver = true;
    const winner = turn.toLowerCase();
    
    scores[winner]++;
    gameStats.wins[winner]++;
    gameStats.gamesPlayed++;
    
    updateStreak(winner);
    
    document.querySelector("#results").innerHTML = `${turn} Wins!`;
    document.querySelector("#results").style.color = turn === 'X' ? '#FF6B6B' : '#4CAF50';
    
    // Highlight winning boxes
    highlightWinningBoxes();
    
    // Play celebration effect
    createCelebration();
    
    if (!isMuted) gameOver.play();
    
    updateDisplay();
    updateStats();
    saveGameData();
}

function handleDraw() {
    isGameOver = true;
    scores.draw++;
    gameStats.gamesPlayed++;
    gameStats.currentStreak = 0;
    
    document.querySelector("#results").innerHTML = "It's a Draw!";
    document.querySelector("#results").style.color = '#FFA726';
    
    updateDisplay();
    updateStats();
    saveGameData();
}

function highlightWinningBoxes() {
    for (let pattern of winPatterns) {
        let [a, b, c] = pattern;
        if (boxes[a].innerHTML && 
            boxes[a].innerHTML === boxes[b].innerHTML && 
            boxes[b].innerHTML === boxes[c].innerHTML) {
            
            boxes[a].style.backgroundColor = turn === 'X' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(76, 175, 80, 0.3)';
            boxes[b].style.backgroundColor = turn === 'X' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(76, 175, 80, 0.3)';
            boxes[c].style.backgroundColor = turn === 'X' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(76, 175, 80, 0.3)';
            break;
        }
    }
}

function createCelebration() {
    const celebration = document.getElementById('celebration');
    if (!celebration) return;
    
    celebration.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#FF6B6B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][Math.floor(Math.random() * 5)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        celebration.appendChild(confetti);
    }
    
    setTimeout(() => {
        celebration.innerHTML = '';
    }, 3000);
}

function updateStreak(winner) {
    if (gameStats.streakPlayer === winner) {
        gameStats.currentStreak++;
    } else {
        gameStats.currentStreak = 1;
        gameStats.streakPlayer = winner;
    }
    
    if (gameStats.currentStreak > gameStats.bestStreak) {
        gameStats.bestStreak = gameStats.currentStreak;
    }
}

function changeTurn() {
    turn = turn === "X" ? "O" : "X";
    updateTurnDisplay();
}

function updateTurnDisplay() {
    const turnBoxes = document.querySelectorAll('.turn-box');
    const bg = document.querySelector('.turn-display .bg');
    
    if (turn === "X") {
        bg.style.left = "0";
        turnBoxes[0].style.color = "#fff";
        turnBoxes[1].style.color = "#666";
    } else {
        bg.style.left = "50%";
        turnBoxes[0].style.color = "#666";
        turnBoxes[1].style.color = "#fff";
    }
}

function updateDisplay() {
    document.querySelector("#score-x").innerText = scores.x;
    document.querySelector("#score-o").innerText = scores.o;
    document.querySelector("#score-draw").innerText = scores.draw;
}

function updateStats() {
    document.querySelector("#games-played").innerText = gameStats.gamesPlayed;
    document.querySelector("#current-streak").innerText = gameStats.currentStreak;
    document.querySelector("#best-streak").innerText = gameStats.bestStreak;
    
    // Calculate win rate
    const totalWins = gameStats.wins.x + gameStats.wins.o;
    const winRate = gameStats.gamesPlayed > 0 ? Math.round((totalWins / gameStats.gamesPlayed) * 100) : 0;
    document.querySelector("#win-rate").innerText = winRate + "%";
    
    // Calculate average moves
    const avgMoves = gameStats.gamesPlayed > 0 ? Math.round(gameStats.totalMoves / gameStats.gamesPlayed) : 0;
    document.querySelector("#avg-moves").innerText = avgMoves;
}

function playAgain() {
    boxes.forEach(box => {
        box.innerHTML = "";
        box.classList.remove('filled');
        box.style.backgroundColor = "";
        box.style.transform = "";
    });
    
    turn = "X";
    isGameOver = false;
    document.querySelector("#results").innerHTML = "";
    
    // Hide winning line
    const winningLine = document.getElementById('winning-line');
    if (winningLine) {
        winningLine.style.opacity = '0';
    }
    
    updateTurnDisplay();
}

function resetGame() {
    playAgain();
    scores = { x: 0, o: 0, draw: 0 };
    updateDisplay();
}

function clearScores() {
    scores = { x: 0, o: 0, draw: 0 };
    gameStats = {
        gamesPlayed: 0,
        currentStreak: 0,
        bestStreak: 0,
        streakPlayer: null,
        totalMoves: 0,
        wins: { x: 0, o: 0 }
    };
    updateDisplay();
    updateStats();
    saveGameData();
    playAgain();
}

function toggleMute() {
    isMuted = !isMuted;
    const soundIcon = document.querySelector("#sound-icon");
    
    if (isMuted) {
        music.pause();
        soundIcon.src = "mute.svg";
    } else {
        music.play();
        soundIcon.src = "unmute.svg";
    }
}

function changeDifficulty() {
    const difficulty = document.querySelector("#difficulty").value;
    gameMode = difficulty;
    
    // Update labels based on game mode
    const playerOLabel = document.querySelector(".score-board .score-item:last-child .score-label");
    if (gameMode === "human") {
        playerOLabel.innerText = "Player O";
    } else {
        playerOLabel.innerText = "AI (O)";
    }
    
    resetGame();
}

function saveGameData() {
    // This would typically save to localStorage, but since we can't use it in artifacts,
    // we'll just keep the data in memory during the session
}

function loadGameData() {
    // This would typically load from localStorage, but since we can't use it in artifacts,
    // we'll start with default values
}