import {Alive, BaseModel, distance_2} from './BaseModel.js';
import {FireBall, Melee, Lighting, Virus, Bomb} from "./Projectile.js";


// 蛇的结基类
class Node extends Alive {

    isHeader = false;  // 是否是头节点
    isLight = false;

    constructor(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp,
                ATK, DEF, RAN, Cache, attType, isHeader, nextNode) {
        super(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp,
            ATK, DEF, RAN, Cache, attType);
        this.nextNode = nextNode;
        this.isHeader = isHeader;
        // this.emoji = emoji;
    }

    move_twd(t, factor=0.3) {

        if (this.isHeader) {
            BaseModel.prototype.move.call(this, t, factor);
        } else {
            super.move_twd(t, this.lastNode, 0.1, 0.9);
        }
        if (this.nextNode) this.nextNode.move_twd(t);
    }

    addNode(node){
        // 双链表
        node.nextNode = null;
        node.lastNode = null;
        this.nextNode = node;
        this.nextNode.lastNode = this;
    }

    getTargetAngle(){
        if (this.target == null) return 0;

        // 根据target计算角度
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.01) return;  // 避免除零错误和小距离抖动

        return Math.atan2(dx, -dy);
    }

    update() {
        super.update();
        if(this.nextNode != null) this.nextNode.update();
    }

    // paint() {
    //     if (this.nextNode != null) this.nextNode.paint();
    //     super.paint();
    // }

    Act(link, times) {
        super.Act(link, times);
        if (this.nextNode != null) this.nextNode.Act(link, times);
    }

    take_damage(damage) {
        super.take_damage(damage);
        if (this.isDeath() && this.nextNode != null) {
            // 移交 isHead 状态
            this.nextNode.isHeader = this.isHeader;
        }
    }
}


// 普通节点: 😀
class Node_common extends Node{
    static shadow_string = 'rgb(255,207,0)';
    static emoji = '😀';
    //x, y, tangle, speed_turn, speed_forward, acceleration, hp,
    //ATK, DEF, RAN, Cache, attType, emoji, isHeader, nextNode, body_img)
    constructor(game, x, y, hp, isHeader, nextNode) {
        super(game, x, y, 0, 0, 0, 0, hp,
            10, 10, 500,  200, 1, isHeader, nextNode);
    }

    AttShoot(){
        // 射击
        return [new FireBall(this.game, 0, this.x, this.y, this.bodySize, 10, this.getTargetAngle(), this.speed_forward, 500)];
        // return null;
    }

    AttMelee() {
        // 近战攻击
        return [new Melee(this.game, 0, this.x, this.y, this.getAngle(), 40, this.bodySize)];
        // return null;
    }

    deleteNode(linklist) {
        // 亡语： 弹幕清屏
        let tmp = this.game.ProjList.getHead();
        while (tmp != null) {
            let _ = tmp.nextNode;
            if (tmp.creator_type === 1) this.game.ProjList.deleteNode(tmp);
            tmp = _;
        }
        super.deleteNode(linklist);

    }
}


class Node_robot extends Node{
    static shadow_string = 'rgb(0,195,255)';
    static emoji = '🤖';
    //x, y, tangle, speed_turn, speed_forward, acceleration, hp,
    //ATK, DEF, RAN, Cache, attType, isHeader, nextNode)
    constructor(game, x, y, hp, isHeader, nextNode) {
        super(game, x, y, 0, 0, 0, 0, hp,
            70, 0, 800, 150, 1, isHeader, nextNode);
    }

    AttShoot(){
        // 射击
        return [new Lighting(this.game, 0, this.x, this.y, this.bodySize, this.ATK, this.getTargetAngle(), this.speed_forward, this.RAN)];
    }
}


class Node_seak extends Node{
    static shadow_string = 'rgb(0,135,0)';
    static emoji = '🤢';

    //x, y, tangle, speed_turn, speed_forward, acceleration, hp,
    //ATK, DEF, RAN, Cache, attType, isHeader, nextNode)
    constructor(game, x, y, hp, isHeader, nextNode) {
        super(game, x, y, 0, 0, 0, 0, hp,
            20, 10, 200,  150, 1, isHeader, nextNode);
    }

    AttShoot(){
        // 射击
        if (distance_2(this.x, this.y, this.target.x, this.target.y) > this.RAN**2) return;

        let tmp = [];
        for(let i = -1; i < 2; i++){
            let p = new Virus(this.game, 0, this.x, this.y, this.bodySize,
                this.ATK, this.getTargetAngle() + i, this.speed_forward, this.RAN);
            tmp.push(p);
        }
        return tmp;
    }

    AttMelee() {
        // 近战攻击
        return [new Melee(this.game, 0, this.x, this.y, this.getAngle(), this.ATK, this.bodySize)];
    }
}


class Node_bomb extends Node{
    static shadow_string = 'rgb(0,195,255)';
    static emoji = '🤯';
    //x, y, tangle, speed_turn, speed_forward, acceleration, hp,
    //ATK, DEF, RAN, Cache, attType, isHeader, nextNode)
    constructor(game, x, y, hp, isHeader, nextNode) {
        super(game, x, y, 0, 0, 0, 0, hp,
            100, 10, 800,  800, 1, isHeader, nextNode);
    }

    AttShoot(){
        // 射击
        return [new Bomb(this.game, 0, this.x, this.y, this.bodySize, this.ATK, this.getTargetAngle(), this.speed_forward, this.RAN)];
    }
}


const AllEmoji = [Node_common, Node_robot, Node_seak, Node_bomb];

export {Node, Node_common, AllEmoji};