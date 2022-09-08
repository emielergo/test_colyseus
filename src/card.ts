import { int } from "babylonjs";

export default class Card {
    private type;
    private range;
    private damage;
    private shield;
    private status_effects;

    private source;

    constructor(type, range, damage, shield, status_effects, source) {
        this.type = type;
        this.range = range;
        this.damage = damage;
        this.shield = shield;
        this.status_effects = status_effects;
        this.source = source;

    }
}


