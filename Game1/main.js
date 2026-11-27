var canvas = document.getElementById('application-canvas');
var app = new pc.Application(canvas, {
    keyboard: new pc.Keyboard(window),
    mouse: new pc.Mouse(canvas)
});

var Game = pc.createScript('game');

Game.prototype.initialize = function () {
    this.speed = 5;
    this.lookSpeed = 0.15;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};

    var ground = new pc.Entity('ground');
    ground.addComponent('render', { type: 'box' });
    ground.setLocalScale(20, 0.2, 20);
    ground.setLocalPosition(0, -0.1, 0);
    ground.render.meshInstances[0].material = this.material(new pc.Color(0.55, 0.55, 0.55));
    this.app.root.addChild(ground);

    for (var i = 0; i < 5; i++) {
        var box = new pc.Entity('box');
        box.addComponent('render', { type: 'box' });
        box.setLocalPosition(Math.random() * 10 - 5, 0.5, Math.random() * 10 - 5);
        box.render.meshInstances[0].material = this.material(new pc.Color(0.7, 0.45, 0.2));
        this.app.root.addChild(box);
    }

    var light = new pc.Entity('light');
    light.addComponent('light', { type: 'directional', intensity: 1.2, castShadows: false });
    light.setEulerAngles(50, 30, 0);
    this.app.root.addChild(light);
    this.app.scene.ambientLight = new pc.Color(0.25, 0.25, 0.28);

    this.camera = new pc.Entity('camera');
    this.camera.addComponent('camera', {
        clearColor: new pc.Color(0.45, 0.6, 0.85)
    });
    this.camera.setLocalPosition(0, 1.6, 8);
    this.app.root.addChild(this.camera);

    // 1. 先建立並註冊 asset（此時尚未開始下載）
    var indiaAsset = new pc.Asset('india', 'texture', {
        url: '/r2/india.jpg'
    });

    indiaAsset.once('load', function (asset) {
        console.log('20 秒後已從 R2 下載完成 india.jpg（尚未套用到任何物件）:', asset);
    });

    indiaAsset.once('error', function (err) {
        console.error('載入 india.jpg 失敗:', err);
    });

    this.app.assets.add(indiaAsset);

    // 2. 延遲 20 秒（20000 毫秒）才真正呼叫 load 開始下載
    var self = this;
    this.loadTimer = setTimeout(function () {
        console.log('已經過 20 秒，開始向 /r2/india.jpg 發出請求...');
        self.app.assets.load(indiaAsset);
    }, 20000);

    // 若離開或銷毀腳本，順便清除計時器避免殘留
    this.on('destroy', function () {
        if (this.loadTimer) {
            clearTimeout(this.loadTimer);
        }
    });

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
};

Game.prototype.material = function (color) {
    var material = new pc.StandardMaterial();
    material.diffuse = color;
    material.update();
    return material;
};

Game.prototype.onKeyDown = function (event) {
    this.keys[event.key] = true;
};

Game.prototype.onKeyUp = function (event) {
    this.keys[event.key] = false;
};

Game.prototype.onMouseMove = function (event) {
    this.yaw -= event.dx * this.lookSpeed;
    this.pitch -= event.dy * this.lookSpeed;
    this.pitch = pc.math.clamp(this.pitch, -85, 85);
    this.camera.setEulerAngles(this.pitch, this.yaw, 0);
};

Game.prototype.update = function (dt) {
    var forward = this.camera.forward.clone();
    var right = this.camera.right.clone();
    forward.y = 0;
    right.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    if (right.lengthSq() > 0) right.normalize();

    var move = new pc.Vec3();
    if (this.keys[pc.KEY_W]) move.add(forward);
    if (this.keys[pc.KEY_S]) move.sub(forward);
    if (this.keys[pc.KEY_A]) move.sub(right);
    if (this.keys[pc.KEY_D]) move.add(right);
    if (move.lengthSq() > 0) {
        move.normalize().mulScalar(this.speed * dt);
        this.camera.translate(move);
    }
};

document.body.style.margin = '0';
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
window.addEventListener('resize', function () {
    app.resizeCanvas();
});
app.start();
app.root.addComponent('script');
app.root.script.create('game');
