export class InputHandler {
    keys = {};

    constructor() {
        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));
    }

    keyDownHandler(event) {
        this.keys[event.key] = true;
    }

    keyUpHandler(event) {
        this.keys[event.key] = false;
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    getForward(){
        if(this.isKeyPressed('ArrowUp')) return 2;
        return 0;
    }

    getTurn(){
        if (this.isKeyPressed('ArrowLeft') && !this.isKeyPressed('ArrowRight')) {
            return -0.1;
        } else if (this.isKeyPressed('ArrowRight') && !this.isKeyPressed('ArrowLeft')) {
            return 0.1;
        } else {
            return 0; // 同时按或都不按
        }
    }
}


export class GamepadHandler{
    gamepad;
    LT;
    RT;

    constructor(e){
        this.gamepad = e.gamepad;
        if (this.gamepad) {
            this.LT = this.gamepad.buttons[6];
            this.RT = this.gamepad.buttons[7];
        }
    }

    getLAxis(){
        // 返回左摇杆的横坐标, 不保证更新手柄状态
        return this.gamepad.axes[0];
    }

    getTurn(){
        // 返回转向值
        this.update();
        if (!this.gamepad) return 0;
        let axes =  this.getLAxis();
        return Math.abs(axes) > 0.3 ? axes / 10 : 0;
    }

    getForward(){
        // 返回左扳机的值 * 2
        this.update();
        return this.LT.value > 0.1 ? this.LT.value*2 : 0;
    }

    presShoot(){
        // 返回右扳机是否按下
        this.update();
        return this.RT.value > 0.01;
    }

    update(){
        this.gamepad = navigator.getGamepads()[0];
        this.LT = this.gamepad.buttons[6];
        this.RT = this.gamepad.buttons[7];
    }

    triggerVibration(duration, leftIntensity, rightIntensity) {
        if (this.gamepad?.vibrationActuator) {
            this.gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration, // 毫秒
                weakMagnitude: leftIntensity, // 左侧马达强度 0.0 - 1.0
                strongMagnitude: rightIntensity // 右侧马达强度 0.0 - 1.0
            });
        }
    }

}