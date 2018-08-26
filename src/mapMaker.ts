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

    platformCount = 0;

    constructor(canvasElement : string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);

        this._pointerup=(evt) => {return this.onPointerUp(evt)};

        this._canvas.addEventListener("pointerup", this._pointerup, false);
    }

    createScene() : void {
        this._scene = new BABYLON.Scene(this._engine);

        this._camera = new BABYLON.ArcRotateCamera("perspective_default", Math.PI/4, Math.PI/4, 
                                                    20, new BABYLON.Vector3(0,0,0), this._scene);
        this._camera.wheelPrecision = 15;
        this._camera.inertia = 0.2;
        this._camera.panningInertia = 0.2;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, false);

        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);
/*
        // Create a built-in "ground" shape.
        let ground = BABYLON.MeshBuilder.CreateGround('Grid',
                                {width: 20, height: 20, subdivisions: 20}, this._scene);
        ground.material = new BABYLON.StandardMaterial("GridMaterial", this._scene);
        ground.material.wireframe = true;
        ground.material.backFaceCulling = true;
        //ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        ground.isPickable = false;
        // ground.data = {uid: -1, type: 'staticSceneObject'}; // not sure what this is for
        */
        // ---------------------------------
        let guiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        let panel = new BABYLON.GUI.StackPanel();
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        guiTex.addControl(panel);

        let saveBtn = BABYLON.GUI.Button.CreateSimpleButton("saveBtn", "Save Map");
        saveBtn.width = "150px"
        saveBtn.height = "40px";
        saveBtn.color = "white";
        saveBtn.cornerRadius = 20;
        saveBtn.background = "green";
        saveBtn.onPointerUpObservable.add(() => this.saveScene());
        panel.addControl(saveBtn);

        let platformBtn = BABYLON.GUI.Button.CreateSimpleButton("platformBtn", "Add Platform");
        platformBtn.width = "150px"
        platformBtn.height = "40px";
        platformBtn.color = "white";
        platformBtn.cornerRadius = 20;
        platformBtn.background = "red";
        platformBtn.onPointerUpObservable.add(() => this.addPlatform());
        panel.addControl(platformBtn);
        //****
        //this._scene.onPointerObservable.add(handlePointer);
       // this._editControl = this.attachEditControl(ground);
        
        // ---------------------------------

        //this.addPlatform();

        let positions = [];
        let indices = [];
        let numSides = 5;
        let angle = 2 * Math.PI / numSides;
        let radius = 5;
        for (let i=0; i<numSides; i++)
        {
            let x = radius * Math.sin(i * angle);
            let z = radius * Math.cos(i * angle);
            positions.push(x,0,z);
            indices.push(i);
            let sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {segments:16, diameter:2}, this._scene);
            sphere.position.x = x;
            sphere.position.z = z;
        }
        console.log(positions);
        let customMesh = new BABYLON.Mesh("custom", this._scene);
        
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.applyToMesh(customMesh);

        let mat = new BABYLON.StandardMaterial("mat", this._scene);
	    mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
	    customMesh.material = mat;
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
    addPlatform() : void 
    {
        let name = "platform";
        name += this.platformCount;
        console.log(name);
        let p = new Platform(name,new BABYLON.Vector3(0,0,0), this._scene);
        this.platformCount ++;
        this._editControl.switchTo(p.transform);
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
        if (pick != null && pick.hit)
        {
            mesh = pick.pickedMesh;
            // edit via transform node, re: Platform class .. despite type complaint
            this._editControl.switchTo(mesh.parent); 
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
    transform:BABYLON.TransformNode;
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