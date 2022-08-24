import * as BABYLON from 'babylonjs';
import { int, Material, StandardMaterial, Vector3 } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie, { Bullet, Bunker } from './raid_objects';

import Menu from "./menu";
import { createBubba, createBulletMesh, createBunker, createOlek, createPuffy, createSkyBox, getRotationVectorFromTarget, getZeroPlaneVector } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private menuScene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;
    private render_loop: Boolean = true;

    public player_number;
    private enemy_session_id;
    private isHoveringOverOwnDropZone: Boolean = false;
    private selectedAxie: Axie;
    private cloned_counter = 0;

    // World
    private ground;
    private drop_zone_1;
    private drop_zone_2;
    private own_drop_zone;
    private drop_zone_axies = [];
    private play_field_axies = [];
    private enemy_play_field_axies = [];
    private bullets = [];

    private room: Room<any>;
    private axiesByAxieIdBySessionId: Map<String, Map<String, Axie>> = new Map<String, Map<String, Axie>>();
    private axieNextPositionByAxieId: Map<String, BABYLON.Vector3> = new Map<String, BABYLON.Vector3>();
    private bunkerBySessionId: Map<String, Bunker> = new Map<String, Bunker>();

    private own_bunker: Bunker;
    private target_bunker: Bunker;
    private puffy: BABYLON.Mesh;
    private bubba: BABYLON.Mesh;
    private olek: BABYLON.Mesh;
    private bullet;

    constructor(canvas: HTMLCanvasElement, engine: BABYLON.Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;
    }

    initWorld(): void {
        console.log('init World');
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 300 }, this.scene);
        this.ground.isPickable = false;

        const groundMat = new BABYLON.StandardMaterial("groundMat");
        groundMat.diffuseColor = new BABYLON.Color3(0, 1, 1);
        this.ground.material = groundMat; //Place the material property of the ground

        this.own_bunker = createBunker(this.scene);
        this.own_bunker.id = this.own_bunker.id + ' ' + this.player_number;

        this.target_bunker = createBunker(this.scene);
        (this.target_bunker.mesh.material as StandardMaterial).diffuseColor = BABYLON.Color3.Red();

        this.drop_zone_1 = BABYLON.MeshBuilder.CreateGround("drop_zone_1", { width: 30, height: 15 }, this.scene);
        this.drop_zone_1.position = new BABYLON.Vector3(0, 0, 162.5);

        this.drop_zone_2 = BABYLON.MeshBuilder.CreateGround("drop_zone_2", { width: 30, height: 15 }, this.scene);
        this.drop_zone_2.position = new BABYLON.Vector3(0, 0, -162.5);

        this.puffy = createPuffy(this.scene);
        this.bubba = createBubba(this.scene);
        this.olek = createOlek(this.scene);
        this.bullet = createBulletMesh(this.scene);
    }

    initPlayers(): void {
        this.room.state.players.onAdd((player, sessionId) => {
            const isCurrentPlayer = (sessionId === this.room.sessionId);

            // Set Player Specific Attributes
            if (isCurrentPlayer) {
                this.player_number = player.number;

                if (player.number == 1) {
                    this.camera.target = new BABYLON.Vector3(0, 0, 162.5);
                    this.camera.position = new BABYLON.Vector3(30, 50, 192.5);
                    this.own_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, 150);
                    this.target_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, -150);
                } else {
                    this.camera.target = new BABYLON.Vector3(0, 0, -162.5);
                    this.camera.position = new BABYLON.Vector3(-30, 50, -192.5);
                    this.own_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, -150);
                    this.target_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, 150);
                }

                // Create Bunker
                this.bunkerBySessionId.set(sessionId, this.own_bunker);

                // Create Drop Zone Actions
                if (player.number == 1) {
                    this.own_drop_zone = this.drop_zone_1;
                } else {
                    this.own_drop_zone = this.drop_zone_2;
                }

                this.own_drop_zone.actionManager = new BABYLON.ActionManager(this.scene);
                this.own_drop_zone.actionManager.registerAction(
                    new BABYLON.SwitchBooleanAction(
                        BABYLON.ActionManager.OnPointerOverTrigger,
                        this,
                        'isHoveringOverOwnDropZone'
                    )
                )
                this.own_drop_zone.actionManager.registerAction(
                    new BABYLON.SwitchBooleanAction(
                        BABYLON.ActionManager.OnPointerOutTrigger,
                        this,
                        'isHoveringOverOwnDropZone'
                    )
                )

                if (this.player_number == 2) {
                    this.puffy.position.z = - this.puffy.position.z;
                    this.bubba.position.z = - this.bubba.position.z;
                    this.olek.position.z = - this.olek.position.z;
                }
            } else {
                this.enemy_session_id = sessionId;

                this.bunkerBySessionId.set(sessionId, this.target_bunker);
            }

            // Set Global Attributes
            this.axiesByAxieIdBySessionId.set(sessionId, new Map<String, Axie>());

            // update local target position
            player.axies.onAdd((axie) => {
                if (!isCurrentPlayer) {
                    console.log("added enemy axie: " + axie.skin);
                    let new_axie = new Axie(axie.id, 1, 5, axie.skin, (this.scene.getMeshById(axie.skin) as BABYLON.Mesh).clone(), this.own_bunker);
                    new_axie.mesh.position = new BABYLON.Vector3(axie.x, axie.y, axie.z);
                    this.axiesByAxieIdBySessionId.get(sessionId).set(new_axie.id, new_axie);
                    this.axieNextPositionByAxieId.set(new_axie.id, new_axie.mesh.position);


                    axie.onChange((changes) => {
                        this.axieNextPositionByAxieId.set(axie.id, new BABYLON.Vector3(axie.x, axie.y, axie.z));

                    });
                }
            });

            player.axies.onRemove((axie) => {
                if (!isCurrentPlayer) {
                    this.axiesByAxieIdBySessionId.get(sessionId).get(axie.id).mesh.dispose();
                    this.axiesByAxieIdBySessionId.get(sessionId).delete(axie.id);
                    this.axieNextPositionByAxieId.delete(axie.id);
                }
            })

            player.bunker.onChange((changes) => {
                changes.forEach(change => {
                    if (!isCurrentPlayer) {
                        // if (this.target_bunker) {
                        //     this.target_bunker.hp = change.value;
                        // }
                    } else {
                        this.own_bunker.hp = change.value;
                    }
                })
            })

        });

        this.room.state.players.onRemove((player, playerId) => {
            // this.axiesByAxieIdBySessionId[playerId].forEach(axie =>{ axie.mesh.dispose()});
            // delete this.axiesByAxieIdBySessionId[playerId];
            // delete this.playerNextPosition[playerId];
        });

        this.room.onLeave(code => {
            this.gotoMenu();
        })
    }

    displayGameControls() {
        console.log('display Game Controls');
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("textUI");

        const playerInfo = new GUI.TextBlock("playerInfo");
        playerInfo.text = `Room name: ${this.room.name}      Player ${this.player_number}: ${this.room.sessionId}`.toUpperCase();
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
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 4, 30, new BABYLON.Vector3(25, 25, 120), this.scene);
        this.camera.attachControl(this.canvas, true);

        createSkyBox(this.scene);
        this.displayGameControls();
        this.initWorld();
        this.initPlayers();

        var canvas_client_rect = this.scene.getEngine().getRenderingCanvasClientRect();

        // OBSERVABLES
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERPICK:
                    if (pointerInfo.pickInfo.hit) {
                        if (pointerInfo.pickInfo.pickedMesh.id === this.own_drop_zone.id) {
                            if (this.isHoveringOverOwnDropZone && this.selectedAxie) {
                                var intersectsMesh = false;

                                for (var axie of this.drop_zone_axies) {
                                    if (this.selectedAxie.mesh.intersectsMesh(axie.mesh)) {
                                        intersectsMesh = true;
                                        break;
                                    }
                                }

                                if (!intersectsMesh) {
                                    const sessionId = this.room.sessionId;
                                    const clonedAxie = this.selectedAxie.clone(sessionId);

                                    this.axiesByAxieIdBySessionId.get(sessionId).set(clonedAxie.id, clonedAxie);
                                    this.drop_zone_axies.push(clonedAxie);
                                } else {
                                    intersectsMesh = false;
                                }
                            }
                        } else {
                            if (this.selectedAxie && this.selectedAxie.mesh) {
                                this.selectedAxie.mesh.dispose();
                            }

                            this.selectedAxie = new Axie(this.room.sessionId, 1, 1, null, null, this.target_bunker);
                            let skin;
                            if (pointerInfo.pickInfo.pickedMesh.id === "puffy") {
                                this.selectedAxie.setMesh(this.puffy.clone());
                                skin = "puffy";
                            } else if (pointerInfo.pickInfo.pickedMesh.id === "bubba") {
                                this.selectedAxie.setMesh(this.bubba.clone());
                                skin = "bubba";
                            } else if (pointerInfo.pickInfo.pickedMesh.id === "olek") {
                                this.selectedAxie.setMesh(this.olek.clone());
                                skin = "olek";
                            }
                            this.selectedAxie.offsetPositionForSpawn(this.player_number == 1);
                            this.selectedAxie.setSkin(skin);
                            this.selectedAxie.mesh.isPickable = false;
                        }

                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (this.selectedAxie && this.selectedAxie.mesh) {
                        if (this.isHoveringOverOwnDropZone) {
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

        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    console.log("KEY DOWN: ", kbInfo.event.code);
                    if (kbInfo.event.code == 'Space') {
                        this.render_loop = !this.render_loop;
                    }
                    break;
            }
        });

        const axie_speed = 0.25;
        const bullet_speed = 0.75;

        let frame = 0;
        let reload_time = 0;

        // RENDERLOOP
        this.scene.onBeforeRenderObservable.add(() => {
            let remaining_bullets = [];
            if (frame % 120 == 0 && this.enemy_session_id) {
                this.drop_zone_axies.forEach((axie) => {
                    var clonedAxie = axie.clone(this.room.sessionId + this.cloned_counter);
                    this.cloned_counter++;
                    clonedAxie.offsetPositionForSpawn(this.player_number == 1);
                    clonedAxie.setSkin(axie.skin);
                    this.room.send("insertAxie", {
                        id: clonedAxie.id,
                        skin: axie.skin,
                        x: clonedAxie.mesh.position.x,
                        y: clonedAxie.mesh.position.y,
                        z: clonedAxie.mesh.position.z,
                    });
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

                if (this.axiesByAxieIdBySessionId.get(this.enemy_session_id).size > 0) {
                    let target = this.own_bunker.findClosestTarget(this.axiesByAxieIdBySessionId.get(this.enemy_session_id).values());
                    if (reload_time == 0) {
                        var bullet = new Bullet(this.bullet.clone(), target, bullet_speed);
                        bullet.mesh.position = this.own_bunker.mesh.position.clone();
                        this.bullets.push(bullet);
                        reload_time = 5;
                    }
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

            this.bullets = remaining_bullets;
            if (reload_time > 0) {
                reload_time--;
            }
            frame++;
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
                        // axie.mesh.position = this.axieNextPositionByAxieId.get(axie.id);
                        axie.mesh.position = BABYLON.Vector3.Lerp(axie.mesh.position, this.axieNextPositionByAxieId.get(axie.id), 0.05);
                    })
                }
            }
        });

        // Run the render loop.
        this.engine.runRenderLoop(() => {
            if (this.render_loop) {
                this.scene.render();
                this.menuScene.render();
            }
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

}
