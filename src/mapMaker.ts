///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
import EditControl = org.ssatguru.babylonjs.component.EditControl;

class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _light: BABYLON.Light;

    private _pointerup: EventListener; 
    
    private _editControl: EditControl;

    private _container = [];

    platformCount = 0;

    constructor(canvasElement : string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
        //this._engine.enableOfflineSupport = false; // to stop .manifest 404 error

        this._pointerup=(evt) => {return this.onPointerUp(evt)};

        this._canvas.addEventListener("pointerup", this._pointerup, false);
    }

    createScene() : void {
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.metadata = {steps:[]};

        this._camera = new BABYLON.ArcRotateCamera("perspective_default", Math.PI/4, Math.PI/4, 
                                                    20, new BABYLON.Vector3(0,0,0), this._scene);
        this._camera.wheelPrecision = 15;
        this._camera.inertia = 0.2;
        this._camera.panningInertia = 0.2;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, false);

        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);

        let ground = BABYLON.MeshBuilder.CreateGround('Grid',
                                {width: 20, height: 20, subdivisions: 20}, this._scene);
        ground.material = new BABYLON.StandardMaterial("GridMaterial", this._scene);
        ground.material.wireframe = true;
        ground.material.backFaceCulling = false;
        //ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        ground.isPickable = false;
        // ground.data = {uid: -1, type: 'staticSceneObject'}; // not sure what this is for

        // --------------
        /*
        BABYLON.SceneLoader.LoadAssetContainer("assets/", "platform.babylon", this._scene, function (_container) {
            var meshes = _container.meshes;
            var materials = _container.materials;
            //...
            console.log(_container);
            // Adds all elements to the scene
            _container.addAllToScene();
        });
        */
       BABYLON.SceneLoader.ImportMesh("", "assets/", "platform.babylon", this._scene, function (meshes) {
           meshes[0].scaling = new BABYLON.Vector3(0.01,0.01,0.01);
       });
        // GUI ---------------------------------
        let guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        let metaPanel = new BABYLON.GUI.StackPanel();
        metaPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        metaPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        guiTex.addControl(metaPanel);

        // --
        let topPanel = new BABYLON.GUI.StackPanel();
        metaPanel.addControl(topPanel);

        let saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.width = "150px"
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(() => this.saveScene());
        topPanel.addControl(saveBtn);

        let undoBtn = BABYLON.GUI.Button.CreateSimpleButton("undoBtn", "Undo");
        undoBtn.width = "150px"
        undoBtn.height = "40px";
        undoBtn.color = "white";
        undoBtn.cornerRadius = 20;
        undoBtn.background = "red";
        undoBtn.onPointerUpObservable.add(() => this._editControl.undo());
        topPanel.addControl(undoBtn);

        let platformBtn = BABYLON.GUI.Button.CreateSimpleButton("platformBtn", "Add Platform");
        platformBtn.width = "150px"
        platformBtn.height = "40px";
        platformBtn.color = "white";
        platformBtn.cornerRadius = 20;
        platformBtn.background = "orange";
        platformBtn.onPointerUpObservable.add(() => this.addPlatform());
        topPanel.addControl(platformBtn);
        
        // --
        let transformPanel = new BABYLON.GUI.StackPanel();
        metaPanel.addControl(transformPanel);

        let translateBtn = BABYLON.GUI.Button.CreateSimpleButton("translateBtn", "Translate");
        translateBtn.width = "100px"
        translateBtn.height = "40px";
        translateBtn.color = "white";
        translateBtn.cornerRadius = 20;
        translateBtn.background = "blue";
        translateBtn.onPointerUpObservable.add(() => this._editControl.enableTranslation());
        transformPanel.addControl(translateBtn);

        let rotateBtn = BABYLON.GUI.Button.CreateSimpleButton("rotateBtn", "Rotate");
        rotateBtn.width = "100px"
        rotateBtn.height = "40px";
        rotateBtn.color = "white";
        rotateBtn.cornerRadius = 20;
        rotateBtn.background = "blue";
        rotateBtn.onPointerUpObservable.add(() => this._editControl.enableRotation());
        transformPanel.addControl(rotateBtn);
        
        // TODO: scale only the shape, not the platforms
        let scaleBtn = BABYLON.GUI.Button.CreateSimpleButton("scaleBtn", "Scale");
        scaleBtn.width = "100px"
        scaleBtn.height = "40px";
        scaleBtn.color = "white";
        scaleBtn.cornerRadius = 20;
        scaleBtn.background = "blue";
        scaleBtn.onPointerUpObservable.add(() => this._editControl.enableScaling());
        transformPanel.addControl(scaleBtn);

        //****
        //this._scene.onPointerObservable.add(handlePointer); //forgot where this came from.. EditControl??
        this._editControl = this.attachEditControl(ground);
        
        // ---------------------------------

        //this.addPlatform();
        let startingShape = new LayoutShape(5, this._scene);
        this._editControl.switchTo(startingShape.pivotMesh);
        
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

// ----------------------------------------------------------
    
    addPlatform(position = new BABYLON.Vector3(0,0,0)) : void // make static method of Platform?
    {
        let id = "platform";
        id += this.platformCount;
        let p = new Platform(id,new BABYLON.Vector3(0,0,0), this._scene);
        this.platformCount ++;
        this._editControl.switchTo(p.mesh);
    }

    saveScene() : void 
    {
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

    attachEditControl(mesh: BABYLON.Mesh) : EditControl 
    {
        let ec:EditControl = new EditControl(mesh, this._camera, this._canvas, 0.75, true, 0.02);
        
        ec.enableTranslation();
        ec.setRotSnapValue(3.14/18);
        ec.setTransSnapValue(0.5);
        ec.setScaleSnapValue(0.25);

/*      ec.addActionStartListener(actionStartListener);
        ec.addActionListener(actionListener);
        ec.addActionEndListener(actionEndListener);
*/
        console.log(ec.isHidden());
        return ec;
    }

    onPointerUp(evt:Event) : void
    {
        let pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        let mesh:BABYLON.Mesh;
        if (pick != null && pick.hit && !this._editControl.isEditing())
        {
            mesh = pick.pickedMesh;
            // edit via transform node, re: Platform class? .. despite type complaint
            this._editControl.switchTo(mesh); 
            console.log("Picked", mesh);
        }       
    }
}

// -------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas');

    // Create the scene.
    game.createScene();

    // Start render loop.
    game.doRender();
});

// maybe use this transform node setup for parenting/grouping ??
class Platform
{
    transform:BABYLON.TransformNode; // maybe not necessary w/ mesh parenting available already
    mesh:BABYLON.Mesh;

    constructor(id:string, position:BABYLON.Vector3, scene:BABYLON.Scene)
    {
        this.transform = new BABYLON.TransformNode(id, scene);
        this.transform.position = position;
        this.mesh = BABYLON.MeshBuilder.CreateCylinder(id, {height: 0.5, diameter: 4}, scene);
        this.mesh.parent = this.transform;
    }

    setParent(target:BABYLON.TransformNode)
    {
        this.transform.parent = target;
    }

}

class LayoutShape
{
    coordinates : number[] = [];
    indices : number[] = [];
    positions : BABYLON.Vector3[] = [];
    platforms : Platform[] = [];

    pivotMesh : BABYLON.Mesh;

    constructor(numSides:number, scene:BABYLON.Scene, pivot = new BABYLON.Vector3(0,0,0), radius = 5)
    {
        this.pivotMesh = BABYLON.MeshBuilder.CreateSphere('pivotMesh', {segments:1, diameter:1}, scene);
        this.pivotMesh.position = pivot;
        
        let angle = 2 * Math.PI / numSides;
        
        for (let i=0; i<numSides; i++)
        {
            let x = radius * Math.sin(i * angle);
            let z = radius * Math.cos(i * angle);
        
            this.coordinates.push(x,0,z);
            this.indices.push(i);
            this.positions.push(new BABYLON.Vector3(x,0,z));
        
            this.platforms.push(new Platform("shapedPlatform", this.positions[i], scene))
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
}