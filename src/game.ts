import * as BABYLON from 'babylonjs';
import { int, Material, StandardMaterial, Vector3 } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie from './axie';

import Menu from "./menu";
import { createSkyBox, getZeroPlaneVector } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;
    private isHoveringOverDropZone1: Boolean = false;
    private isHoveringOverDropZone2: Boolean = false;
    private selectedMesh: BABYLON.Mesh;

    private drop_zone_1_axies = [];
    private play_field_axies = [];
    private drop_zone_1_axies_coordinates = new Map<int, int>();

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
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 4, 10, new BABYLON.Vector3(25, 25, 0), this.scene);
        this.camera.attachControl(this.canvas, true);

        createSkyBox(this.scene);
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 100 }, this.scene);
        ground.isPickable = false;

        const drop_zone1 = BABYLON.MeshBuilder.CreateGround("drop_zone1", { width: 20, height: 15 }, this.scene);
        drop_zone1.position = new BABYLON.Vector3(25, 0, 42.5);
        drop_zone1.actionManager = new BABYLON.ActionManager(this.scene);
        drop_zone1.actionManager.registerAction(
            new BABYLON.SwitchBooleanAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                this,
                'isHoveringOverDropZone1'
            )
        )
        drop_zone1.actionManager.registerAction(
            new BABYLON.SwitchBooleanAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                this,
                'isHoveringOverDropZone1'
            )
        )


        const drop_zone2 = BABYLON.MeshBuilder.CreateGround("drop_zone2", { width: 20, height: 15 }, this.scene);
        drop_zone2.position = new BABYLON.Vector3(25, 0, -42.5);

        const puffy = BABYLON.MeshBuilder.CreateSphere("puffy", { diameterZ: 1.5 });
        puffy.position = new BABYLON.Vector3(18, 1, 28);
        puffy.actionManager = new BABYLON.ActionManager(this.scene);

        const bubba = BABYLON.MeshBuilder.CreateBox("bubba", { width: 1, height: 1, depth: 1 });
        bubba.position = new BABYLON.Vector3(21, 1, 28);
        bubba.actionManager = new BABYLON.ActionManager(this.scene);

        const olek = BABYLON.MeshBuilder.CreateCylinder("olek", { diameterTop: 0, height: 1, diameterBottom: 1 });
        olek.position = new BABYLON.Vector3(24, 1, 28);
        olek.actionManager = new BABYLON.ActionManager(this.scene);

        const puffy_material = new BABYLON.StandardMaterial("puffy_material");
        puffy_material.diffuseColor = BABYLON.Color3.Blue();
        puffy.material = puffy_material;

        const bubba_material = new BABYLON.StandardMaterial("bubba_material");
        bubba_material.diffuseColor = BABYLON.Color3.Red();
        bubba.material = bubba_material;

        const olek_material = new BABYLON.StandardMaterial("olek_material");
        olek_material.diffuseColor = BABYLON.Color3.Green();
        olek.material = olek_material;

        var canvas_client_rect = this.scene.getEngine().getRenderingCanvasClientRect();

        const bullet_starting_position = new BABYLON.Vector3(0, 0.5, -47.8);

        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", { diameter: 0.1 });
        bullet.position = bullet_starting_position;

        const bullet_material = new BABYLON.StandardMaterial("bullet_material");
        bullet_material.diffuseColor = BABYLON.Color3.Black();
        bullet.material = bullet_material;

        const bunker = BABYLON.MeshBuilder.CreateBox("bunker", { width: 1, height: 0.5, depth: 2 })
        bunker.position.y = 0.25;
        bunker.position.z = -48;

        const bunker_material = new BABYLON.StandardMaterial("bunker_material");
        bunker_material.diffuseColor = BABYLON.Color3.Black();
        bunker.material = bunker_material;

        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERPICK:
                    console.log("pick " + pointerInfo.pickInfo.pickedMesh.id);
                    if (pointerInfo.pickInfo.hit) {
                        if (pointerInfo.pickInfo.pickedMesh.id === "drop_zone1") {
                            if (this.isHoveringOverDropZone1 && this.selectedMesh) {
                                var intersectsMesh = false;

                                for (var mesh of this.drop_zone_1_axies) {
                                    console.log(mesh.position);
                                    if (this.selectedMesh.intersectsMesh(mesh)) {
                                        intersectsMesh = true;
                                        break;
                                    }
                                }

                                if (!intersectsMesh) {
                                    this.drop_zone_1_axies.push(this.selectedMesh.clone());
                                } else {
                                    intersectsMesh = false;
                                }
                            }
                        } else if (this.selectedMesh) {
                            this.selectedMesh.dispose();
                            this.selectedMesh = null;
                        }
                        if (pointerInfo.pickInfo.pickedMesh.id === "puffy") {
                            this.selectedMesh = puffy.clone();
                        } else if (pointerInfo.pickInfo.pickedMesh.id === "bubba") {
                            this.selectedMesh = bubba.clone();
                        } else if (pointerInfo.pickInfo.pickedMesh.id === "olek") {
                            this.selectedMesh = olek.clone();
                        }
                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (this.selectedMesh) {
                        if (this.isHoveringOverDropZone1) {
                            var target = BABYLON.Vector3.Unproject(
                                new BABYLON.Vector3(this.scene.pointerX, this.scene.pointerY, 0),
                                canvas_client_rect.width,
                                canvas_client_rect.height,
                                BABYLON.Matrix.Identity(),
                                this.camera.getViewMatrix(),
                                this.camera.getProjectionMatrix()
                            );
                            target.x = this.camera.position.x - target.x;
                            target.y = this.camera.position.y - target.y;
                            target.z = this.camera.position.z - target.z;
                            this.selectedMesh.position = getZeroPlaneVector(this.camera.position, target);
                        } else {
                            this.selectedMesh.position = new BABYLON.Vector3(0, -100, 0);
                        }
                    }

            }
        });
        // let forward = sphere.position.subtract(bullet.position).normalize();
        // let fin = new BABYLON.Vector3(0, 0, -1);
        // let side = BABYLON.Vector3.Cross(forward, fin);
        // let nextForward = BABYLON.Vector3.Zero();

        let step = 0.25;
        let cloned = false;

        let forward = new BABYLON.Vector3(1, 0, 1);
        let fin = new BABYLON.Vector3(0, 0, -1);
        let side = BABYLON.Vector3.Cross(forward, fin);
        let nextForward = BABYLON.Vector3.Zero();

        this.scene.onBeforeRenderObservable.add(() => {
            if (!cloned && this.drop_zone_1_axies.length > 0) {

                this.drop_zone_1_axies.forEach((mesh) => {
                    var cloned_mesh = mesh.clone();
                    cloned_mesh.position.x = cloned_mesh.position.x - 25;
                    cloned_mesh.orientation = bunker.position.subtract(cloned_mesh.position);
                    this.play_field_axies.push(cloned_mesh);
                })

                cloned = true;
            }

            if (this.play_field_axies.length > 0) {
                this.play_field_axies.forEach((mesh) => {
                    if(mesh.position.z > -50){

                        mesh.movePOV(0, 0, step);
                        console.log("move");
                    }
                })

                let target = this.play_field_axies[0];

                nextForward = target.position.subtract(bullet.position).normalize();
                fin = BABYLON.Vector3.Cross(forward, nextForward);
                forward = nextForward;
                side = BABYLON.Vector3.Cross(forward, fin);
                let orientation = BABYLON.Vector3.RotationFromAxis(side, forward, fin);
                bullet.rotation = orientation;

                bullet.position.addInPlace(forward.scale(0.5));

                if (bullet.intersectsMesh(target)) {
                    this.play_field_axies.splice(0, 1);
                    target.dispose();
                    bullet.position = new BABYLON.Vector3(0, 0.5, -47.8);
                    if (this.play_field_axies.length == 0) {

                        cloned = false;
                    }
                }
            }
            // sphere.movePOV(0, 0, step);

            // bullet.position.addInPlace(forward.scale(bullet_speed));

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
