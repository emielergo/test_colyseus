import * as BABYLON from 'babylonjs';
import { int } from 'babylonjs';

export abstract class RaidObject {
    public id: string;
    public damage: int;
    public skin: string;
    public mesh: BABYLON.Mesh;
    public target;

    constructor(id: string, skin: string, damage: int, mesh, target) {
        this.id = id;
        this.skin = skin;
        this.damage = damage;
        this.mesh = mesh;
        this.target = target;
    }

    setMesh(mesh: BABYLON.Mesh): void {
        this.mesh = mesh;
    }

    setSkin(skin: string): void {
        this.skin = skin;
    }

    setDamage(damage: int): void {
        this.damage = damage;
    }
}

export default class Axie extends RaidObject {
    public static PLAYER_ONE_OFFSET = 25;
    public static AXIE_VIEW_RANGE = 20;

    public hp: int;

    public cards_list = [];
    public active_cards = [0, 0, 0, 0, 0, 0];
    public level = 0;
    public selected_move;
    public range: int;
    public reload_time = 0;
    public longitude;
    public latitude;

    public attacking_axies = [];
    public incoming_bullets = [];

    private health_bar;


    constructor(id: string, hp: int, range: int, damage: int, level: int, skin: string, mesh, target) {
        super(id, skin, damage, mesh, target);
        this.hp = hp;
        this.range = range;
        this.level = level;
    }

    clone(id: string): Axie {
        return new Axie(id, this.hp, this.range, this.damage, this.level, this.skin, this.mesh.clone(), this.target);
    }

    setHp(hp: int): void {
        this.hp = hp;
    }

    setTarget(target): void {
        this.target = target;
    }

    setDamageAndRangeFromCards() {
        let damage = 0;
        let range = 0;

        for (let index = 0; index < 6; index++) {
            if (this.active_cards[index] == 1) {
                damage += this.cards_list[index].damage;
                range += this.cards_list[index].range;
            }
        }
        this.damage = damage;
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
                                if (Math.random() < 0.9) {
                                    closest_axie = value;
                                    closest_axie_distance = iteration_distance;
                                }
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

    intersectsGivenAxies(axies, position): boolean {
        let intersects_with_axies = false;
        for(let other_axie of axies){
            if (other_axie.id != this.id && other_axie.mesh.intersectsPoint(position)) {
                intersects_with_axies = true;
                break;
            }
        }

        return intersects_with_axies;
    }

    // getCloseAxies(axies_by_longitude, axies_by_latitude){

    // }

    inflictDamage(damage: int): void {
        this.hp -= damage;
    }

    isInViewingRangeOfTarget(potential_target): boolean {
        return this.mesh.position.subtract(potential_target.mesh.position).length() < Axie.AXIE_VIEW_RANGE;
    }

    attackTarget(bullet): Bullet {
        let bullet_clone;
        if (this.range == 0 && this.damage) {
            this.target.inflictDamage(this.damage);
        } else {
            let bullet_mesh_clone = bullet.clone();
            bullet_mesh_clone.position = this.mesh.position.clone();
            bullet_clone = new Bullet(bullet.id, this.damage, Bullet.BULLET_SPEED, 'bullet', bullet_mesh_clone, this.target);
        }
        this.target.attacking_axies.push(this);
        this.reload_time = 5;

        return bullet_clone;
    }

    dispose(): void {
        this.attacking_axies.forEach(axie => {
            axie.target = null;
        });
        this.disposeIncomingBullets();
        this.mesh.dispose();
    }

    disposeIncomingBullets(): void {
        this.incoming_bullets.forEach((bullet) => {
            bullet.mesh.dispose();
        })
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

    setHealthBar(mesh) {
        this.health_bar = mesh.clone();
        this.health_bar.parent = this.mesh;
        this.health_bar.position.y = 2;
    }

}

export class Bullet extends RaidObject {
    public static BULLET_SPEED = -0.75;

    public speed: int;

    constructor(id: string, damage: int, speed: int, skin: string, mesh, target) {
        super(id, skin, damage, mesh, target);
        this.speed = speed;

        target.incoming_bullets.push(this);
    }

    clone(): Bullet {
        return new Bullet(this.id, this.damage, this.speed, this.skin, this.mesh.clone(), this.target);
    }

    intersectsWithTarget(): boolean {
        return this.target ? this.mesh.intersectsMesh(this.target.mesh) : false;
    }

    dispose() {
        this.mesh.dispose();
    }
}

export class Bunker extends RaidObject {
    public range: int;
    public hp: int;
    public incoming_bullets = [];
    public attacking_axies = [];

    constructor(id: string, hp: int, range: int, damage: int, skin: string, mesh, target) {
        super(id, skin, damage, mesh, target);
        this.hp = hp;
        this.range = range;
    }

    setHp(hp: int): void {
        this.hp = hp;
    }

    setRange(range: int): void {
        this.range = range;
    }

    inflictDamage(damage: int): void {
        this.hp -= damage;
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

    dispose() {
        this.attacking_axies.forEach(axie => {
            axie.target = null;
        });
        this.disposeIncomingBullets();
        this.mesh.dispose();

        throw new Error('You Lose!');
    }

    disposeIncomingBullets(): void {
        this.incoming_bullets.forEach((bullet) => {
            bullet.mesh.dispose();
        })
    }
}
