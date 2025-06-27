class State{
    restime = 0;  // 状态剩余时间
    model = null;  // 影响对象


    constructor(restime, model){
        this.restime = restime;
        this.model = model;
    }

    avtive(){
        // 激活状态
        // 响应代码
        this.restime--;
    }

    isEnd(){
        return this.restime <= 0;
    }
}

export {State};