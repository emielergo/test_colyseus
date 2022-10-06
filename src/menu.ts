import * as BABYLON from 'babylonjs';
import { Vector3 } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Button } from 'babylonjs-gui';
import { Client } from "colyseus.js";

import Game from './game';
import { axie_move_source_by_id_map, createSkyBox } from "./utils";

const ROOM_NAME = "my_room";
 const ENDPOINT = "wss://server.axie-raids.com/";
// const ENDPOINT = "ws://localhost:2567"; // TESTING

export default class Menu {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _colyseus: Client = new Client(ENDPOINT);

    private _errorMessage: GUI.TextBlock = new GUI.TextBlock("errorText");

    constructor(canvasElement: string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    //wire up the UI buttons to the create / join functions
    wireButtons(): void {

            window.$game_state.addEventListener('start.create', _ => {
                this.createGame('create');
                window.$game_state.commitState('scene', '1v1');
            });
            window.$game_state.addEventListener('start.join', _ => {
                this.createGame('join');
                window.$game_state.commitState('scene', '1v1');
            });
    }

    createMenu(): void {
        this._scene = new BABYLON.Scene(this._engine);
        let light = new BABYLON.HemisphericLight('main-light', Vector3.Zero(), this._scene);
        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 50, BABYLON.Vector3.Zero(), this._scene);
        this._camera.useAutoRotationBehavior = true;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        //this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        createSkyBox(this._scene);

        //this.initLoadingMessageBox();
        //this.initErrorMessageBox();
        //this.swapLoadingMessageBox(false);
        //this.swapErrorMessageBox(false);

        this.doRender();
    }

    private swapControls(isEnabled: boolean) {
        for (let btn of this._advancedTexture.getControlsByType("Button")) {
            btn.isEnabled = isEnabled;
        }
    }

    private async createGame(method: string): Promise<void> {
        let game: Game;
        try {
            switch (method) {
                case "create":
                    window.$game_state.dispatchEvent('start.loading');
                    game = new Game(this._canvas, this._engine, await this._colyseus.create(ROOM_NAME));
                    game.player_number = 1;
                    break;
                case "join":
                    window.$game_state.dispatchEvent('start.loading');
                    game = new Game(this._canvas, this._engine, await this._colyseus.join(ROOM_NAME));
                    game.player_number = 2;
                    break;
                default:
                    window.$game_state.dispatchEvent('start.loading');
                    game = new Game(this._canvas, this._engine, await this._colyseus.joinOrCreate(ROOM_NAME));
            }
            this._scene.dispose();
            game.bootstrap();
        } catch (error) {
            console.log(error.message);
            console.log(error.stack);
            this._errorMessage.text = error.message;
            //this.swapErrorMessageBox(true);
        }
    }

    private doRender(): void {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private initLoadingMessageBox() {
        const loadingMessage = new GUI.Rectangle("messageBox");
        loadingMessage.thickness = 0;
        loadingMessage.background = "#131313";

        const loadingText = new GUI.TextBlock("loadingText");
        loadingText.text = "LOADING..."
        loadingText.fontFamily = "Roboto";
        loadingText.color = "#fad836";
        loadingText.fontSize = "30px";
        loadingMessage.addControl(loadingText);

        this._advancedTexture.addControl(loadingMessage);
    }

    private initErrorMessageBox() {
        const errorMessageBox = new GUI.Rectangle("errorMessageBox");
        errorMessageBox.thickness = 0;
        errorMessageBox.background = "#131313";

        this._errorMessage.fontFamily = "Roboto";
        this._errorMessage.color = "#ff1616";
        this._errorMessage.fontSize = "20px";
        this._errorMessage.textWrapping = true;
        errorMessageBox.addControl(this._errorMessage);

        const button = GUI.Button.CreateImageWithCenterTextButton("tryAgainButton", "<- TRY AGAIN", "./public/btn-default.png");
        button.width = "200px";
        button.height = "60px";
        button.fontFamily = "Roboto";
        button.thickness = 0;
        button.color = "#c0c0c0";
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.paddingBottom = "20px";
        button.onPointerClickObservable.add(() => {
            this.swapControls(true);
            //this.swapLoadingMessageBox(false);
            this.swapErrorMessageBox(false);
        });
        errorMessageBox.addControl(button);

        this._advancedTexture.addControl(errorMessageBox);
    }

    private swapLoadingMessageBox(isEnabled: boolean) {
        const messageBox = this._advancedTexture.getControlByName("messageBox");
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled ? 0.75 : 0;
    }

    private swapErrorMessageBox(isEnabled: boolean) {
        //this.swapLoadingMessageBox(false);

        const messageBox = this._advancedTexture.getControlByName("errorMessageBox");
        this._advancedTexture.getControlByName("tryAgainButton").isEnabled = true;
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled ? 0.75 : 0;
    }
}

export class MoveSetMenu {

    private mouth_button;
    private eyes_button;
    private ears_button;
    private horn_button;
    private back_button;
    private tail_button;
    private buttons : Button[] = [];

    public scene: BABYLON.Scene;
    public game;

    constructor(engine, game) {
        this.scene = new BABYLON.Scene(engine);
        this.scene.autoClear = false;
        this.game = game;
        let camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this.scene);
        camera.useAutoRotationBehavior = true;
        camera.setTarget(BABYLON.Vector3.Zero());

    }

    setMoveSetImages(skin): void {
        this.mouth_button.image.source = axie_move_source_by_id_map.get(skin)[0];
        this.eyes_button.image.source = axie_move_source_by_id_map.get(skin)[1];
        this.ears_button.image.source = axie_move_source_by_id_map.get(skin)[2];
        this.horn_button.image.source = axie_move_source_by_id_map.get(skin)[3];
        this.back_button.image.source = axie_move_source_by_id_map.get(skin)[4];
        this.tail_button.image.source = axie_move_source_by_id_map.get(skin)[5];
    }

    setSelectedCards(axie): void {
        let index = 0;
        for(let button of this.buttons){
            button.thickness = 3* axie.active_cards[index];
            index++;
        }
    }

    getActiveMoves(){
        let active_moves = [];

        for(let button of this.buttons){
            if(button.thickness == 3){
                active_moves.push(button);
            }
        }
    }
}
