import { Nullable } from 'babylonjs';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'
import { createBubba } from '../../utils';

@customElement('gui-axie-preview')
export class GuiAxiePreview extends LitElement {
    static styles = [
        css`
            .preview {
                max-width: 64px;
                max-height: 64px;
                user-select: none;
                pointer-events: all;
                background: linear-gradient(var(--ui-palette-blue),var(--ui-palette-lightblue));
                border-radius: 8px;
                cursor: pointer;
                border-width: 2px;
                border-style: solid;
                border-color: #303030;
                transition: 400ms all var(--ui-easing-bounce);
            }

            .preview.hidden {
                visibility: hidden;
            }

            .preview:hover, .preview.active {
                border-color: #bfbfbf;
                transform: scale(1.07);
                transition: 400ms all var(--ui-easing-bounce);
            }

            img {
                display: flex;
            }
        `
    ];

    connectedCallback() {
        super.connectedCallback();
        this.initScene();
    }

    @property({type: String})
    public meshName :string = '';

    @property({type: Boolean})
    public active :boolean = false;

    private img: string;

    initScene() {
        let canvas = document.createElement('canvas');
        canvas.height = 100;
        canvas.width = 100;
        canvas.style.visibility = 'hidden';
        canvas.style.background = 'var(--ui-palette-blue)';
        this.renderRoot.appendChild(canvas);
        let engine = new BABYLON.Engine(canvas, true);
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        scene.autoClear = false;
        const camera = new BABYLON.FreeCamera('pre-render', new BABYLON.Vector3(1, 1, 3), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        let rootMesh: Nullable<BABYLON.AbstractMesh>;
        BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", `${this.meshName}.babylon`).then((result) => {
            rootMesh = scene.getMeshByName(this.meshName);
            if(!rootMesh){
                this.meshName = "Cube";
                rootMesh = scene.getMeshByName(this.meshName);
                console.log(rootMesh);
                console.log(rootMesh.position);
                camera.position = new BABYLON.Vector3(2, 2, 6)
            }
            rootMesh?.position.set(0,0,0);
            result.meshes.forEach(mesh => {
                if (mesh.id != this.meshName) {
                    mesh.parent = rootMesh;
                }
            });
            if(this.meshName == "Cube"){
                rootMesh?.rotate(BABYLON.Vector3.Up(), -90);
            }
            engine.runRenderLoop(() => scene.render());
            setTimeout(() => BABYLON.Tools.CreateScreenshot(engine, camera, {width: 64, height: 64}, (data) => {
                console.log(data);
                this.img = data;
                scene.dispose();
                engine.dispose();
                this.renderRoot.removeChild(canvas);
                this.update();
            }), 1000);
        });
    }

    render() {
        return html`<div class="preview ${this.img ? '' : 'hidden'} ${this.active ? 'active' : ''}"><img width="64" height="64" src=${this.img}/></div>`;
    }
}
