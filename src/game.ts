import * as BABYLON from 'babylonjs';
import { StandardMaterial } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";
import Axie, { Bullet, Bunker } from './raid_objects';

import Menu from "./menu";
import { createbuba, createBulletMesh, createBunker, createHealthBarMesh, createOlek, createPuffy, createSkyBox, generateMap, getRotationVectorFromTarget, setEnergyText } from "./utils";

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene!: BABYLON.Scene;
    public room: Room<any>;
    private camera!: BABYLON.ArcRotateCamera;
    private light!: BABYLON.Light;
    private render_loop: Boolean = true;

    public player_number!: number;
    public energy = 0;
    public clone_timer = 0;
    public enemy_session_id!: String;
    private isHoveringOverOwnDropZone: Boolean = false;
    private selectedAxie!: Axie;
    private cloned_counter = 0;

    // World
    private ground!: BABYLON.GroundMesh;
    private drop_zone_1!: BABYLON.Mesh;
    private drop_zone_2!: BABYLON.Mesh;
    private own_drop_zone!: BABYLON.Mesh;
    private power_plant_1!: BABYLON.Mesh;
    private power_plant_2!: BABYLON.Mesh;
    private own_power_plant!: BABYLON.Mesh;
    private activate_power_plant;
    private drop_zone_axies = [];
    private bullets = [];

    private axiesByAxieIdBySessionId: Map<String, Map<String, Axie>> = new Map<String, Map<String, Axie>>();
    private axieNextPositionByAxieId: Map<String, BABYLON.Vector3> = new Map<String, BABYLON.Vector3>();
    private bunkerBySessionId: Map<String, Bunker> = new Map<String, Bunker>();
    private axiesByLongitude: Map<number, Axie[]> = new Map<number, Axie[]>();
    private axiesByLatitude: Map<number, Axie[]> = new Map<number, Axie[]>();

    private own_bunker!: Bunker;
    private target_bunker!: Bunker;
    private puffy!: Axie;
    private buba!: Axie;
    private olek!: Axie;
    private bullet!: BABYLON.Mesh;
    private health_bar!: BABYLON.Mesh;
    private maxBulletAge: number = 75;

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
        playerInfo.fontSize = 8;
        playerInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        playerInfo.paddingTop = "10px";
        playerInfo.paddingLeft = "10px";
        playerInfo.outlineColor = "#000000";
        advancedTexture.addControl(playerInfo);

        this.wireButtons();
    }

    wireButtons(): void {
        window.$game_state.addEventListener('1v1.back', () => {
            this.room.leave(true).then(_ => {
                window.$game_state.commitState('scene', 'start');
            });
        });

        window.$game_state.addEventListener('1v1.axie', (event) => {
            if (event.detail.axie) {
                let number_of_active_moves = event.detail.axie.moves.filter(move => move.active).length;
                if (this.selectedAxie && this.selectedAxie.mesh) {
                    this.selectedAxie.mesh.dispose();
                }
                let starter;
                if (event.detail.axie.id === "puffy") {
                    starter = this.puffy;
                } else if (event.detail.axie.id === "buba") {
                    starter = this.buba;
                } else if (event.detail.axie.id === "olek") {
                    starter = this.olek;
                }
                // array of all axie meshes, unhide selected?
                this.selectedAxie = starter.clone();
                this.selectedAxie.setTarget(this.target_bunker);
                this.selectedAxie.cards_list = starter.cards_list;
                this.selectedAxie.setHp(320);
                this.selectedAxie.setDamageAndRangeFromCards();
                this.selectedAxie.offsetPositionForSpawn(this.player_number == 1);
                this.selectedAxie.mesh.isPickable = false;
                this.selectedAxie.setActiveCards(event.detail.axie.moves);
                this.selectedAxie.level = number_of_active_moves;
            } else {
                this.selectedAxie.dispose();
            }

        });

        window.$game_state.addEventListener('1v1.move', (event) => {
            this.selectedAxie.setActiveCard(event.detail.move);
            this.selectedAxie.level = this.selectedAxie.level + 1;
            this.room.send("updateEnergy", {
                energy_cost: 20
            });
        })
    }

    async initWorld(): Promise<void> {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 300 }, this.scene);
        this.ground.isPickable = false;
        this.ground.receiveShadows = true;

        const groundMat = new BABYLON.StandardMaterial("groundMat");
        groundMat.diffuseColor = new BABYLON.Color3(0.10, 0.62, 0.52);
        //groundMat.bumpTexture = new BABYLON.Texture('/textures/ground/rock_05_norm_01.png');
        //groundMat.bumpTexture.uScale = 8;
        //groundMat.bumpTexture.vScale = 60;
        groundMat.specularColor = new BABYLON.Color3(0.010, 0.062, 0.052);
        groundMat.specularPower = 1;
        this.ground.material = groundMat;

        var shadowLight = new BABYLON.DirectionalLight('shadow-light', new BABYLON.Vector3(40, -30, 0), this.scene);
        shadowLight.intensity = 0.5;
        // var shadowGenerator = new BABYLON.ShadowGenerator(4096, shadowLight);
        // shadowGenerator.usePoissonSampling = true;

        // var music = new BABYLON.Sound("Music", "/bg-music-1.mp3", this.scene, null, {
        //     loop: true,
        //     autoplay: true
        //   });

        let sceneHelper = await BABYLON.SceneOptimizer.OptimizeAsync(this.scene);

        generateMap(this.scene, { x: 180, y: 25 }, 1, new BABYLON.Color3(0.70, 0.62, 0.52), this.ground);
        // generateMap(this.scene, { x: 180, y: 25 }, 1, new BABYLON.Color3(0.70, 0.62, 0.52), this.ground, shadowGenerator);

        this.own_bunker = createBunker(this.scene, this);
        this.own_bunker.id = this.own_bunker.id + ' ' + this.player_number;

        this.target_bunker = createBunker(this.scene, this);
        (this.target_bunker.mesh.material as StandardMaterial).diffuseColor = BABYLON.Color3.Red();

        this.drop_zone_1 = BABYLON.MeshBuilder.CreateBox("drop_zone_1", { width: 30, height: 1, depth: 15 }, this.scene);
        this.drop_zone_1.position = new BABYLON.Vector3(0, 0, 162.5);

        const drop_zone_1_mat = new BABYLON.StandardMaterial("drop_zone_1_mat");
        drop_zone_1_mat.diffuseColor = BABYLON.Color3.Teal();
        drop_zone_1_mat.roughness = 10000;
        drop_zone_1_mat.specularColor = BABYLON.Color3.Teal();
        this.drop_zone_1.material = drop_zone_1_mat;

        this.drop_zone_2 = BABYLON.MeshBuilder.CreateBox("drop_zone_2", { width: 30, height: 1, depth: 15 }, this.scene);
        this.drop_zone_2.position = new BABYLON.Vector3(0, 0, -162.5);

        const drop_zone_2_mat = new BABYLON.StandardMaterial("drop_zone_2_mat");
        drop_zone_2_mat.diffuseColor = BABYLON.Color3.Purple();
        drop_zone_2_mat.roughness = 10000;
        drop_zone_2_mat.specularColor = BABYLON.Color3.Purple();
        this.drop_zone_2.material = drop_zone_2_mat;

        this.power_plant_1 = BABYLON.MeshBuilder.CreateBox("power_plant_1", { width: 1, height: 1, depth: 2 }, this.scene);
        this.power_plant_1.position = new BABYLON.Vector3(20, 0, 162.5);

        const power_plant_1_mat = new BABYLON.StandardMaterial("power_plant_1_mat");
        power_plant_1_mat.diffuseColor = BABYLON.Color3.Blue();
        power_plant_1_mat.roughness = 10000;
        power_plant_1_mat.specularColor = BABYLON.Color3.Blue();
        this.power_plant_1.material = power_plant_1_mat;

        this.power_plant_2 = BABYLON.MeshBuilder.CreateBox("power_plant_2", { width: 1, height: 1, depth: 2 }, this.scene);
        this.power_plant_2.position = new BABYLON.Vector3(20, 0, -162.5);

        const power_plant_2_mat = new BABYLON.StandardMaterial("power_plant_2_mat");
        power_plant_2_mat.diffuseColor = BABYLON.Color3.Blue();
        power_plant_2_mat.roughness = 10000;
        power_plant_2_mat.specularColor = BABYLON.Color3.Blue();
        this.power_plant_2.material = power_plant_2_mat;

        this.puffy = await createPuffy(this.scene);
        this.buba = await createbuba(this.scene);
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

                if (player.number == 1) {
                    this.camera.target = new BABYLON.Vector3(0, 0, 162.5);
                    this.camera.position = new BABYLON.Vector3(30, 50, 192.5);
                    this.own_bunker.mesh.position = new BABYLON.Vector3(0, 1, 147);
                    this.target_bunker.mesh.position = new BABYLON.Vector3(0, 1, -147);
                    this.puffy.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(1, 0, 0));
                    this.buba.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(1, 0, 0));
                    this.olek.mesh.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(1, 0, 0));
                } else {
                    this.camera.target = new BABYLON.Vector3(0, 0, -162.5);
                    this.camera.position = new BABYLON.Vector3(-30, 50, -192.5);
                    this.own_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, -147);
                    this.target_bunker.mesh.position = new BABYLON.Vector3(0, 1.5, 147);
                }

                // Create Bunker
                this.bunkerBySessionId.set(sessionId, this.own_bunker);

                // Create Drop Zone Actions
                if (player.number == 1) {
                    this.own_drop_zone = this.drop_zone_1;
                    this.own_power_plant = this.power_plant_1;
                } else {
                    this.own_drop_zone = this.drop_zone_2;
                    this.own_power_plant = this.power_plant_2;
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
            } else {
                this.enemy_session_id = sessionId;

                this.bunkerBySessionId.set(sessionId, this.target_bunker);
            }

            player.onChange((changes: any) => {
                if (isCurrentPlayer) {
                    this.energy = player.energy;
                    this.clone_timer = player.clone_timer;
                    setEnergyText(this);
                }
            });

            // Set Global Attributes
            this.axiesByAxieIdBySessionId.set(sessionId, new Map<String, Axie>());

            // update local target position
            player.axies.onAdd((axie) => {
                if (!isCurrentPlayer) {
                    let new_axie = new Axie(axie.id, axie.hp, axie.shield, axie.range, axie.damage, axie.level, axie.skin, (this.scene.getMeshById(axie.skin) as BABYLON.Mesh).clone(), this.own_bunker);
                    new_axie.mesh.setEnabled(true);
                    new_axie.mesh.position = new BABYLON.Vector3(axie.x, axie.y, axie.z);
                    new_axie.mesh.rotation = getRotationVectorFromTarget(new BABYLON.Vector3(0, 1, 0), new_axie.mesh, new_axie.target);
                    this.axiesByAxieIdBySessionId.get(sessionId).set(new_axie.id, new_axie);
                    this.axieNextPositionByAxieId.set(new_axie.id, new_axie.mesh.position);

                    axie.onChange((changes: any) => {
                        this.axieNextPositionByAxieId.set(axie.id, new BABYLON.Vector3(axie.x, axie.y, axie.z));
                        this.axiesByAxieIdBySessionId.get(sessionId).get(axie.id).hp = axie.hp;
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

            player.bunker.onChange((changes: any) => {
                changes.forEach(change => {
                    if (change.field == 'hp') {
                        this.bunkerBySessionId.get(sessionId).hp = change.value;
                        if (change.value <= 0) {
                            if (isCurrentPlayer) {
                                window.$game_state.commitState('scene', 'start');
                                window.$game_state.dispatchEvent('1v1.won', false);
                            } else {
                                window.$game_state.commitState('scene', 'start');
                                window.$game_state.dispatchEvent('1v1.won', true);
                            }
                            this.render_loop = false;
                        }
                    }
                });

            });


        });

        // this.room.state.players.onRemove((player, playerId) => {
        //     // this.axiesByAxieIdBySessionId[playerId].forEach(axie =>{ axie.mesh.dispose()});
        //     // delete this.axiesByAxieIdBySessionId[playerId];
        //     // delete this.playerNextPosition[playerId];
        // });

        this.room.onLeave(code => {
            this.gotoMenu();
        })
    }

    setObservables(): void {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                // drop axie mesh logic
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

                                    this.drop_zone_axies.push(clonedAxie);
                                    this.energy -= 20;
                                    this.room.send("updateEnergy", {
                                        energy_cost: 20
                                    });
                                    setEnergyText(this);
                                } else {
                                    intersectsMesh = false;
                                }
                            }
                        } else if (clicked_mesh_id === this.own_power_plant.id && !this.activate_power_plant) {
                            if(this.energy >= 50){
                                this.room.send("activatePowerPlant", {
                                    energy_cost: 50
                                });
                                (this.own_power_plant.material as StandardMaterial).diffuseColor = BABYLON.Color3.Green();
                                this.activate_power_plant;
                            }
                        }
                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (this.selectedAxie && this.selectedAxie.mesh) {
                        if (this.isHoveringOverOwnDropZone && this.selectedAxie.level) {
                            this.selectedAxie.mesh.setEnabled(true);
                            if (pointerInfo.pickInfo.pickedPoint) {
                                this.selectedAxie.mesh.position = pointerInfo.pickInfo.pickedPoint;
                                this.selectedAxie.mesh.position.x = -this.selectedAxie.mesh.position.x;
                                this.selectedAxie.mesh.position.y += 2;
                            }
                        } else {
                            this.selectedAxie.mesh.setEnabled(false);
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
        this.scene.onBeforeRenderObservable.add(() => {

        })

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
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

}
