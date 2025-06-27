import {Alive, distance_2} from './BaseModel.js';
import {FireBall} from './Projectile.js'

// 怪物基类
class Monster extends Alive {// 节点图标

    constructor(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp,
                ATK, DEF, RAN, Cache, attType) {
        super(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp, ATK, DEF, RAN, Cache, attType);

    }

    move_twd(t, elasticK, dampK) {
        if (this.target == null) return;

        if (distance_2(this.x, this.y, this.target.x, this.target.y) >= (this.RAN/4)**2)
            super.move_twd(t, this.target, elasticK, dampK);
        else
            super.move_twd(0, this.target, elasticK, dampK);
        if (this.nextNode) this.nextNode.move_twd(t, elasticK, dampK);
    }

    Act(link, times) {
        super.Act(link, times);
        if (this.nextNode != null) this.nextNode.Act(link, times);
    }
}


// 鬼魂: 👻
class Ghost extends Monster {
    static shadow_string = 'rgb(122,122,122)';
    static emoji = '👻'

    constructor(game, x, y, hp=100) {
        super(game, x, y, 0, 0, 0, 0, hp,
            20, 0, 500, 150, 1);  // ATK, DEF, RAN, Cache, attType, emoji
    }

    move_twd(t) {
        super.move_twd(t, 0.001, 0.9);
    }

    AttShoot(){
        // 射击
        return [new FireBall(this.game, 1, this.x, this.y, this.bodySize, this.ATK, this.tangle, this.speed_forward*2, 500)];
    }

}


export {Ghost};