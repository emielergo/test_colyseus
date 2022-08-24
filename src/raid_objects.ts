import * as BABYLON from 'babylonjs';
import { int } from 'babylonjs';
import { getRotationVectorFromTarget } from './utils';

export default class Axie {
    public static PLAYER_ONE_OFFSET = 25;

    public id: string;
    public hp: int;
    public range: int;
    public skin: string;
    public mesh: BABYLON.Mesh;
    public target;
    public incoming_bullets = [];

    constructor(id: string, hp: int, range: int, skin: string, mesh, target) {
        this.id = id;
        this.hp = hp;
        this.range = range;
        this.skin = skin;
        this.mesh = mesh;
        this.target = target;
    }

    isInRangeOfTarget(): boolean {
        if (this.range == 0) {
            return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
        } else {
            return this.target && this.mesh ? this.mesh.position.subtract(this.target.mesh.position).length() < this.range ? true : false : false;
        }
    }

    disposeIncomingBullets(): void {
        this.incoming_bullets.forEach((bullet) => {
            bullet.mesh.dispose();
        })
    }

    inflictDamage(damage: int): void {
        this.hp = this.hp - damage;
    }

    clone(id: string): Axie {
        return new Axie(id, this.hp, this.range, this.skin, this.mesh.clone(), this.target);
    }

    setMesh(mesh: BABYLON.Mesh): void {
        this.mesh = mesh;
    }

    offsetPositionForSpawn(isPlayer1: Boolean): void {
        if (this.mesh) {
            if (isPlayer1) {
                this.mesh.position.z = this.mesh.position.z - Axie.PLAYER_ONE_OFFSET;
            } else {
                this.mesh.position.z = this.mesh.position.z + Axie.PLAYER_ONE_OFFSET;
            }
        }
    }

    setSkin(skin: string): void {
        this.skin = skin;
    }

}

export class Bullet {
    public mesh: BABYLON.Mesh;
    public target: Axie;
    public speed: int;

    constructor(mesh, target, speed) {
        this.mesh = mesh;
        this.target = target;
        this.speed = speed;

        target.incoming_bullets.push(this);
    }

    intersectsWithTarget(): boolean {
        return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
    }

    clone(): Bullet {
        return new Bullet(this.mesh.clone(), this.target, this.speed);
    }
}

export class Bunker {
    public id: String;
    public hp: int;
    public mesh: BABYLON.Mesh;

    constructor(id, hp, mesh) {
        this.id = id;
        this.hp = hp;
        this.mesh = mesh;
    }

    findClosestTarget(play_field_axies) {
        let closest_axie;

        for(let axie of play_field_axies){
            closest_axie = axie;
            break;
        }

        let closest_axie_distance = this.mesh.position.subtract(closest_axie.mesh.position).length();

        for (let i = 1; i < play_field_axies.length && i < 50; i++) {
            let iteration = play_field_axies[i];
            let iteration_distance = this.mesh.position.subtract(iteration.mesh.position).length();

            if (iteration_distance < closest_axie_distance) {

                closest_axie = iteration;
                closest_axie_distance = iteration_distance;
            }
        }

        return closest_axie;
    }
}
