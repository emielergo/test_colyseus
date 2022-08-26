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

    setMesh(mesh: BABYLON.Mesh): void {
        this.mesh = mesh;
    }

    setSkin(skin: string): void {
        this.skin = skin;
    }

    setHp(hp: int): void {
        this.hp = hp;
    }

    setRange(range: int): void {
        this.range = range;
    }

    locateTarget(enemy_axies_by_id: Map<String, Axie>, enemy_bunker) {
        if (!this.target || !this.isInViewingRangeOfTarget(this.target)) {

            if (enemy_axies_by_id && enemy_axies_by_id.size > 0) {
                let closest_axie;
                let closest_axie_distance
                enemy_axies_by_id.forEach((value, key) => {
                    if (this.isInViewingRangeOfTarget(value)) {
                        if (!closest_axie) {
                            closest_axie = value;
                            closest_axie_distance = this.mesh.position.subtract(closest_axie.mesh.position).length();
                        } else {
                            let iteration_distance = this.mesh.position.subtract(value.mesh.position).length();
                            if (iteration_distance < closest_axie_distance) {
                                closest_axie = value;
                                closest_axie_distance = iteration_distance;
                            }
                        }
                    }
                });

                this.target = closest_axie;
            }

            if (!this.target) {
                this.target = enemy_bunker;
            }

        }
    }

    isInRangeOfTarget(): boolean {
        if (this.range == 0) {
            return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
        } else {
            return this.target && this.mesh ? this.mesh.position.subtract(this.target.mesh.position).length() < this.range ? true : false : false;
        }
    }

    isInViewingRangeOfTarget(potential_target): boolean {
        return this.mesh.position.subtract(potential_target.mesh.position).length() < 20;
    }

    dispose(): void {
        this.disposeIncomingBullets();
        this.mesh.dispose();
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

    offsetPositionForSpawn(isPlayer1: Boolean): void {
        if (this.mesh) {
            if (isPlayer1) {
                this.mesh.position.z = this.mesh.position.z - Axie.PLAYER_ONE_OFFSET;
            } else {
                this.mesh.position.z = this.mesh.position.z + Axie.PLAYER_ONE_OFFSET;
            }
        }
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

    clone(): Bullet {
        return new Bullet(this.mesh.clone(), this.target, this.speed);
    }

    intersectsWithTarget(): boolean {
        return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
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

        for (let axie of play_field_axies) {
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

        if (closest_axie_distance > 50) {
            closest_axie = null;
        }

        return closest_axie;
    }
}
