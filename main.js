const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusMessage = document.getElementById("status-message");
const highScoreElement = document.getElementById("high-score");
const playerLevelElement = document.getElementById("player-level");
const playerXPElement = document.getElementById("player-xp");
const xpToNextLevelElement = document.getElementById("xp-to-next-level");
const statusPointsElement = document.getElementById("status-points");
const statsPanel = document.getElementById("stats-panel");
const upgradePaddleButton = document.getElementById("upgrade-paddle");
const upgradeSpeedButton = document.getElementById("upgrade-speed");
const upgradeLifeButton = document.getElementById("upgrade-life");

// ゲームの状態
let gameStarted = false;
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('breakoutHighScore') || 0;
highScoreElement.textContent = highScore;

// RPG要素
let player = {
    level: 1,
    xp: 0,
    xpToNextLevel: 10,
    statusPoints: 0,
    paddleStat: 1,
    speedStat: 1,
    lifeStat: 1
};

// ゲーム開始時のステータスを更新
function updateStatsUI() {
    playerLevelElement.textContent = player.level;
    playerXPElement.textContent = player.xp;
    xpToNextLevelElement.textContent = player.xpToNextLevel;
    statusPointsElement.textContent = player.statusPoints;
    document.getElementById("stat-paddle-size").textContent = player.paddleStat;
    document.getElementById("stat-ball-speed").textContent = player.speedStat;
    document.getElementById("stat-life").textContent = player.lifeStat;

    upgradePaddleButton.disabled = player.statusPoints === 0;
    upgradeSpeedButton.disabled = player.statusPoints === 0;
    upgradeLifeButton.disabled = player.statusPoints === 0;
}

// レベルアップの処理
function gainXP() {
    player.xp++;
    if (player.xp >= player.xpToNextLevel) {
        player.level++;
        player.xp = 0;
        player.xpToNextLevel = player.xpToNextLevel * 2;
        player.statusPoints++;
        alert(`レベルアップ！ レベル: ${player.level}になりました！\nステータスポイントを1獲得しました。`);
        statsPanel.style.display = 'block';
    }
    updateStatsUI();
}

// ステータス強化ボタンのイベントリスナー
upgradePaddleButton.addEventListener("click", () => {
    if (player.statusPoints > 0) {
        player.statusPoints--;
        player.paddleStat++;
        paddle.width += 10;
        updateStatsUI();
    }
});

upgradeSpeedButton.addEventListener("click", () => {
    if (player.statusPoints > 0) {
        player.statusPoints--;
        player.speedStat++;
        balls.forEach(ball => {
            const speedIncrease = 0.5;
            ball.dx += (ball.dx > 0 ? speedIncrease : -speedIncrease);
            ball.dy += (ball.dy > 0 ? speedIncrease : -speedIncrease);
        });
        updateStatsUI();
    }
});

upgradeLifeButton.addEventListener("click", () => {
    if (player.statusPoints > 0) {
        player.statusPoints--;
        player.lifeStat++;
        lives++;
        updateStatsUI();
    }
});

// 初期UIの描画
updateStatsUI();

// ボールの設定
let balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    radius: 7
}];

// パドルの設定
const paddle = {
    height: 10,
    width: 75,
    x: (canvas.width - 75) / 2
};

// ブロックの設定
const brick = {
    rowCount: 5,
    columnCount: 7,
    width: 60,
    height: 30,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 30
};

let bricks = [];
let totalBlocks = 0;

// 新しいブロックの行を追加する関数
function addBrickRow() {
    const newRow = [];
    for (let c = 0; c < brick.columnCount; c++) {
        const isPowerupBlock = Math.random() < 0.2;
        newRow[c] = {
            x: (c * (brick.width + brick.padding)) + brick.offsetLeft,
            y: -brick.height,
            status: 1,
            isPowerupBlock: isPowerupBlock,
            dy: 0.5
        };
    }
    bricks.unshift(newRow);
    totalBlocks += brick.columnCount;
}

// アイテムの種類と色
const POWERUP_TYPES = {
    PADDLE_EXPAND: 'paddle_expand',
    MULTIBALL: 'multiball',
    LIFE: 'life'
};
const POWERUP_COLORS = {
    PADDLE_EXPAND: '#ff7f00',
    MULTIBALL: '#00ccff',
    LIFE: '#00ff00'
};

// アイテムオブジェクトを管理する配列
let powerups = [];

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.type = type;
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = POWERUP_COLORS[this.type.toUpperCase()];
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (!this.active) return;
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.active = false;
        }
    }
}

// アイテムの生成
function spawnPowerup(x, y) {
    const random = Math.random();
    let type;
    if (random < 0.33) {
        type = POWERUP
