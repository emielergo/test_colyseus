import * as BABYLON from 'babylonjs';
import { int, Material, StandardMaterial, Vector3 } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie, { Bullet, Bunker } from './axie';

import Menu from "./menu";
import { createSkyBox, getRotationVectorFromTarget, getZeroPlaneVector } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private menuScene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;
    private isHoveringOverDropZone1: Boolean = false;
    private isHoveringOverDropZone2: Boolean = false;
    private selectedAxie: Axie;
    private cloned_counter = 0;

    private drop_zone_1_axies = [];
    private play_field_axies = [];
    private bullets = [];
    private drop_zone_1_axies_coordinates = new Map<int, int>();

    private room: Room<any>;
    private axiesByAxieIdBySessionId: Map<String, Map<String, Axie>> = new Map<String, Map<String, Axie>>();
    private axieNextPositionByAxieId: Map<String, BABYLON.Vector3> = new Map<String, BABYLON.Vector3>();
    private bunker_two: Bunker;

    constructor(canvas: HTMLCanvasElement, engine: BABYLON.Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;
    }

    initPlayers(): void {
        this.room.state.axieMaps.onAdd((axieMap, sessionId) => {
            const isCurrentPlayer = (sessionId === this.room.sessionId);

            // Set player mesh properties
            this.axiesByAxieIdBySessionId.set(sessionId, new Map<String, Axie>());

            // update local target position
            axieMap.axies.onAdd((axie) => {
                if (!isCurrentPlayer) {
                    const new_axie = new Axie(axie.id, 1, 5, axie.skin, (this.scene.getMeshById(axie.skin) as BABYLON.Mesh).clone(), this.bunker_two);
                    new_axie.setMesh(axie.skin, new_axie.mesh);
                    new_axie.mesh.position = new BABYLON.Vector3(axie.x, axie.y, axie.z);
                    this.cloned_counter++;
                    this.axiesByAxieIdBySessionId.get(sessionId).set(axie.id, new_axie);
                    this.axieNextPositionByAxieId.set(axie.id, new_axie.mesh.position);
                }

                axie.onChange((changes) => {
                    let next_position = new BABYLON.Vector3(0, 1, 0);
                    changes.forEach(change => {
                        if (change.field === "x") {
                            next_position._x = change.value;
                        }
                        if (change.field === "z") {
                            next_position._z = change.value;
                        }
                        this.axieNextPositionByAxieId.set(axie.id, next_position);
                    })
                });
                // axie.triggerAll();

            });

            axieMap.axies.onRemove((axie) => {
                if (!isCurrentPlayer) {
                    this.axiesByAxieIdBySessionId.get(sessionId).get(axie.id).mesh.dispose();
                    this.axiesByAxieIdBySessionId.get(sessionId).delete(axie.id);
                    this.axieNextPositionByAxieId.delete(axie.id);
                }
            })

            // axieMap.onChange((axie) => {
            //     this.axieNextPosition[axie.id].set(axie.mesh.position.x, axie.mesh.position.y, axie.mesh.position.z);
            // });
        });

        this.room.state.axieMaps.onRemove((player, playerId) => {
            // this.axiesByAxieIdBySessionId[playerId].forEach(axie =>{ axie.mesh.dispose()});
            // delete this.axiesByAxieIdBySessionId[playerId];
            // delete this.playerNextPosition[playerId];
        });

        this.room.onLeave(code => {
            this.gotoMenu();
        })
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
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 4, 30, new BABYLON.Vector3(25, 25, 0), this.scene);
        this.camera.attachControl(this.canvas, true);

        createSkyBox(this.scene);
        this.displayGameControls();
        this.initPlayers();

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
        olek.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1));

        var canvas_client_rect = this.scene.getEngine().getRenderingCanvasClientRect();

        const bullet_starting_position = new BABYLON.Vector3(0, 1, -47.8);

        const bullet_mesh = BABYLON.MeshBuilder.CreateSphere("bullet_mesh", { diameter: 0.1 });
        // const bullet_mesh = BABYLON.MeshBuilder.CreateCylinder("bullet_mesh", { diameterTop: 0, height: 1, diameterBottom: 1 });
        bullet_mesh.position = bullet_starting_position;

        const bullet_material = new BABYLON.StandardMaterial("bullet_material");
        bullet_material.diffuseColor = BABYLON.Color3.Black();
        bullet_mesh.material = bullet_material;

        const bunker_mesh = BABYLON.MeshBuilder.CreateBox("bunker_mesh", { width: 1, height: 2, depth: 2 })
        bunker_mesh.position = new BABYLON.Vector3(0, 1, -48);

        const bunker_material = new BABYLON.StandardMaterial("bunker_material");
        bunker_material.diffuseColor = BABYLON.Color3.Black();
        bunker_mesh.material = bunker_material;

        this.bunker_two = new Bunker(200, bunker_mesh.clone());

        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERPICK:
                    if (pointerInfo.pickInfo.hit) {
                        if (pointerInfo.pickInfo.pickedMesh.id === "drop_zone1") {
                            if (this.isHoveringOverDropZone1 && this.selectedAxie) {
                                var intersectsMesh = false;

                                for (var axie of this.drop_zone_1_axies) {
                                    if (this.selectedAxie.mesh.intersectsMesh(axie.mesh)) {
                                        intersectsMesh = true;
                                        break;
                                    }
                                }

                                if (!intersectsMesh) {
                                    const sessionId = this.room.sessionId;
                                    const clonedAxie = this.selectedAxie.clone(sessionId + this.cloned_counter);

                                    this.axiesByAxieIdBySessionId.get(sessionId).set(clonedAxie.id, clonedAxie);
                                    this.drop_zone_1_axies.push(clonedAxie);
                                } else {
                                    intersectsMesh = false;
                                }
                            }
                        } else if (this.selectedAxie && this.selectedAxie.mesh) {
                            this.selectedAxie.mesh.dispose();
                        } else {
                            this.selectedAxie = new Axie(this.room.sessionId + this.cloned_counter, 1, 1, null, null, this.bunker_two);
                            this.cloned_counter++;
                            if (pointerInfo.pickInfo.pickedMesh.id === "puffy") {
                                this.selectedAxie.setMesh("puffy", puffy.clone());
                            } else if (pointerInfo.pickInfo.pickedMesh.id === "bubba") {
                                this.selectedAxie.setMesh("bubba", bubba.clone());
                            } else if (pointerInfo.pickInfo.pickedMesh.id === "olek") {
                                this.selectedAxie.setMesh("olek", olek.clone());
                            }
                        }

                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (this.selectedAxie && this.selectedAxie.mesh) {
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
                            this.selectedAxie.mesh.position = getZeroPlaneVector(this.camera.position, target);
                        } else {
                            this.selectedAxie.mesh.position = new BABYLON.Vector3(0, -100, 0);
                        }
                    }

            }
        });

        const axie_speed = 0.25;
        const bullet_speed = 0.75;

        let frame = 0;
        let reload_time = 0;

        this.scene.onBeforeRenderObservable.add(() => {
            let remaining_bullets = [];
            if (frame % 120 == 0) {
                this.drop_zone_1_axies.forEach((axie) => {
                    var clonedAxie = axie.clone(this.room.sessionId + this.cloned_counter);
                    this.cloned_counter++;
                    clonedAxie.setMesh(axie.skin, clonedAxie.mesh);
                    this.room.send("insertAxie", {
                        id: clonedAxie.id,
                        skin: "puffy",
                        x: clonedAxie.mesh.position.x,
                        y: clonedAxie.mesh.position.y,
                        z: clonedAxie.mesh.position.z,
                    });
                    this.cloned_counter++;
                    this.play_field_axies.push(clonedAxie);
                })
            }

            if (this.play_field_axies.length > 0) {
                this.play_field_axies.forEach((axie) => {
                    if (!axie.isInRangeOfTarget()) {
                        axie.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(-1, 0, 0), axie.mesh, axie.target);
                        axie.mesh.movePOV(axie_speed, 0, 0);
                        this.room.send("updateAxie", {
                            id: axie.id,
                            x: axie.mesh.position.x,
                            y: axie.mesh.position.y,
                            z: axie.mesh.position.z,
                        });
                    }
                })

                let target = this.bunker_two.findClosestTarget(this.play_field_axies);

                if (reload_time == 0) {
                    var bullet = new Bullet(bullet_mesh.clone(), target);
                    this.bullets.push(bullet);
                    reload_time = 5;
                }
            }

            if (this.bullets.length > 0) {
                this.bullets.forEach((bullet) => {
                    bullet.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(1, 0, 0), bullet.mesh, bullet.target);
                    bullet.mesh.movePOV(bullet_speed, 0, 0);

                    if (bullet.mesh.intersectsMesh(bullet.target.mesh)) {
                        let index = this.play_field_axies.indexOf(bullet.target);

                        if (index !== -1) {
                            this.play_field_axies.splice(index, 1);
                        }

                        var target = bullet.target;
                        target.disposeIncomingBullets();
                        target.mesh.dispose();
                        this.axiesByAxieIdBySessionId
                        this.room.send("removeAxie", {
                            id: target.id
                        });
                    } else {
                        remaining_bullets.push(bullet);
                    }
                })
            }

            frame++;
            if (reload_time > 0) {
                reload_time--;
            }
            this.bullets = remaining_bullets;
        })


        this.menuScene = new BABYLON.Scene(this.engine);
        this.menuScene.autoClear = false;
        let camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this.menuScene);
        camera.useAutoRotationBehavior = true;
        camera.setTarget(BABYLON.Vector3.Zero());
        let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.menuScene);

        const attackPickMenu = new GUI.Rectangle("attackPickMenu");
        attackPickMenu.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        attackPickMenu.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        attackPickMenu.height = "100%";
        attackPickMenu.width = "10%";
        attackPickMenu.thickness = 0;

        // Button positioning
        const stackPanel = new GUI.StackPanel();
        stackPanel.isVertical = true;
        stackPanel.height = "50%";
        stackPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

        const button = GUI.Button.CreateImageWithCenterTextButton("testButton", "PUFFY ATTACK", "./public/btn-default.png");
            button.width = "90%";
            button.height = "55px";
            button.fontFamily = "Roboto";
            button.fontSize = "3%";
            button.thickness = 0;
            button.paddingTop = "10px"
            button.color = "#c0c0c0";
            button.onPointerClickObservable.add(async () => {
        });
        stackPanel.addControl(button);

        attackPickMenu.addControl(stackPanel);

        advancedTexture.addControl(attackPickMenu);


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
            for (let sessionId of this.axiesByAxieIdBySessionId.keys()) {
                if (sessionId != this.room.sessionId) {
                    const axiesById = this.axiesByAxieIdBySessionId.get(sessionId);
                    axiesById.forEach(axie => {
                        axie.mesh.position = BABYLON.Vector3.Lerp(axie.mesh.position, this.axieNextPositionByAxieId.get(axie.id), 0.05);
                    })
                }
            }
        });

        // Run the render loop.
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.menuScene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}

function findClosestTarget(play_field_axies: any[]) {
    throw new Error('Function not implemented.');
}

