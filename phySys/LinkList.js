class LinkList {
    head = null;
    tail = null;
    length = 0;
    game = null;

    constructor(game) {
        this.game = game;
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    addNode(node){
        // 加入链表
        node.nextNode = null;
        node.lastNode = null;

        if (this.length === 0) {
            this.head = node;
            this.tail = node;
        } else {
            node.lastNode = this.tail; // 设置新节点的前驱
            this.tail.nextNode = node; // 原尾节点指向新节点
            this.tail = node; // 更新尾节点
        }
        this.length++;
    }

    deleteNode(node){
        // 调用节点的删除函数将自己从链表中删除
        node.deleteNode(this);
    }

    getLength() {
        // 获取长度
        return this.length;
    }

    getHead() {
        // 获取头节点
        if (this.isExist()) return this.head;
    }

    getTail() {
        // 获取尾节点
        return this.tail;
    }

    paintHead(){
        // 绘制头节点
        if (this.isExist()) this.head.paint();
    }

    moveHead(t){
        // 移动头节点
        if (this.isExist()) this.head.move(t);
    }

    move_twd_Head(t){
        if (this.isExist()) this.head.move_twd(t);
    }

    updateHead(){
        // 更新头节点
        if (this.isExist()) this.head.update();
    }

    getTargetHead(linklist){
        // 头节点索敌
        if (this.isExist()) this.head.getTarget(linklist);
    }

    actHead(ProjSet, indexer){
        // 头节点行动
        if (this.isExist()) this.head.Act(ProjSet, indexer);
    }

    on_hit(proj){
        // 受击函数
        if (!this.isExist()) return;
        let targets = 0;
        let tmp = this.getHead();
        while(tmp != null){
            if(proj.isCollision(tmp)){
                // 当发生碰撞时,施加伤害与状态
                targets++;
                proj.hit(tmp)
                if (tmp.isDeath()) this.deleteNode(tmp);
                else if (tmp.isHeader)  this.head = tmp;  // 重置头节点,防止头节点暴毙群龙无首
            }
            tmp = tmp.nextNode;
        }
        return targets !== 0;
    }

    isExist(){
        // 是否存在
        return this.length !== 0;
    }
}


class SnakeLinkList extends LinkList {
    lightNode;
    getLight(){
        // 返回点亮的节点
        return this.lightNode;
    }

    lightOne(node){
        node.isLight = true;
        this.lightNode = node;
    }

    lightNext(){
        // 点亮下一个节点
        if (!this.isExist()) return;

        if (this.getLight() == null){
            this.lightOne(this.getHead());
        }  // 当没有节点点亮的时候点亮头节点
        else {
            // 否则尝试点亮下一个
            let next = this.getLight().nextNode;
            if (next == null) return;
            this.lightOne(next);
        }
    }

    lightSome(n){
        // 点亮n个节点
        for (let i=0; i < n; i++){
            this.lightNext();
        }
    }

    isDead(){
        return this.length === 0;
    }

    isAlLight(){
        return this.getTail() === this.getLight()
    }

    on_hit(proj){
        // 受击函数
        if (!this.isExist()) return;
        let targets = 0;
        let tmp = this.getHead();
        while(tmp != null){
            if(proj.isCollision(tmp)){
                // 当发生碰撞时,施加伤害与状态
                targets++;
                proj.hit(tmp)
                if (tmp.isDeath()) {  // 如果有节点死亡, 特别处理一下死亡的节点是末端点亮节点的情况
                    if (this.getLight() === tmp) this.lightNode = this.getLight().lastNode;
                    this.deleteNode(tmp);
                }
                else if (tmp.isHeader)  this.head = tmp;  // 重置头节点,防止头节点暴毙群龙无首
            }
            tmp = tmp.nextNode;
        }
        return targets !== 0;
    }
}


export {LinkList, SnakeLinkList};