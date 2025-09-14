const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusMessage = document.getElementById("status-message");

// ゲームの状態
let gameStarted = false;
let score = 0;
let lives = 3;

// ボールは複数になる可能性があるため配列で管理
let balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 2,
    dy: -2,
    radius: 10
}];

// パドルの設定
const paddle = {
    height: 10,
    width: 75,
    x: (canvas.width - 75) / 2
};

// ブロックの設定
const brick = {
    rowCount: 3,
    columnCount: 5,
    width: 75,
    height: 40,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 30
};

const bricks = [];
for (let c = 0; c < brick.columnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brick.rowCount; r++) {
        // ランダムでアイテムブロックを生成
        const isPowerupBlock = Math.random() < 0.3;
        bricks[c][r] = { x: 0, y: 0, status: 1, isPowerupBlock: isPowerupBlock };
    }
}

// ロゴ画像をロード
const brickImage = new Image();
brickImage.src = 'logo.png';
brickImage.onerror = () => {
    console.error("ロゴ画像のロードに失敗しました。ファイル名 'logo.png' が正しいか確認してください。");
    alert("ロゴ画像のロードに失敗しました。コンソールを確認してください。");
};


// 描画関数
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
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                const brickX = (c * (brick.width + brick.padding)) + brick.offsetLeft;
                const brickY = (r * (brick.height + brick.padding)) + brick.offsetTop;
                b.x = brickX;
                b.y = brickY;
                
                if (brickImage.complete) {
                    ctx.drawImage(brickImage, brickX, brickY, brick.width, brick.height);
                }
            }
        }
    }
}

// 描画ループ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    updateAndDrawPowerups(ctx); // アイテムの描画と更新

    if (gameStarted) {
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // 壁との衝突判定
            if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx;
            }
            if (ball.y + ball.dy < ball.radius) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - ball.radius) {
                // パドルとの衝突判定
                if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                    ball.dy = -ball.dy;
                } else {
                    // ボールが落ちた
                    balls.splice(i, 1);
                    if (balls.length === 0) {
                        lives--;
                        if (!lives) {
                            alert("GAME OVER");
                            document.location.reload();
                        } else {
                            balls.push({
                                x: canvas.width / 2,
                                y: canvas.height - 30,
                                dx: 2,
                                dy: -2,
                                radius: 10
                            });
                            paddle.x = (canvas.width - paddle.width) / 2;
                        }
                    }
                }
            }

            // ブロックとの衝突判定
            for (let c = 0; c < brick.columnCount; c++) {
                for (let r = 0; r < brick.rowCount; r++) {
                    const b = bricks[c][r];
                    if (b.status === 1) {
                        if (ball.x > b.x && ball.x < b.x + brick.width && ball.y > b.y && ball.y < b.y + brick.height) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            score++;
                            if (b.isPowerupBlock) {
                                spawnPowerup(b.x + brick.width / 2, b.y + brick.height);
                            }
                            if (score === brick.rowCount * brick.columnCount) {
                                alert("おめでとうございます！すべてのブロックを破壊しました！");
                                document.location.reload();
                            }
                        }
                    }
                }
            }
        }
    }
    
    // スコアとライフの表示
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
    if (!gameStarted) {
        gameStarted = true;
        statusMessage.style.display = 'none';
        draw();
    }
}

// 画像のロードが完了してからゲーム開始のメッセージを表示
brickImage.onload = () => {
    draw();
};
