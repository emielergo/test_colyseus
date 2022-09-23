import { int } from "babylonjs";

export default class Card {
    public type;
    public range;
    public damage;
    public shield;
    public heal;
    public status_effects;

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


