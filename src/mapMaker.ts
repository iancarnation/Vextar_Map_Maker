///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />

class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;

    constructor(canvasElement : string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    createScene() : void {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);

        // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
        this._camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), this._scene);

        // Target the camera to scene origin.
        this._camera.setTarget(BABYLON.Vector3.Zero());

        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false);

        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);

        // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
        let sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
                                {segments: 16, diameter: 2}, this._scene);

        // Move the sphere upward 1/2 of its height.
        sphere.position.y = 1;

        // Create a built-in "ground" shape.
        let ground = BABYLON.MeshBuilder.CreateGround('ground1',
                                {width: 6, height: 6, subdivisions: 2}, this._scene);

        // ---------------------------------
        let guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        let saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        saveBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        saveBtn.width = "150px"
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(() => this.saveScene());
        guiTex.addControl(saveBtn);
        

        // ---------------------------------

        let platform = BABYLON.MeshBuilder.CreateCylinder("platform", {height: 0.5, diameter: 4}, this._scene);
        platform.position.y = 3;
        let platform2 = platform.createInstance("platform2");
        platform2.position.x = 5;
        let platform3 = platform.createInstance("platform3");
        platform3.position.x = 2.5;
        platform3.position.z = 5;

    }

    doRender() : void {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    saveScene() : void {
        let filename = 'scene.json';
        let cereal = BABYLON.SceneSerializer.Serialize(this._scene);
        let json = JSON.stringify(cereal);
        let a = document.createElement("a");
        let file = new Blob([json], {type: 'text/plain'});
        a.href = URL.createObjectURL(file);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas');

    // Create the scene.
    game.createScene();

    // Start render loop.
    game.doRender();
});