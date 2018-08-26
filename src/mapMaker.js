"use strict";
///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
var EditControl = org.ssatguru.babylonjs.component.EditControl;
var Game = /** @class */ (function () {
    function Game(canvasElement) {
        var _this = this;
        this.platformCount = 0;
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._pointerup = function (evt) { return _this.onPointerUp(evt); };
        this._canvas.addEventListener("pointerup", this._pointerup, false);
    }
    Game.prototype.createScene = function () {
        var _this = this;
        this._scene = new BABYLON.Scene(this._engine);
        this._camera = new BABYLON.ArcRotateCamera("perspective_default", Math.PI / 4, Math.PI / 4, 20, new BABYLON.Vector3(0, 0, 0), this._scene);
        this._camera.wheelPrecision = 15;
        this._camera.inertia = 0.2;
        this._camera.panningInertia = 0.2;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, false);
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        // Create a built-in "ground" shape.
        var ground = BABYLON.MeshBuilder.CreateGround('Grid', { width: 20, height: 20, subdivisions: 20 }, this._scene);
        ground.material = new BABYLON.StandardMaterial("GridMaterial", this._scene);
        ground.material.wireframe = true;
        ground.material.backFaceCulling = true;
        //ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        ground.isPickable = false;
        // ground.data = {uid: -1, type: 'staticSceneObject'}; // not sure what this is for
        // ---------------------------------
        var guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var panel = new BABYLON.GUI.StackPanel();
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        guiTex.addControl(panel);
        var saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.width = "150px";
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(function () { return _this.saveScene(); });
        panel.addControl(saveBtn);
        var platformBtn = BABYLON.GUI.Button.CreateSimpleButton("platformBtn", "Add Platform");
        platformBtn.width = "150px";
        platformBtn.height = "40px";
        platformBtn.color = "white";
        platformBtn.cornerRadius = 20;
        platformBtn.background = "red";
        platformBtn.onPointerUpObservable.add(function () { return _this.addPlatform(); });
        panel.addControl(platformBtn);
        //****
        //this._scene.onPointerObservable.add(handlePointer);
        this._editControl = this.attachEditControl(ground);
        // ---------------------------------
        this.addPlatform();
    };
    Game.prototype.doRender = function () {
        var _this = this;
        // Run the render loop.
        this._engine.runRenderLoop(function () {
            _this._scene.render();
        });
        // The canvas/window resize event handler.
        window.addEventListener('resize', function () {
            _this._engine.resize();
        });
    };
    // ----------------------------------------------------------
    Game.prototype.addPlatform = function () {
        var name = "platform";
        name += this.platformCount;
        console.log(name);
        var p = new Platform(name, new BABYLON.Vector3(0, 0, 0), this._scene);
        this.platformCount++;
        this._editControl.switchTo(p.transform);
    };
    Game.prototype.saveScene = function () {
        var filename = 'scene.json';
        var cereal = BABYLON.SceneSerializer.Serialize(this._scene);
        var json = JSON.stringify(cereal);
        var a = document.createElement("a");
        var file = new Blob([json], { type: 'text/plain' });
        a.href = URL.createObjectURL(file);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    Game.prototype.attachEditControl = function (mesh) {
        var ec = new EditControl(mesh, this._camera, this._canvas, 0.75, true, 0.02);
        ec.enableTranslation();
        ec.setRotSnapValue(3.14 / 18);
        ec.setTransSnapValue(0.5);
        ec.setScaleSnapValue(0.25);
        /*      ec.addActionStartListener(actionStartListener);
                ec.addActionListener(actionListener);
                ec.addActionEndListener(actionEndListener);
         */
        console.log(ec.isHidden());
        return ec;
    };
    Game.prototype.onPointerUp = function (evt) {
        var pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        var mesh;
        if (pick != null && pick.hit) {
            mesh = pick.pickedMesh;
            // edit via transform node, re: Platform class .. despite type complaint
            this._editControl.switchTo(mesh.parent);
            console.log("Picked", mesh);
        }
    };
    return Game;
}());
// -------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', function () {
    // Create the game using the 'renderCanvas'.
    var game = new Game('renderCanvas');
    // Create the scene.
    game.createScene();
    // Start render loop.
    game.doRender();
});
// maybe use this transform node setup for parenting/grouping ??
var Platform = /** @class */ (function () {
    function Platform(id, position, scene) {
        this.transform = new BABYLON.TransformNode(id, scene);
        this.transform.position = position;
        this.mesh = BABYLON.MeshBuilder.CreateCylinder(id, { height: 0.5, diameter: 4 }, scene);
        this.mesh.parent = this.transform;
    }
    Platform.prototype.setParent = function (target) {
        this.transform.parent = target;
    };
    return Platform;
}());
