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
        type = POWERUP_TYPES.PADDLE_EXPAND;
    } else if (random < 0.66) {
        type = POWERUP_TYPES.MULTIBALL;
    } else {
        type = POWERUP_TYPES.LIFE;
    }
    powerups.push(new Powerup(x, y, type));
}

// アイテムの更新と描画
function updateAndDrawPowerups(ctx) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        if (powerup.active) {
            powerup.update();
            powerup.draw(ctx);
            if (
                powerup.x < paddle.x + paddle.width &&
                powerup.x + powerup.width > paddle.x &&
                powerup.y + powerup.height > canvas.height - paddle.height
            ) {
                applyPowerup(powerup);
                powerup.active = false;
            }
        } else {
            powerups.splice(i, 1);
        }
    }
}

// アイテムの効果適用
function applyPowerup(powerup) {
    switch (powerup.type) {
        case POWERUP_TYPES.PADDLE_EXPAND:
            paddle.width = 120;
            setTimeout(() => {
                paddle.width = 75;
            }, 5000);
            break;
        case POWERUP_TYPES.MULTIBALL:
            balls.push({
                x: balls[0].x,
                y: balls[0].y,
                dx: -balls[0].dx,
                dy: balls[0].dy,
                radius: balls[0].radius
            });
            break;
        case POWERUP_TYPES.LIFE:
            lives++;
            break;
    }
}

// 画像の読み込みを管理
let assetsLoaded = 0;
const totalAssets = 2;
let gameReady = false;

const backgroundImage = new Image();
backgroundImage.src = 'space_bg.jpg';
backgroundImage.onload = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};
backgroundImage.onerror = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};

const brickImage = new Image();
brickImage.src = 'logo.png';
brickImage.onload = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};
brickImage.onerror = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};

function checkAllAssetsLoaded() {
    if (assetsLoaded === totalAssets) {
        gameReady = true;
        statusMessage.textContent = "ゲーム開始準備完了！クリックしてスタート！";
        // アセットの読み込みが完了したら、描画ループを開始
        requestAnimationFrame(draw);
    }
}

// 描画関数
function drawBackground() {
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawBall() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    });
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                if (gameStarted) {
                    b.y += b.dy;
                }
                if (b.y + brick.height > canvas.height) {
                    alert("GAME OVER\n最高得点: " + highScore);
                    document.location.reload();
                    return;
                }
                if (brickImage.complete) {
                    ctx.drawImage(brickImage, b.x, b.y, brick.width, brick.height);
                }
            }
        }
    }
}

let lastBlockTime = 0;
const blockInterval = 5000;

function draw(timestamp) {
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    updateAndDrawPowerups(ctx);

    if (gameStarted) {
        if (timestamp - lastBlockTime > blockInterval) {
            addBrickRow();
            lastBlockTime = timestamp;
        }

        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            
            ball.x += ball.dx;
            ball.y += ball.dy;

            if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx;
            }
            if (ball.y + ball.dy < ball.radius) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - ball.radius) {
                if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                    ball.dy = -ball.dy;
                } else {
                    balls.splice(i, 1);
                    if (balls.length === 0) {
                        lives--;
                        if (lives === 0) {
                            if (score > highScore) {
                                highScore = score;
                                localStorage.setItem('breakoutHighScore', highScore);
                                highScoreElement.textContent = highScore;
                            }
                            alert("GAME OVER\n最高得点: " + highScore);
                            document.location.reload();
                        } else {
                            balls.push({
                                x: canvas.width / 2,
                                y: canvas.height - 30,
                                dx: 4,
                                dy: -4,
                                radius: balls[0].radius
                            });
                            paddle.x = (canvas.width - paddle.width) / 2;
                        }
                    }
                    continue;
                }
            }

            let blockHit = false;
            for (let r = 0; r < bricks.length; r++) {
                for (let c = 0; c < bricks[r].length; c++) {
                    const b = bricks[r][c];
                    if (b.status === 1) {
                        if (ball.x > b.x && ball.x < b.x + brick.width && ball.y > b.y && ball.y < b.y + brick.height) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            score++;
                            gainXP();

                            if (b.isPowerupBlock) {
                                spawnPowerup(b.x + brick.width / 2, b.y + brick.height);
                            }
                            blockHit = true;
                            break;
                        }
                    }
                }
                if (blockHit) {
                    break;
                }
            }
        }
    }
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 8, 20);
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);

    requestAnimationFrame(draw);
}

// ユーザー入力
document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("touchstart", touchHandler, false);
document.addEventListener("touchmove", touchHandler, false);
document.addEventListener("click", gameStartHandler);

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

// タッチ操作ハンドラ
function touchHandler(e) {
    if (e.touches) {
        const touchX = e.touches[0].pageX - canvas.offsetLeft;
        if (touchX > 0 && touchX < canvas.width) {
            paddle.x = touchX - paddle.width / 2;
        }
    }
    e.preventDefault();
}

// ゲーム開始ハンドラ
function gameStartHandler() {
    if (!gameStarted && gameReady) {
        startGame();
    }
}

function startGame() {
    gameStarted = true;
    statusMessage.style.display = 'none';
    addBrickRow();
    lastBlockTime = performance.now();
}

// アセットの読み込みが完了したら、ゲームをスタートできる状態にする
let assetsLoaded = 0;
const totalAssets = 2;

const backgroundImage = new Image();
backgroundImage.src = 'space_bg.jpg';
backgroundImage.onload = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};
backgroundImage.onerror = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};

const brickImage = new Image();
brickImage.src = 'logo.png';
brickImage.onload = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};
brickImage.onerror = () => {
    assetsLoaded++;
    checkAllAssetsLoaded();
};

function checkAllAssetsLoaded() {
    if (assetsLoaded === totalAssets) {
        gameReady = true;
        statusMessage.textContent = "ゲーム開始準備完了！クリックしてスタート！";
        // アセットの読み込みが完了したら、描画ループを開始
        requestAnimationFrame(draw);
    }
}
