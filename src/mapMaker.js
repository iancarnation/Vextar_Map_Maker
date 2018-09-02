"use strict";
///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
var EditControl = org.ssatguru.babylonjs.component.EditControl;
var masterP;
var PLATFORM;
var layoutShapeSides_global = 5;
var Game = /** @class */ (function () {
    function Game(canvasElement) {
        var _this = this;
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
        //this._engine.enableOfflineSupport = false; // to stop .manifest 404 error
        this._pointerup = function (evt) { return _this.onPointerUp(evt); };
        this._canvas.addEventListener("pointerup", this._pointerup, false);
    }
    Game.prototype.createScene = function () {
        var _this = this;
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.metadata = { steps: [] };
        this._camera = new BABYLON.ArcRotateCamera("perspective_default", Math.PI / 4, Math.PI / 4, 20, new BABYLON.Vector3(0, 0, 0), this._scene);
        this._camera.wheelPrecision = 15;
        this._camera.inertia = 0.2;
        this._camera.panningInertia = 0.2;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, false);
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        this._assetsManager = new BABYLON.AssetsManager(this._scene);
        var platformTask = this._assetsManager.addMeshTask("platformTask", "platform", "assets/", "platform.babylon");
        platformTask.onSuccess = function (task) {
            masterP = task.loadedMeshes[0];
            masterP.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
            masterP.id = "masterPlatform";
            //PLATFORM = masterP;
        };
        this._assetsManager.onFinish = function () { return _this.initiatePlatform(); };
        this._assetsManager.load();
        /*
        // -------------- alternative for mesh loading w/out appending
        BABYLON.SceneLoader.LoadAssetContainer("assets/", "platform.babylon", this._scene, function (_container) {
            var meshes = _container.meshes;
            var materials = _container.materials;
            //...
            console.log(_container);
            // Adds all elements to the scene
            _container.addAllToScene();
        });
        // -------------- another way to load the mesh
        BABYLON.SceneLoader.ImportMesh("", "assets/", "platform.babylon", this._scene, function (newMeshes) {
            let p = newMeshes[0];
            p.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
            PLATFORM = p;
        });
        */
        /*
        let ground = BABYLON.MeshBuilder.CreateGround('Grid',
                                {width: 20, height: 20, subdivisions: 20}, this._scene);
        ground.material = new BABYLON.StandardMaterial("GridMaterial", this._scene);
        ground.material.wireframe = true;
        ground.material.backFaceCulling = false;
        //ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        ground.isPickable = false;
        // ground.data = {uid: -1, type: 'staticSceneObject'}; // not sure what this is for
        */
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this._scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox_clarity/images/JC_skybox_clarity", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        skybox.isPickable = false;
        // GUI ---------------------------------
        var guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var metaPanel = new BABYLON.GUI.StackPanel();
        metaPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        metaPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        guiTex.addControl(metaPanel);
        // --
        var topPanel = new BABYLON.GUI.StackPanel();
        metaPanel.addControl(topPanel);
        var saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.width = "150px";
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(function () { return _this.saveScene(); });
        topPanel.addControl(saveBtn);
        var undoBtn = BABYLON.GUI.Button.CreateSimpleButton("undoBtn", "Undo");
        undoBtn.width = "150px";
        undoBtn.height = "40px";
        undoBtn.color = "white";
        undoBtn.cornerRadius = 20;
        undoBtn.background = "red";
        undoBtn.onPointerUpObservable.add(function () { return _this._editControl.undo(); });
        topPanel.addControl(undoBtn);
        var deleteBtn = BABYLON.GUI.Button.CreateSimpleButton("deleteBtn", "Delete");
        deleteBtn.width = "150px";
        deleteBtn.height = "40px";
        deleteBtn.color = "white";
        deleteBtn.cornerRadius = 20;
        deleteBtn.background = "#942121";
        deleteBtn.onPointerUpObservable.add(function () { return _this.deletePlatform(); });
        topPanel.addControl(deleteBtn);
        var platformBtn = BABYLON.GUI.Button.CreateSimpleButton("platformBtn", "Add Platform");
        platformBtn.width = "150px";
        platformBtn.height = "40px";
        platformBtn.color = "white";
        platformBtn.cornerRadius = 20;
        platformBtn.background = "orange";
        platformBtn.onPointerUpObservable.add(function () { return _this.addPlatform(); });
        topPanel.addControl(platformBtn);
        var layoutShapeBtn = BABYLON.GUI.Button.CreateSimpleButton("layoutShapeBtn", "Add Layout Shape");
        layoutShapeBtn.width = "150px";
        layoutShapeBtn.height = "40px";
        layoutShapeBtn.color = "white";
        layoutShapeBtn.cornerRadius = 20;
        layoutShapeBtn.background = "magenta";
        layoutShapeBtn.onPointerUpObservable.add(function () { return _this.addLayoutShape(); });
        topPanel.addControl(layoutShapeBtn);
        var sliderPanel = new BABYLON.GUI.StackPanel();
        topPanel.addControl(sliderPanel);
        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 3;
        slider.maximum = 20;
        slider.value = layoutShapeSides_global;
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "grey";
        slider.onValueChangedObservable.add(function (value) {
            layoutShapeSides_global = value;
        });
        sliderPanel.addControl(slider);
        //BABYLON.GUI.Control.AddHeader(layoutShapeBtn, "Sides: ", 5, { isHorizontal:true, controlFirst:true });
        /*var header = new BABYLON.GUI.TextBlock();
        header.text = "Sides: 5";
        header.height = "30px";
        header.color = "white";
        header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        sliderPanel.addControl(header);*/
        // --
        var transformPanel = new BABYLON.GUI.StackPanel();
        metaPanel.addControl(transformPanel);
        var translateBtn = BABYLON.GUI.Button.CreateSimpleButton("translateBtn", "Translate");
        translateBtn.width = "100px";
        translateBtn.height = "40px";
        translateBtn.color = "white";
        translateBtn.cornerRadius = 20;
        translateBtn.background = "blue";
        translateBtn.onPointerUpObservable.add(function () { return _this._editControl.enableTranslation(); });
        transformPanel.addControl(translateBtn);
        var rotateBtn = BABYLON.GUI.Button.CreateSimpleButton("rotateBtn", "Rotate");
        rotateBtn.width = "100px";
        rotateBtn.height = "40px";
        rotateBtn.color = "white";
        rotateBtn.cornerRadius = 20;
        rotateBtn.background = "blue";
        rotateBtn.onPointerUpObservable.add(function () { return _this._editControl.enableRotation(); });
        transformPanel.addControl(rotateBtn);
        // TODO: scale only the shape, not the platforms
        var scaleBtn = BABYLON.GUI.Button.CreateSimpleButton("scaleBtn", "Scale");
        scaleBtn.width = "100px";
        scaleBtn.height = "40px";
        scaleBtn.color = "white";
        scaleBtn.cornerRadius = 20;
        scaleBtn.background = "blue";
        scaleBtn.onPointerUpObservable.add(function () { return _this._editControl.enableScaling(); });
        transformPanel.addControl(scaleBtn);
        //****
        //this._scene.onPointerObservable.add(handlePointer); //forgot where this came from.. EditControl??
        //this._editControl = this.attachEditControl(ground);
        // ---------------------------------    
        /*if (PLATFORM) // need to wait for loading.. this doesn't quite do it
        {
            let p = new Platform();
            this._editControl = this.attachEditControl(p.mesh);
        } */
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
    Game.prototype.deletePlatform = function () {
        if (this._selectedMesh.id != "masterPlatform") {
            this._selectedMesh.dispose();
            this._editControl.hide();
        }
    };
    Game.prototype.initiatePlatform = function () {
        PLATFORM = masterP;
        this._editControl = this.attachEditControl(PLATFORM);
        //masterP.visibility = 0;
        //masterP.isPickable = false;
    };
    Game.prototype.addLayoutShape = function () {
        var startingShape = new LayoutShape(layoutShapeSides_global, this._scene);
        this._editControl.switchTo(startingShape.pivotMesh);
        this._selectedMesh = startingShape.pivotMesh;
    };
    Game.prototype.addPlatform = function () {
        var p = new Platform(this._editControl.getPosition());
        this._editControl.switchTo(p.mesh);
        this._selectedMesh = p.mesh;
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
        this._selectedMesh = mesh;
        console.log(ec.isHidden());
        return ec;
    };
    Game.prototype.onPointerUp = function (evt) {
        var pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        var mesh;
        if (pick != null && pick.hit && !this._editControl.isEditing()) {
            mesh = pick.pickedMesh;
            this._editControl.switchTo(mesh);
            this._selectedMesh = mesh;
        }
        if (this._editControl.isHidden()) {
            this._editControl.show();
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
    function Platform(position) {
        if (position === void 0) { position = new BABYLON.Vector3(0, 0, 0); }
        this.mesh = PLATFORM.createInstance("platform");
        this.mesh.position = position;
    }
    return Platform;
}());
var LayoutShape = /** @class */ (function () {
    function LayoutShape(numSides, scene, pivot) {
        if (pivot === void 0) { pivot = new BABYLON.Vector3(0, 0, 0); }
        this.coordinates = [];
        this.indices = [];
        this.positions = [];
        this.platforms = [];
        this.pivotMesh = BABYLON.MeshBuilder.CreateSphere('pivotMesh', { segments: 1, diameter: 1 }, scene);
        this.pivotMesh.position = pivot;
        var angle = 2 * Math.PI / numSides;
        var radius = numSides;
        // if (radius < 5){radius = 5;}
        for (var i = 0; i < numSides; i++) {
            var x = radius * Math.sin(i * angle);
            var z = radius * Math.cos(i * angle);
            this.coordinates.push(x, 0, z);
            this.indices.push(i);
            this.positions.push(new BABYLON.Vector3(x, 0, z));
            var p = PLATFORM.createInstance("platform");
            p.position = this.positions[i];
            this.platforms.push(p);
            this.platforms[i].setParent(this.pivotMesh);
        }
        /*
        // shape polygon
        let shapeMesh = new BABYLON.Mesh("shape", this._scene);
        
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = coordinates;
        vertexData.indices = indices;
        vertexData.applyToMesh(shapeMesh);

        let mat = new BABYLON.StandardMaterial("mat", this._scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
        shapeMesh.material = mat;
        */
    }
    return LayoutShape;
}());
