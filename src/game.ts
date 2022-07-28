import * as BABYLON from 'babylonjs';
import { Material, StandardMaterial } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie from './axie';

import Menu from "./menu";
import { createSkyBox } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;

    private room: Room<any>;
    private playerEntities: { [playerId: string]: BABYLON.Mesh } = {};
    private playerNextPosition: { [playerId: string]: BABYLON.Vector3 } = {};

    constructor(canvas: HTMLCanvasElement, engine: BABYLON.Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;
    }

    initPlayers(): void {
        this.room.state.players.onAdd((player, sessionId) => {
            const isCurrentPlayer = (sessionId === this.room.sessionId);

            const sphere = BABYLON.MeshBuilder.CreateSphere(`player-${sessionId}`, {
                segments: 8,
                diameter: 40
            }, this.scene);

            // Set player mesh properties
            const sphereMaterial = new BABYLON.StandardMaterial(`playerMat-${sessionId}`, this.scene);
            sphereMaterial.emissiveColor = (isCurrentPlayer) ? BABYLON.Color3.FromHexString("#ff9900") : BABYLON.Color3.Gray();
            sphere.material = sphereMaterial;

            // Set player spawning position
            sphere.position.set(player.x, player.y, player.z);

            this.playerEntities[sessionId] = sphere;
            this.playerNextPosition[sessionId] = sphere.position.clone();

            // update local target position
            player.onChange(() => {
                this.playerNextPosition[sessionId].set(player.x, player.y, player.z);
            });
        });

        this.room.state.players.onRemove((player, playerId) => {
            this.playerEntities[playerId].dispose();
            delete this.playerEntities[playerId];
            delete this.playerNextPosition[playerId];
        });

        this.room.onLeave(code => {
            this.gotoMenu();
        })
    }

    createGround(): void {
        // Create ground plane
        const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: GROUND_SIZE }, this.scene);
        plane.position.y = -15;
        plane.rotation.x = Math.PI / 2;

        let floorPlane = new BABYLON.StandardMaterial('floorTexturePlane', this.scene);
        floorPlane.diffuseTexture = new BABYLON.Texture('./public/ground.jpg', this.scene);
        floorPlane.backFaceCulling = false; // Always show the front and the back of an element

        let materialPlane = new BABYLON.MultiMaterial('materialPlane', this.scene);
        materialPlane.subMaterials.push(floorPlane);

        plane.material = materialPlane;
    }

    displayGameControls() {
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("textUI");

        const playerInfo = new GUI.TextBlock("playerInfo");
        playerInfo.text = `Room name: ${this.room.name}      Player: ${this.room.sessionId}`.toUpperCase();
        playerInfo.color = "#eaeaea";
        playerInfo.fontFamily = "Roboto";
        playerInfo.fontSize = 20;
        playerInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        playerInfo.paddingTop = "10px";
        playerInfo.paddingLeft = "10px";
        playerInfo.outlineColor = "#000000";
        advancedTexture.addControl(playerInfo);

        const instructions = new GUI.TextBlock("instructions");
        instructions.text = "CLICK ANYWHERE ON THE GROUND!";
        instructions.color = "#fff000"
        instructions.fontFamily = "Roboto";
        instructions.fontSize = 24;
        instructions.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        instructions.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        instructions.paddingBottom = "10px";
        advancedTexture.addControl(instructions);

        // back to menu button
        const button = GUI.Button.CreateImageWithCenterTextButton("back", "<- BACK", "./public/btn-default.png");
        button.width = "100px";
        button.height = "50px";
        button.fontFamily = "Roboto";
        button.thickness = 0;
        button.color = "#f8f8f8";
        button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        button.paddingTop = "10px";
        button.paddingRight = "10px";
        button.onPointerClickObservable.add(async () => {
            await this.room.leave(true);
        });
        advancedTexture.addControl(button);
    }

    bootstrap(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.light = new BABYLON.HemisphericLight("pointLight", new BABYLON.Vector3(), this.scene);
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, -48), this.scene);
        this.camera.attachControl(this.canvas, true);

        const bullet_speed = 0.5;
        const bullet_starting_position = new BABYLON.Vector3(0, 0.5, -47.8);
        const sphere_starting_position = new BABYLON.Vector3(0, 0.5, 49);

        createSkyBox(this.scene);

        var axie = new Axie(4);

        var sphere_material = new BABYLON.StandardMaterial("sphere_material", this.scene);
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameterZ: 1.5 }, this.scene);
        sphere.position = sphere_starting_position;
        sphere.material = sphere_material;
        axie.mesh = sphere;

        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", { diameter: 0.1 });
        bullet.position = bullet_starting_position;

        const bullet_material = new BABYLON.StandardMaterial("bulletMat");
        bullet_material.diffuseColor = BABYLON.Color3.Black();
        bullet.material = bullet_material; //Place the material property of the ground
        // bullet.orientation = BABYLON.Vector3(0,1,0);


        const bunker = BABYLON.MeshBuilder.CreateBox("bunker", { width: 1, height: 0.5, depth: 2 })
        bunker.position.y = 0.25;
        bunker.position.z = -48;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 100 }, this.scene);

        const drop_zone1 = BABYLON.MeshBuilder.CreateGround("drop_zone1", { width: 20, height: 15 }, this.scene);
        drop_zone1.position = new BABYLON.Vector3(25, 0, 42.5);

        const drop_zone2 = BABYLON.MeshBuilder.CreateGround("drop_zone2", { width: 20, height: 15 }, this.scene);
        drop_zone2.position = new BABYLON.Vector3(25, 0, -42.5);

        const wireMat = new BABYLON.StandardMaterial("wireMat");
        wireMat.wireframe = true;

        let forward = sphere.position.subtract(bullet.position).normalize();
        let fin = new BABYLON.Vector3(0, 0, -1);
        let side = BABYLON.Vector3.Cross(forward, fin);
        let nextForward = BABYLON.Vector3.Zero();

        let step = 0.25;

        this.scene.onBeforeRenderObservable.add(() => {
            sphere.movePOV(0, 0, step);

            if (sphere.position.z < - 49 || sphere.position.z > 49) {
                step = -step;
            }

            nextForward = sphere.position.subtract(bullet.position).normalize();
            fin = BABYLON.Vector3.Cross(forward, nextForward);
            forward = nextForward;
            side = BABYLON.Vector3.Cross(forward, fin);
            let orientation = BABYLON.Vector3.RotationFromAxis(side, forward, fin);
            bullet.rotation = orientation;

            bullet.position.addInPlace(forward.scale(bullet_speed));

            if (sphere.intersectsMesh(bunker, true) || bullet.intersectsMesh(sphere, true)) {
                axie.hp--;
                bullet.position = new BABYLON.Vector3(0, 0.5, -47.8);
            } else {
            }

            if (axie.hp == 3) {
                (axie.mesh.material as StandardMaterial).diffuseColor = BABYLON.Color3.Green();
            } else if (axie.hp == 2) {
                (axie.mesh.material as StandardMaterial).diffuseColor = BABYLON.Color3.Yellow();
            } else if (axie.hp == 1) {
                (axie.mesh.material as StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0.5, 0.3);
            } else if (axie.hp == 0) {
                (axie.mesh.material as StandardMaterial).diffuseColor = BABYLON.Color3.Black();
                axie.mesh.position = new BABYLON.Vector3(0, 0.5, 49);
                axie.hp = 3;
            }

        })

        this.doRender();
    }

    private gotoMenu() {
        this.scene.dispose();
        const menu = new Menu('renderCanvas');
        menu.createMenu();
    }

    private doRender(): void {
        // constantly lerp players
        this.scene.registerBeforeRender(() => {
            for (let sessionId in this.playerEntities) {
                const entity = this.playerEntities[sessionId];
                const targetPosition = this.playerNextPosition[sessionId];
                entity.position = BABYLON.Vector3.Lerp(entity.position, targetPosition, 0.05);
            }
        });

        // Run the render loop.
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
