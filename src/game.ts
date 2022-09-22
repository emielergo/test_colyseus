import * as BABYLON from 'babylonjs';
import { StandardMaterial } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie, { Bullet, Bunker } from './raid_objects';

import Menu, { MoveSetMenu } from "./menu";
import { createBubba, createBulletMesh, createBunker, createButton, createHealthBarMesh, createOlek, createPuffy, createSkyBox, getRotationVectorFromTarget, getZeroPlaneVector, setCrystalText, setEnergyText } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private room: Room<any>;
    private MoveSetMenu: MoveSetMenu;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;
    private render_loop: Boolean = true;

    public player_number;
    public energy = 0;
    private energy_text_block;
    public crystal = 0;
    private crystal_text_block;
    private enemy_session_id;
    private isHoveringOverOwnDropZone: Boolean = false;
    private show_moveset_menu: Boolean = false;
    private selectedAxie: Axie;
    private cloned_counter = 0;

    // World
    private ground;
    private drop_zone_1;
    private drop_zone_2;
    private own_drop_zone;
    private drop_zone_axies = [];
    private bullets = [];

    private axiesByAxieIdBySessionId: Map<String, Map<String, Axie>> = new Map<String, Map<String, Axie>>();
    private axieNextPositionByAxieId: Map<String, BABYLON.Vector3> = new Map<String, BABYLON.Vector3>();
    private bunkerBySessionId: Map<String, Bunker> = new Map<String, Bunker>();
    private axiesByLongitude: Map<number, Axie[]> = new Map<number, Axie[]>();
    private axiesByLatitude: Map<number, Axie[]> = new Map<number, Axie[]>();

    private own_bunker: Bunker;
    private target_bunker: Bunker;
    private puffy: Axie;
    private bubba: Axie;
    private olek: Axie;
    private bullet;
    private health_bar;

    constructor(canvas: HTMLCanvasElement, engine: BABYLON.Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;
    }

    displayGameControls() {
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

        this.energy_text_block = new GUI.TextBlock("energy");
        this.energy_text_block.text = `Energy: ${this.energy}`.toUpperCase();
        this.energy_text_block.color = "#eaeaea";
        this.energy_text_block.fontFamily = "Roboto";
        this.energy_text_block.fontSize = 20;
        this.energy_text_block.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.energy_text_block.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.energy_text_block.paddingTop = "30px";
        this.energy_text_block.paddingLeft = "10px";
        this.energy_text_block.outlineColor = "#000000";
        advancedTexture.addControl(this.energy_text_block);

        this.crystal_text_block = new GUI.TextBlock("crystal");
        this.crystal_text_block.text = `Crystals: ${this.crystal}`.toUpperCase();
        this.crystal_text_block.color = "#eaeaea";
        this.crystal_text_block.fontFamily = "Roboto";
        this.crystal_text_block.fontSize = 20;
        this.crystal_text_block.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.crystal_text_block.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.crystal_text_block.paddingTop = "50px";
        this.crystal_text_block.paddingLeft = "10px";
        this.crystal_text_block.outlineColor = "#000000";
        advancedTexture.addControl(this.crystal_text_block);

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

    async initWorld(): Promise<void> {
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

        this.puffy = await createPuffy(this.scene);
        this.bubba = await createBubba(this.scene);
        this.olek = await createOlek(this.scene);
        this.bullet = createBulletMesh(this.scene);
        this.health_bar = createHealthBarMesh(this.scene);

        // const axes = new BABYLON.AxesViewer(this.scene, 10);
        // axes.xAxis.parent = this.olek.mesh;
        // axes.yAxis.parent = this.olek.mesh;
        // axes.zAxis.parent = this.olek.mesh;
    }

    initPlayers(): void {
        this.room.state.players.onAdd((player, sessionId) => {
            const isCurrentPlayer = (sessionId === this.room.sessionId);

            // Set Player Specific Attributes
            if (isCurrentPlayer) {
                this.player_number = player.number;
                this.crystal = 10;
                setCrystalText(this);

                if (player.number == 1) {
                    this.camera.target = new BABYLON.Vector3(0, 0, 162.5);
                    this.camera.position = new BABYLON.Vector3(30, 50, 192.5);
                    this.own_bunker.mesh.position = new BABYLON.Vector3(0, 1, 150);
                    this.target_bunker.mesh.position = new BABYLON.Vector3(0, 1, -150);
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
                    this.puffy.mesh.position.z = - this.puffy.mesh.position.z;
                    this.bubba.mesh.position.z = - this.bubba.mesh.position.z;
                    this.olek.mesh.position.z = - this.olek.mesh.position.z;
                } else {
                    this.puffy.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(-1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, -1));
                    this.bubba.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(-1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, -1));
                    this.olek.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(-1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, -1));
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
                    let new_axie = new Axie(axie.id, axie.hp, axie.range, axie.damage, axie.level, axie.skin, (this.scene.getMeshById(axie.skin) as BABYLON.Mesh).clone(), this.own_bunker);
                    new_axie.mesh.position = new BABYLON.Vector3(axie.x, axie.y, axie.z);
                    new_axie.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(0, 1, 0), new_axie.mesh, new_axie.target);
                    this.axiesByAxieIdBySessionId.get(sessionId).set(new_axie.id, new_axie);
                    this.axieNextPositionByAxieId.set(new_axie.id, new_axie.mesh.position);

                    axie.onChange((changes) => {
                        this.axieNextPositionByAxieId.set(axie.id, new BABYLON.Vector3(axie.x, axie.y, axie.z));

                    });
                }
            });

            player.axies.onRemove((axie) => {
                const axieToRemove = this.axiesByAxieIdBySessionId.get(sessionId).get(axie.id)
                if (axieToRemove) {
                    axieToRemove.mesh.dispose();
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

    setObservables(): void {
        var canvas_client_rect = this.scene.getEngine().getRenderingCanvasClientRect();
        const axie_names = ["puffy", "bubba", "olek"];
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERPICK:
                    if (pointerInfo.pickInfo.hit) {
                        const clicked_mesh_id = pointerInfo.pickInfo.pickedMesh.id
                        if (clicked_mesh_id === this.own_drop_zone.id) {
                            // if (this.isHoveringOverOwnDropZone && this.selectedAxie) { //TESTING
                                if (this.isHoveringOverOwnDropZone && this.selectedAxie && this.energy > 20) {
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

                                    clonedAxie.mesh.isPickable = true;
                                    this.drop_zone_axies.push(clonedAxie);
                                    this.energy -= 20;
                                    setEnergyText(this);
                                } else {
                                    intersectsMesh = false;
                                }
                                this.crystal++;
                                setCrystalText(this);
                            }
                        } else if (!axie_names.includes(clicked_mesh_id) && axie_names.includes(clicked_mesh_id.replace(/\./g, ''))) {
                            this.show_moveset_menu = true;
                        } else if (axie_names.includes(clicked_mesh_id)) {
                            if (this.selectedAxie && this.selectedAxie.mesh) {
                                this.selectedAxie.mesh.dispose();
                            }

                            let starter;
                            if (clicked_mesh_id === "puffy") {
                                starter = this.puffy;
                            } else if (clicked_mesh_id === "bubba") {
                                starter = this.bubba;
                            } else if (clicked_mesh_id === "olek") {
                                starter = this.olek;
                            }
                            this.selectedAxie = starter.clone();
                            this.selectedAxie.setTarget(this.target_bunker);
                            this.selectedAxie.active_cards = starter.active_cards;
                            this.selectedAxie.cards_list = starter.cards_list;
                            this.selectedAxie.setHp(320);
                            this.selectedAxie.setDamageAndRangeFromCards();
                            this.selectedAxie.offsetPositionForSpawn(this.player_number == 1);
                            this.selectedAxie.mesh.isPickable = false;
                            this.MoveSetMenu.setMoveSetImages(this.selectedAxie.skin);
                            this.MoveSetMenu.setSelectedCards(this.selectedAxie);
                        }
                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (this.selectedAxie && this.selectedAxie.mesh) {
                        if (this.isHoveringOverOwnDropZone && this.selectedAxie.level) {
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
                    if (kbInfo.event.code == 'Space') {
                        this.render_loop = !this.render_loop;
                    }
                    break;
            }
        });
    }

    setRenderLoopObservable(): void {
        // const axie_speed = this.player_number == 1 ? 0.25 : -0.25;
        const axie_speed = -0.25;
        let frame = 0;
        let reload_time = 0;

        this.scene.onBeforeRenderObservable.add(() => {
            const remaining_bullets = [];
            const enemyAxieMap = this.axiesByAxieIdBySessionId.get(this.enemy_session_id);

            if (frame % 300 == 0 && this.enemy_session_id) {
            // if (frame % 300 == 0) { // TESTING
                this.drop_zone_axies.forEach((axie) => {
                    var clonedAxie = axie.clone(this.room.sessionId + this.cloned_counter);
                    this.cloned_counter++;
                    clonedAxie.offsetPositionForSpawn(this.player_number == 1);
                    clonedAxie.setSkin(axie.skin);
                    this.room.send("insertAxie", {
                        id: clonedAxie.id,
                        hp: clonedAxie.hp,
                        range: clonedAxie.range,
                        damage: clonedAxie.damage,
                        level: clonedAxie.level,
                        skin: axie.skin,
                        x: clonedAxie.mesh.position.x,
                        y: clonedAxie.mesh.position.y,
                        z: clonedAxie.mesh.position.z,
                    });
                    clonedAxie.longitude = clonedAxie.mesh.position.z;
                    clonedAxie.latitude = clonedAxie.mesh.position.x;
                    this.axiesByAxieIdBySessionId.get(this.room.sessionId).set(clonedAxie.id, clonedAxie);
                    if (this.axiesByLongitude.get(Math.round(axie.longitude)) == null) {
                        this.axiesByLongitude.set(Math.round(axie.longitude), [clonedAxie]);
                    } else {
                        this.axiesByLongitude.get(Math.round(axie.longitude)).push(clonedAxie);
                    }
                    if (this.axiesByLatitude.get(Math.round(axie.latitude)) == null) {
                        this.axiesByLatitude.set(Math.round(axie.latitude), [clonedAxie]);
                    } else {
                        this.axiesByLatitude.get(Math.round(axie.latitude)).push(clonedAxie);
                    }
                    clonedAxie.setHealthBar(this.health_bar);
                })
            }

            // MOVE AND ATTACK WITH AXIES
            let play_field_axies = this.axiesByAxieIdBySessionId.get(this.room.sessionId);
            if (play_field_axies && play_field_axies.size > 0) {
                play_field_axies.forEach((axie) => {
                    axie.locateTarget(this.axiesByAxieIdBySessionId.get(this.enemy_session_id), this.target_bunker);
                    if (this.render_loop) {
                        if (!axie.isInRangeOfTarget()) {
                            axie.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(0, 1, 0), axie.mesh, axie.target);
                            let should_move = !axie.intersectsGivenAxies(play_field_axies.values(), new BABYLON.Vector3(axie.mesh.position.x, axie.mesh.position.y, axie.mesh.position.z + axie_speed + 1));
                            // TODO: Dit moet veel performanter!
                            if (should_move) {
                                axie.mesh.movePOV(0, 0, axie_speed);
                                this.room.send("updateAxie", {
                                    id: axie.id,
                                    x: axie.mesh.position.x,
                                    y: axie.mesh.position.y,
                                    z: axie.mesh.position.z,
                                });
                            } else {
                                should_move = !axie.intersectsGivenAxies(play_field_axies.values(), new BABYLON.Vector3(axie.mesh.position.x + axie_speed + 1, axie.mesh.position.y, axie.mesh.position.z));
                                if (should_move) {
                                    axie.mesh.movePOV(axie_speed, 0, 0);
                                    this.room.send("updateAxie", {
                                        id: axie.id,
                                        x: axie.mesh.position.x,
                                        y: axie.mesh.position.y,
                                        z: axie.mesh.position.z,
                                    });
                                } else {
                                    should_move = !axie.intersectsGivenAxies(play_field_axies.values(), new BABYLON.Vector3(axie.mesh.position.x - axie_speed + 1, axie.mesh.position.y, axie.mesh.position.z));
                                    if (should_move) {
                                        axie.mesh.movePOV(-axie_speed, 0, 0);
                                        this.room.send("updateAxie", {
                                            id: axie.id,
                                            x: axie.mesh.position.x,
                                            y: axie.mesh.position.y,
                                            z: axie.mesh.position.z,
                                        });
                                    }
                                }
                            }

                        } else if (axie.reload_time <= 0 && axie.damage > 0) {
                            const bullet_clone = axie.attackTarget(this.bullet);
                            if (axie.target.hp <= 0) {
                                var target = axie.target;
                                enemyAxieMap.delete(target.id);
                                target.dispose();

                                this.room.send("removeAxie", {
                                    id: target.id,
                                    sessionId: this.enemy_session_id
                                });
                            }
                            if (bullet_clone) {
                                this.bullets.push(bullet_clone);
                            }

                            axie.reload_time = 10;
                        } else {
                            axie.reload_time--;
                        }
                    }
                }
                )
            }

            if (enemyAxieMap && enemyAxieMap.values()) {
                // Bunker Shoots
                if (this.axiesByAxieIdBySessionId.get(this.enemy_session_id).size > 0) {
                    if (reload_time == 0) {
                        let target = this.own_bunker.findClosestTarget(this.axiesByAxieIdBySessionId.get(this.enemy_session_id).values());
                        if (target) {
                            var bullet = new Bullet('bullet', this.own_bunker.damage, Bullet.BULLET_SPEED, 'bullet', this.bullet.clone(), target);
                            bullet.mesh.position = this.own_bunker.mesh.position.clone();
                            this.bullets.push(bullet);
                            reload_time = 25;
                        }
                    }
                }
            }

            // Move Bullets
            if (this.bullets.length > 0) {
                this.bullets.forEach((bullet) => {
                    bullet.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(0, 1, 0), bullet.mesh, bullet.target);
                    bullet.mesh.movePOV(0, 0, bullet.speed);
                    if (bullet.mesh.intersectsMesh(bullet.target.mesh)) {
                        bullet.target.inflictDamage(bullet.damage);
                        if (bullet.target.hp <= 0) {
                            var target = bullet.target;
                            enemyAxieMap.delete(target.id);
                            target.dispose();

                            this.room.send("removeAxie", {
                                id: target.id,
                                sessionId: this.enemy_session_id
                            });
                        }
                        bullet.dispose();
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
            if (frame % 20 == 0 && this.enemy_session_id) {
                this.energy++;
                setEnergyText(this);
            }
        })

    }

    createMoveSetMenu(): void {
        this.MoveSetMenu = new MoveSetMenu(this.engine, this);
    }

    async bootstrap(): Promise<void> {
        this.scene = new BABYLON.Scene(this.engine);
        this.light = new BABYLON.HemisphericLight("pointLight", new BABYLON.Vector3(), this.scene);
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 4, 30, new BABYLON.Vector3(25, 25, 120), this.scene);
        this.camera.attachControl(this.canvas, true);

        createSkyBox(this.scene);
        this.displayGameControls();
        await this.initWorld();
        this.initPlayers();
        this.setObservables();
        this.setRenderLoopObservable();
        this.createMoveSetMenu();


        this.doRender();
    }

    private gotoMenu() {
        this.scene.dispose();
        const menu = new Menu('renderCanvas');
        menu.createMenu();
    }

    private doRender(): void {
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
            this.scene.render();

            if (this.selectedAxie && this.selectedAxie.mesh) {
                this.MoveSetMenu.scene.render();
            }
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

}
