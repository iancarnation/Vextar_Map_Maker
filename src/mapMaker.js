"use strict";
///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
var EditControl = org.ssatguru.babylonjs.component.EditControl;
var Game = /** @class */ (function () {
    function Game(canvasElement) {
        var _this = this;
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
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
        var sphere = BABYLON.MeshBuilder.CreateSphere('sphere1', { segments: 16, diameter: 2 }, this._scene);
        // Move the sphere upward 1/2 of its height.
        sphere.position.y = 1;
        // Create a built-in "ground" shape.
        var ground = BABYLON.MeshBuilder.CreateGround('ground1', { width: 6, height: 6, subdivisions: 2 }, this._scene);
        // ---------------------------------
        var guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        saveBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        saveBtn.width = "150px";
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(function () { return _this.saveScene(); });
        guiTex.addControl(saveBtn);
        //****
        //this._scene.onPointerObservable.add(handlePointer);
        this.editControl = this.attachEditControl(ground);
        // ---------------------------------
        var platform = BABYLON.MeshBuilder.CreateCylinder("platform", { height: 0.5, diameter: 4 }, this._scene);
        platform.position.y = 3;
        var platform2 = platform.createInstance("platform2");
        platform2.position.x = 5;
        var platform3 = platform.createInstance("platform3");
        platform3.position.x = 2.5;
        platform3.position.z = 5;
        var platformNode = new Platform("mrNode", new BABYLON.Vector3(0, 0, 0), this._scene);
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
        if (pick.hit) {
            mesh = pick.pickedMesh;
            this.editControl.switchTo(mesh.parent); // move transform node
            console.log("Picked", mesh);
        }
    };
    return Game;
}());
window.addEventListener('DOMContentLoaded', function () {
    // Create the game using the 'renderCanvas'.
    var game = new Game('renderCanvas');
    // Create the scene.
    game.createScene();
    // Start render loop.
    game.doRender();
});
var Platform = /** @class */ (function () {
    function Platform(id, position, scene) {
        this.node = new BABYLON.TransformNode(id, scene);
        this.node.position = position;
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("platform", { height: 0.5, diameter: 4 }, scene);
        this.mesh.parent = this.node;
    }
    return Platform;
}());
