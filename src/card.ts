import { int } from "babylonjs";

export default class Card {
    private type;
    private range;
    private damage;
    private shield;
    private heal;
    private status_effects;

    private source;

    constructor(type, range, damage, heal, shield, status_effects, source) {
        this.type = type;
        this.range = range;
        this.damage = damage;
        this.heal = heal;
        this.shield = shield;
        this.status_effects = status_effects;
        this.source = source;

    }
}


