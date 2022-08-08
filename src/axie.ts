import * as BABYLON from 'babylonjs';
import { int } from 'babylonjs';
import { getRotationVectorFromTarget } from './utils';

export default class Axie {
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
            return this.target ? this.mesh.intersectsMesh(this.target) : false;
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

    setMesh(skin: string, mesh: BABYLON.Mesh): void {
        if(this.mesh){

            console.log(this.mesh.id);
        }
        this.mesh = mesh;
        this.mesh.position.x = this.mesh.position.x - 25;
    }

}

export class Bullet {
    public mesh: BABYLON.Mesh;
    public target: Axie;

    constructor(mesh, target) {
        this.mesh = mesh;
        this.target = target;
        target.incoming_bullets.push(this);
    }

    intersectsWithTarget(): boolean {
        return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
    }
}

export class Bunker {
    public hp: int;
    public mesh: BABYLON.Mesh;

    constructor(hp, mesh) {
        this.mesh = mesh;
        this.hp = hp;
    }

    findClosestTarget(play_field_axies) {
        let closest_axie = play_field_axies[0];
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
