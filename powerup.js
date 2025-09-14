// アイテムの種類と色
const POWERUP_TYPES = {
    PADDLE_EXPAND: 'paddle_expand',
    MULTIBALL: 'multiball',
    LIFE: 'life'
};
const POWERUP_COLORS = {
    PADDLE_EXPAND: '#ff7f00', // オレンジ
    MULTIBALL: '#00ccff',    // シアン
    LIFE: '#00ff00'          // グリーン
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
            // アイテムとパドルの衝突判定
            if (
                powerup.x > paddle.x &&
                powerup.x < paddle.x + paddle.width &&
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
            paddle.width = 120; // パドルを拡大
            setTimeout(() => {
                paddle.width = 75; // 5秒後に元に戻す
            }, 5000);
            break;
        case POWERUP_TYPES.MULTIBALL:
            balls.push({
                x: ball.x,
                y: ball.y,
                dx: -ball.dx,
                dy: ball.dy,
                radius: 10
            });
            break;
        case POWERUP_TYPES.LIFE:
            lives++;
            break;
    }
