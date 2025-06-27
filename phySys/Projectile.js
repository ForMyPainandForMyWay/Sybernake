import {BaseModel, paint, distance_2} from "./BaseModel.js";


class Projectile extends BaseModel {
    speed_forward = 5
    damage = 0;
    bodySize = 0;
    state_set = new Set();
    static emoji = '❌';
    creator_type = 0;  // 0表示player, 1表示monster

    start_x = 0;
    start_y = 0;
    last_x = 0;
    last_y = 0;

    // nextNode = null;
    // lastNode = null;

    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration) {
        super(game, x, y, tangle, 0, speed_forward, acceleration, bodySize);
        this.creator_type = creator_type;
        this.damage = damage;
        this.bodySize = bodySize;
        this.state_set = new Set();
        this.start_x = x;
        this.start_y = y;
        this.last_x = x;
        this.last_y = y;

        this.nextNode = null;
        this.lastNode = null;

        if (speed_forward > this.speed_forward) this.speed_forward = speed_forward;
    }

    move(t, fa_factor = 0.3) {
        this.last_x = this.x;
        this.last_y = this.y;
        super.move(t, fa_factor);
    }

    paint() {
        paint(this);
    }

    find_collision(header, monster_aray){
        // 寻找投掷物影响对象, 并造成效果
        return null;
    }
}


// 飞弹型投射物
class Bullet extends Projectile {
    range = 0;  // 射程,注意不是子弹碰撞箱子半径

    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration);

        this.state_set = statue_set;
        this.range = range;
    }

    find_collision(snakeList, monsterList){
        // 寻找飞弹影响对象, 并造成效果
        if (snakeList.getHead() != null && this.creator_type === 1){
            return snakeList.on_hit(this);
        }
        if (monsterList.getHead() != null && this.creator_type === 0){
            return monsterList.on_hit(this);
        }
    }

    hit(model){
        // 默认影响函数
        model.take_damage(this.damage);
        if (this.state_set!=null) for (let s of this.state_set) s.take_state(s);
    }

    out_range() {
        // 超出射程
        let error = distance_2(this.start_x, this.start_y, this.x, this.y) >= this.range ** 2;
        error |= (this.last_x===this.x && this.last_y===this.y);
        // 超出边界
        return error;
    }
}


// 近战
class Melee extends Bullet {

    static speed_forward = 0;  // 近战光环不会运动

    // (creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration, range, statue_set)
    constructor(game, creator_type, x, y, tangle, damage, bodySize, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, 0, 0, 1, statue_set);
        this.emoji = '⬜'
        this.speed_forward = Melee.speed_forward;

        this.last_x = this.x;
        this.last_y = this.y;
    }

    paint() {
        // 近战暂时不进行绘制
        return true;
    }

    move(t, fa_factor = 0) {
        this.last_x = this.x;
        this.last_y = this.y;
        return true;
    }
}


// 火焰子弹: 🔥
// 只能匀速直线飞行
class FireBall extends Bullet {
    speed_forward = 5;
    static emoji = '🔥';

    // (creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration, range, statue_set)
    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, 0, range, statue_set);
    }
}


// 闪电子弹: ⚡
// 速度很快
class Lighting extends Bullet {
    speed_forward = 10;
    static emoji = '⚡️';
    static shadow_string = 'rgb(239,255,133)';

    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, 0, range, statue_set);
    }

    move(t, fa_factor = 0) {
        super.move(t, fa_factor);
    }
}


// 病毒子弹: 🦠
// 速度慢,射程短, 滞留时间长
class Virus extends Bullet {
    speed_forward = 3;
    static emoji = '🦠';
    static shadow_string = 'rgb(62,255,0)';

    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, -1, range, statue_set);
    }

    move(t, fa_factor = 1) {
        super.move(t, fa_factor);
    }
}


// 爆炸
class BombFire extends Bullet {
    speed_forward = 1;
    static emoji = '💥';
    static shadow_string = 'rgb(255,0,0)';

    // (creator_type, x, y, bodySize, damage, tangle, speed_forward, acceleration, range, statue_set)
    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, 0, range, statue_set);
    }
}


// 爆破子弹
class Bomb extends Bullet {
    speed_forward = 3;
    static emoji = '💣';
    static shadow_string = 'rgb(255,255,255)';

    constructor(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, range, statue_set) {
        super(game, creator_type, x, y, bodySize, damage, tangle, speed_forward, 0, range, statue_set);
    }

    deleteNode(linklist) {
        super.deleteNode(linklist);

        // 获取爆炸范围（设为子弹大小的3倍）
        const fireRange = this.bodySize * 10;

        for(let i = 0; i < 7; i++) {
            // 计算每个火球的角度（60度间隔，从当前角度开始）
            const fireAngle = this.tangle + i * 60;

            linklist.addNode(
                new BombFire(
                    this.game,
                    this.creator_type,
                    this.x,
                    this.y,
                    this.bodySize,   // 火球大小略小于原子弹
                    this.damage,           // 传递相同伤害值
                    fireAngle,             // 火球方向角度
                    this.speed_forward/2,
                    fireRange,
                )
            );
        }
    }
}

export {Melee, FireBall, Lighting, Virus, Bomb};