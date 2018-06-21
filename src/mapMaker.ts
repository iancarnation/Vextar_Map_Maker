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
    
    editControl: EditControl;

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
        
        //****
        //this._scene.onPointerObservable.add(handlePointer);
        this.editControl = this.attachEditControl(ground);
        

        // ---------------------------------

        let platform = BABYLON.MeshBuilder.CreateCylinder("platform", {height: 0.5, diameter: 4}, this._scene);
        platform.position.y = 3;
        let platform2 = platform.createInstance("platform2");
        platform2.position.x = 5;
        let platform3 = platform.createInstance("platform3");
        platform3.position.x = 2.5;
        platform3.position.z = 5;


        let platformNode = new Platform("mrNode",new BABYLON.Vector3(0,0,0), this._scene);


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

    attachEditControl(mesh: BABYLON.Mesh) : EditControl {
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
        if (pick.hit)
        {
            mesh = pick.pickedMesh;
            this.editControl.switchTo(mesh.parent); // move transform node
            console.log("Picked", mesh);
        }       
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

class Platform
{
    node:BABYLON.TransformNode;
    mesh:BABYLON.Mesh;

    constructor(id:string, position:BABYLON.Vector3, scene:BABYLON.Scene)
    {
        this.node = new BABYLON.TransformNode(id, scene);
        this.node.position = position;
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("platform", {height: 0.5, diameter: 4}, scene);
        this.mesh.parent = this.node;
    }
}