import {init_dpi, canvas, ctx, CSS_HEIGHT, CSS_WIDTH} from './game/InitDpi.js';
import {InputHandler, GamepadHandler} from './game/Input.js';
import {Game, showEndModal, upLevel} from './game/GameController.js'

canvas.getBoundingClientRect()

// 全局游戏实例
let game = new Game();
let input = null;
let animationFrameId = null;
let isPaused = false; // 添加暂停状态变量
let last_time = new Date();
let now_time = new Date();

// 更新得分显示
function updateScoreDisplay() {
    const scoreValue = document.getElementById('scoreValue');
    if (scoreValue) {
        scoreValue.textContent = game.getScore();
    }
}


input = new InputHandler();
window.addEventListener('gamepadconnected', (e) => {
    input = new GamepadHandler(e);
    alert(`connect gamepad!`);
});

window.addEventListener('gamepaddisconnected', (e) => {
    this.gamepad = null;
    input = new InputHandler();
    alert(`disconnect gamepad!`);
})


export function startGame() {
    // 停止之前的游戏循环（如果存在）
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    init_dpi();
    game.restart();

    // 确保画布和分数显示可见
    document.getElementById('canvas').style.display = 'block';
    document.getElementById('scoreDisplay').style.display = 'block';

    last_time = new Date();
    isPaused = false; // 重置暂停状态
    gameLoop();
}

export function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) {
        // 恢复游戏时更新上次时间
        last_time = new Date();
        gameLoop();
    }
    return isPaused;
}

export async function gameLoop() {
    if (isPaused) return; // 如果暂停则跳过游戏循环

    animationFrameId = requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, CSS_WIDTH, CSS_HEIGHT);

    if (game.isEnd()) {
        cancelAnimationFrame(animationFrameId);
        await showEndModal(game);
        return;
    }

    if (game.isAlLight()) {
        cancelAnimationFrame(animationFrameId);
        upLevel(game).then(() => {
            game.clearLight();
            last_time = new Date();
            animationFrameId = requestAnimationFrame(gameLoop);
        });
        return;
    }
    game.turn(input);
    game.updateSM(input);
    game.updateP();
    game.calculate();

    // 更新得分显示
    updateScoreDisplay();
    now_time = new Date();
    const deltaTime = now_time - last_time;
    if (deltaTime >= 5e3) {
        game.monsterCreator();
        last_time = new Date();
    }
}

// 移除原有的自动启动逻辑
// 仅保留DPI初始化
canvas.getBoundingClientRect();