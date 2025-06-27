import {Ghost} from '../phySys/Monster.js';
import {LinkList, SnakeLinkList} from "../phySys/LinkList.js";
import {Node_common, AllEmoji} from '../phySys/Snake.js';
import {CSS_HEIGHT, CSS_WIDTH} from './InitDpi.js'
import {refreshRank, ins2Rank} from './setRank.js'
import {GamepadHandler} from "./Input.js";

function showEndModal(game) {
    // 结束界面模态框, 会自动重置游戏
    // 获取模态框元素
    const modal = document.getElementById('gameEndModal');
    const finalScore = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');

    // 更新分数并显示模态框
    finalScore.textContent = game.getScore();
    modal.style.display = 'flex';

    // 使用Promise实现阻塞效果
    return new Promise((resolve) => {
        function restartGameHandler() {
            modal.style.display = 'none';  // 隐藏模态框
            // 移除事件监听器并解析Promise
            restartButton.removeEventListener('click', restartGameHandler);

            const playerNameInput = document.getElementById('playerName');
            let playerName = playerNameInput.value;
            if (!playerName) playerName = "匿名玩家";  // 处理空名称情况
            const score = game.getScore();
            ins2Rank(playerName, score);
            refreshRank();

            game.restart();
            resolve();
        }
        restartButton.addEventListener('click', restartGameHandler);  // 绑定事件处理器
    });
}

function generateRandomNumbers(min, max, count = 3) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return numbers;
}

function upLevel(game) {
    // 升级界面
    const modal = document.getElementById('emojiModal');
    const option_1 = document.getElementById('op1');
    const option_2 = document.getElementById('op2');
    const option_3 = document.getElementById('op3');
    const btn = document.getElementById('submitEmoji');

    [option_1, option_2, option_3].forEach(opt => {
        opt.classList.remove('selected');
    });

    let index = generateRandomNumbers(0, AllEmoji.length-1);

    option_1.textContent = AllEmoji[index[0]].emoji;
    option_2.textContent = AllEmoji[index[1]].emoji;
    option_3.textContent = AllEmoji[index[2]].emoji;

    modal.style.display = 'flex';
    let selectedOption = null;  // 跟踪用户选择

    function handleOptionClick(event) {
        // 清除之前的选择样式
        [option_1, option_2, option_3].forEach(opt => {
            opt.classList.remove('selected');
        });
        // 标记当前选择
        event.currentTarget.classList.add('selected');
        selectedOption = event.currentTarget.id;
    }

    option_1.addEventListener('click', handleOptionClick);
    option_2.addEventListener('click', handleOptionClick);
    option_3.addEventListener('click', handleOptionClick);

    return new Promise((resolve) => {
        function addNewEmoji() {
            if (!selectedOption) {
                alert('请选择一个表情!');
                return;
            }
            modal.style.display = 'none';  // 隐藏模态框
            // 移除事件监听器并解析Promise
            btn.removeEventListener('click', addNewEmoji);
            option_1.removeEventListener('click', handleOptionClick);
            option_2.removeEventListener('click', handleOptionClick);
            option_3.removeEventListener('click', handleOptionClick);

            // 新建节点
            const optionIndexMap = {op1: 0, op2: 1, op3: 2};
            const emojiIndex = optionIndexMap[selectedOption] ?? 2;
            const [x, y] = [game.SnakeList.getTail().x + 50, game.SnakeList.getTail().y + 50];
            const newEmoji = new AllEmoji[index[emojiIndex]](game, x, y, 100, 0);
            game.SnakeList.addNode(newEmoji);

            resolve();
        }
        btn.addEventListener('click', addNewEmoji);  // 绑定事件处理器
    });
}

class Game{
    MonsterList;  // 怪物表
    SnakeList;  // 结点表
    ProjList;  // 投射物表
    indexer;  // 计数器

    kill_nums;  // 帧杀敌计数器
    total_kills;  // 杀敌计数器

    constructor(){
        this.restart();
    }

    calculate(){
        // 计数器之增
        this.indexer++;
        this.indexer %= 1e6;  // 1e6为一个周期
    }

    getCalculator(){
        // 返回计数器
        return this.indexer;
    }

    updateSM(){
        // 移动、绘制、索敌
        this.SnakeList.updateHead();
        this.SnakeList.move_twd_Head(1);
        this.SnakeList.paintHead();
        if (!(this.getCalculator() % 7) && this.MonsterList.isExist()) this.SnakeList.getTargetHead(this.MonsterList);  // 每隔7帧索敌一次
        if (this.MonsterList.isExist() && this.SnakeList.isExist()) this.SnakeList.actHead(this.ProjList, this.getCalculator());

        if(! (this.getCalculator() % 7) && this.SnakeList.isExist()) this.MonsterList.getTargetHead(this.SnakeList);
        this.MonsterList.updateHead();
        this.MonsterList.move_twd_Head(1);
        this.MonsterList.paintHead();
        if(this.MonsterList.isExist() && this.SnakeList.isExist()) this.MonsterList.actHead(this.ProjList, this.getCalculator());
    }

    updateP(){
        // 弹幕更新
        this.kill_nums = this.MonsterList.getLength();  // 初始化杀敌数量
        let p = this.ProjList.getHead();
        while (p != null){
            let next = p.nextNode;
            p.move(1);
            // 所有弹幕都不穿透
            if (p.find_collision(this.SnakeList, this.MonsterList)) {
                this.ProjList.deleteNode(p);
            }
            // 处理越界弹幕
            if (p.out_range()) this.ProjList.deleteNode(p)
            else p.paint();
            p = next;
        }

        this.kill_nums -= this.MonsterList.getLength();  // 更新帧杀敌数
        this.SnakeList.lightSome(this.kill_nums);  // 点亮对应数量的
        this.total_kills += this.kill_nums;  // 更新总杀敌数
    }

    turn(input_g){
        const tmp = input_g.getForward();
        if (tmp) {
            this.SnakeList.head.acceleration = tmp;
            if (input_g instanceof GamepadHandler) input_g.triggerVibration(100, tmp/100, 0.01);
        }
        this.SnakeList.head.speed_turn = input_g.getTurn();
    }

    isEnd(){
        return this.SnakeList.isDead();
    }

    monsterCreator() {
        const canvasWidth = CSS_WIDTH-50;
        const canvasHeight = CSS_HEIGHT-50;
        const spawnRange = 100; // 生成区域范围


        // 四个角的生成区域
        const corners = [
            { minX: 0, maxX: spawnRange, minY: 0, maxY: spawnRange }, // 左上
            { minX: canvasWidth - spawnRange, maxX: canvasWidth, minY: 0, maxY: spawnRange }, // 右上
            { minX: 0, maxX: spawnRange, minY: canvasHeight - spawnRange, maxY: canvasHeight }, // 左下
            { minX: canvasWidth - spawnRange, maxX: canvasWidth, minY: canvasHeight - spawnRange, maxY: canvasHeight }  // 右下
        ];

        // 非线性生成控制公式
        // 基础生成率：随总杀敌数对数增长，初始生成率0.02，最大0.5
        let baseSpawnRate = 0.2 + Math.log1p(this.total_kills / 10) * 0.05;
        baseSpawnRate = Math.min(baseSpawnRate, 0.5);

        // 随机波动：在基础生成率上±30%的波动
        const randomFactor = 0.7 + Math.random() * 0.6;

        // 计算本帧应生成数量
        let spawnCount = 1;
        const spawnChance = baseSpawnRate * randomFactor;

        // 非线性生成概率模型
        for (let i = 0; i < 4; i++) {
            // 基础生成概率
            let spawnProbability = spawnChance;

            // 二次随机性：50%几率触发额外生成判断
            if (Math.random() < 0.5) {
                if (Math.random() < spawnProbability) {
                    spawnCount++;
                }
            } else {
                // 10%几率触发小规模爆发
                if (Math.random() < spawnProbability * 1.5) {
                    spawnCount++;
                }
            }
        }

        // 生成怪物
        for (let i = 0; i < spawnCount; i++) {
            const cornerIndex = Math.floor(Math.random() * corners.length);
            const corner = corners[cornerIndex];

            const x = corner.minX + Math.random() * (corner.maxX - corner.minX);
            const y = corner.minY + Math.random() * (corner.maxY - corner.minY);

            const monster = new Ghost(this, x, y);

            this.MonsterList.addNode(monster);
        }
    }

    restart(){
        this.MonsterList = new LinkList(this);
        this.SnakeList = new SnakeLinkList(this);
        this.ProjList = new LinkList(this);
        this.indexer = 0;
        this.kill_nums = 0;
        this.total_kills = 0;

        this.SnakeList.addNode(new Node_common(this, 100,100,100,1));
        for (let i = 0; i < 10; i++) {
            // this.SnakeList.addNode(new Node_common(this, 100 + 20*i,100+20*i,100,0));
        }

        this.MonsterList.addNode(new Ghost(this, 0, 0, 100));
    }

    getScore(){
        return this.total_kills;
    }

    isAlLight(){
        // 全部点亮
        return this.SnakeList.isAlLight()
    }

    clearLight() {
        // 清空点亮
        let tmp = this.SnakeList.getLight();
        while (tmp != null) {
            tmp.isLight = false;
            tmp = tmp.lastNode;
        }
        this.SnakeList.lightNode = null;
    }
}

export {Game, showEndModal, upLevel}