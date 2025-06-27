import {CSS_HEIGHT, CSS_WIDTH, ctx} from '../game/InitDpi.js'


function distance_2(x1, y1, x2, y2) {
    return (x1 - x2)**2 + (y1 - y2)**2;
}

function paint_debug(model){
    // 计算图像左上角坐标（相对中心点偏移）
    const topLeftX = -model.bodySize ;
    const topLeftY = -model.bodySize ;
    // 计算碰撞箱的左上角坐标（碰撞箱中心位于节点的位置）
    const collisionBoxSize = model.bodySize * 2; // 正方形边长
    // 绘制碰撞箱
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // 半透明红色轮廓
    ctx.lineWidth = 2; // 轮廓线宽
    ctx.beginPath();
    ctx.rect(topLeftX, topLeftY, collisionBoxSize, collisionBoxSize);
    ctx.stroke();

    if(model instanceof Alive){
        // 绘制生命值
        let healthText = model.health.toString();
        const healthX = -model.bodySize * 0.8; // 向左偏移
        // 生命值文本样式
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.font = `${model.bodySize * 1.2}px Arial, sans-serif`; // 使用等宽字体
        ctx.fillStyle = "#FF0000"; // 红色生命值
        ctx.fillText(healthText, healthX, 0);
    }
}

function paint_set(model){
    ctx.font = `${model.bodySize*2}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;  // 根据碰撞箱大小设置字体大小
    ctx.save(); // 保存当前绘图状态
    // 移动到节点中心点
    ctx.translate(model.x, model.y) ;
    // 应用旋转
    ctx.rotate(model.getAngle());

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();  // 保存设置
}


function shadow_set(shadow_range, shadow_string){
    ctx.shadowBlur = shadow_range;
    ctx.shadowColor = shadow_string;
    ctx.fillStyle = 'white';
}


function paint(model, shadow_range=50, shadow_string = 'rgba(255,0,0)', debug=true){
    paint_set(model);
    //if (debug) paint_debug(model);
    ctx.restore();  // 回溯到set状态

    // 绘制图像（已应用旋转）
    // ctx.drawImage(this.body_img, topLeftX, topLeftY, this.square, this.square);

    // 光晕
    if (model.isLight) shadow_set(shadow_range, model.constructor.shadow_string);

    ctx.fillText(model.constructor.emoji, 0, 0);
    ctx.restore(); // 回溯到set状态
}


// 基础物理模型
class BaseModel {
    x = 0;  // x坐标
    y = 0;  // 与坐标

    tangle = 0;  // 弧度制 倾角
    speed_forward = 0;  // 前向速度
    speed_turn = 0; // 转向速度,左减 右增
    acceleration = 0;  // 前向加速度
    bodySize;  // 为了方便碰撞检测, 碰撞箱为正方形,内切一个圆

    lastNode = null;  // 父节点
    nextNode = null;  // 子结点

    isLight = true;  // 是否被点亮,用作激活节点渲染光晕
    static shadow_string = 'rgba(255,0,0)';
    game = null;

    constructor(game, x, y, tangle, speed_turn, speed_forward, acceleration, bodySize) {
        // 构造函数
        if (x > CSS_WIDTH || y > CSS_HEIGHT) {
            console.error('out of range', x, y, tangle, speed_turn);
            return;
        }

        this.game = game;

        this.x = x;
        this.y = y;
        this.tangle = tangle;
        this.speed_turn = speed_turn;
        this.speed_forward = speed_forward;
        this.acceleration = acceleration;
        this.bodySize = bodySize;
    }

    move(t, fa_factor = 0.3) {
        let f_a = this.speed_forward * Math.sign(this.acceleration) * fa_factor * -1;
        this.acceleration += f_a;

        this.tangle = this.tangle + this.speed_turn * t;
        let forward = this.speed_forward * t + 0.5 * this.acceleration * t * t;
        let x_next = this.x + forward * Math.sin(this.tangle); // 使用sin计算x分量
        let y_next = this.y - forward * Math.cos(this.tangle); // 使用负cos计算y分量
        if(this.isMidpointInsideCanvas(x_next, y_next)){
            this.x = x_next;
            this.y = y_next;
        }
        this.speed_forward = this.speed_forward + (this.acceleration) * t;
    }

    getAngle() {
        return this.tangle;
    }

    isMidpointInsideCanvas(x, y) {
        // 越界检测, 注意未越界返回true
        return (
            x >= 0 &&
            y >= 0 &&
            x <= CSS_WIDTH &&
            y <= CSS_HEIGHT
        );
    }

    // 获取单位向量表示的分离轴
    getAxis(angle) {
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    }

    isCollision(model) {
        // 获取两个矩形的分离轴（各两条法向量）
        const axes = [
            this.getAxis(this.tangle),
            this.getAxis(this.tangle + Math.PI/2),
            model.getAxis(model.tangle),
            model.getAxis(model.tangle + Math.PI/2)
        ];

        for (const axis of axes) {
            const proj1 = this.projectRectToAxis(this, axis);
            const proj2 = this.projectRectToAxis(model, axis);

            // 直接比较投影区间（无需移动）
            if (proj1.max < proj2.min || proj2.max < proj1.min) {
                return false; // 发现分离轴 无碰撞
            }
        }
        return true; // 所有轴重叠 碰撞
    }

    projectRectToAxis(rect, axis) {
        const halfSize = rect.bodySize; // bodySize 是半宽

        // 计算两个方向的投影分量
        const dx = Math.abs(
            Math.cos(rect.tangle) * axis.x +
            Math.sin(rect.tangle) * axis.y
        );
        const dy = Math.abs(
            Math.cos(rect.tangle + Math.PI/2) * axis.x +
            Math.sin(rect.tangle + Math.PI/2) * axis.y
        );

        const r = halfSize * (dx + dy);
        const centerProj = rect.x * axis.x + rect.y * axis.y;

        return { min: centerProj - r, max: centerProj + r };
    }

    deleteNode(linklist){
        // 从链表中删除自身
        if (linklist.length === 0) return;
        // 处理头节点
        if (this === linklist.head) {
            linklist.head = this.nextNode;
            if (linklist.head) linklist.head.lastNode = null;
        }
        // 处理尾节点
        if (this === linklist.tail) {
            linklist.tail = this.lastNode;
            if (linklist.tail) linklist.tail.nextNode = null;
        }
        // 常规节点处理
        if (this.lastNode) this.lastNode.nextNode = this.nextNode;
        if (this.nextNode) this.nextNode.lastNode = this.lastNode;
        // 重置节点引用
        this.nextNode = null;
        this.lastNode = null;
        linklist.length--;
    }
}

class Alive extends BaseModel {
    // 继承基本模型类的 活体类, 仅具有基本的血量
    health = 100;  // 血量
    ATK = 10;  // 攻击力
    DEF = 0;  // 防御力
    RAN = 500;  // 攻击范围, 远程用
    Cache = 10;  // 攻击冷却
    attType = 0;  // 攻击方式,0表示无反应,1表示远程攻击,2表示近战攻击, 3表示近战+远程
    static emoji = '🫆';


    state_set = new Set();
    target = null  // 锁定敌人

    constructor(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp,
                ATK, DEF, RAN, Cache, attType) {
        super(game, x, y, tangle, speed_turn, speed_forward, acceleration, hp / 8);
        this.ATK = ATK;
        this.DEF = DEF;
        this.RAN = RAN;
        this.Cache = Cache;
        this.attType = attType;
        // this.emoji = emoji;
        this.state_array = new Set();
    }

    paint(){
        paint(this);
        if (this.nextNode != null) this.nextNode.paint();
        // super.paint();
    }

    move_twd(t, node, elasticK, dampK) {
        // 向某个节点追踪移动
        // 指向父节点的向量
        const dx = node.x - this.x;
        const dy = node.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.01) return;  // 避免除零错误和小距离抖动
        this.tangle = Math.atan2(dx, -dy);  // 直接指向父节点
        // 弹性距离
        const IDEAL_DISTANCE = node.bodySize * 2; // 理想间距, 在这个距离内没有弹力
        const distanceError = dist - IDEAL_DISTANCE;
        // 设置加速度
        this.acceleration = distanceError * elasticK; // 弹性系数, 越大越紧凑
        this.move(t);  // 物理移动
        this.speed_forward *= dampK;  // 添加速度阻尼防止振荡
    }


    take_damage(damage){
        // 承伤
        let hurt = damage - this.DEF;
        if (hurt <= 0) hurt = 0;

        this.health -= hurt;
        if (this.health <= 0) this.health = 0;
    }

    take_state(state){
        // 施加状态
        this.state_set.add(state);
    }

    update(){
        this.setbodySIze();
        // 更新状态并检查状态
        let s;
        for (s of this.state_set) {
            s.activate();
            if (s.isEnd()) this.state_set.delete(s);
        }
    }

    isDeath(){
        // 检查是否存活
        return this.health <= 0;
    }

    setbodySIze(){
        // 设置bodySize
        let bodySize = this.health / 8;
        if (bodySize <= 8) this.bodySize = 8;
        else this.bodySize = bodySize;
        return this.bodySize;
    }

    getTarget(linklist){
        // 索敌, 将target设置为对应对象
        // 最近邻索敌
        let min_dist = 10e9;
        let min_node = linklist.getHead();
        let tmp = linklist.getHead();
        while (tmp != null){
            let dist = (tmp.x - this.x)**2 + (tmp.y - this.y)**2;
            if (min_dist >= dist){
                min_dist = dist;
                min_node = tmp;
            }
            tmp = tmp.nextNode;
        }
        this.target = min_node;

        if (this.nextNode != null) this.nextNode.getTarget(linklist);
    }

    Act(projLink, times){
        // 近战冷却
        if(this.attType === 0 || (times % 5)) return false;  // 每5帧进行一次近战伤害
        let tmp = this.AttMelee();
        if (tmp != null && tmp.length!==0)
            for (let n of tmp) projLink.addNode(n);

        // 射击冷却
        if (this.attType === 0 || (times % this.Cache)) return false;  // 每Cache帧进行一次远程伤害
        tmp = this.AttShoot();
        if (tmp != null && tmp.length!==0)
            for (let n of tmp) projLink.addNode(n);
        return true;
    }

    AttShoot(){
        // 射击, 返回一个投射物, 加入到全局投射物中
        return []
    }

    AttMelee(){
        // 近战
        return [];
    }
}



export {BaseModel, Alive, paint, distance_2};