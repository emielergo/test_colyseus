import * as BABYLON from 'babylonjs';
import { int } from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";

export default class Axie {
    public hp: int;
    public mesh: BABYLON.Mesh;

    constructor(hp: int) {
        this.hp = hp;
    }

}
