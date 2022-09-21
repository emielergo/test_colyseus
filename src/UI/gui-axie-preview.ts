import { Nullable } from 'babylonjs';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'
import { createBubba } from '../../utils';

@customElement('gui-axie-preview')
export class GuiAxiePreview extends LitElement {
    static styles = [
        css`
            :host {
                display: block;
            }
        `
    ];

    connectedCallback() {
        super.connectedCallback();
        this.initScene();
    }

    @property({type: String})
    public meshName :string = '';

    private img: string;

    initScene() {
        const canvas = document.createElement('canvas');
        canvas.height = 100;
        canvas.width = 100;
        canvas.style.visibility = 'hidden';
        this.renderRoot.appendChild(canvas);
        const engine = new BABYLON.Engine(canvas, true);
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.FreeCamera('pre-render', new BABYLON.Vector3(0, 5, -10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        let rootMesh: Nullable<BABYLON.AbstractMesh>;
        BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", `${this.meshName}.babylon`).then((result) => {
            rootMesh = scene.getMeshByName(this.meshName);
            rootMesh?.position.set(0,0,0);
            result.meshes.forEach(mesh => {
                if (mesh.id != this.meshName) {
                    mesh.parent = rootMesh;
                }
            });
            engine.runRenderLoop(() => scene.render());
            setTimeout(() => BABYLON.Tools.CreateScreenshot(engine, camera, {width: 64, height: 64}, (data) => {
                console.log(data);
                this.img = data;
                this.update();
            }), 1000);
        });
    }

    render() {
        return html`<img width="64" height="64" src=${this.img}/>`;
    }
}
