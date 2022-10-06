import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

@customElement('gui-1v1-scene')
export class Gui1V1Scene extends LitElement {
    static styles = [
        css`
            :host {
                justify-content: space-between;
                display: flex;
                width: 100%;
                flex-direction: column;
            }

            .top-bar {
                display: flex;
                flex-wrap: wrap;
                grid-gap: 16px;
            }

            .bottom-bar {
                display: flex;
                grid-gap: 16px;
                justify-content: center;
                position: relative;
            }
            .side-bar {
                margin-left: auto;
                margin-right: 0px;
                height: 100%;
                width: 48px;
                align-items: center;
                display: flex;
            }

            .right-align {
                margin-left: auto;
                margin-right: 0;
            }

            .moves {
                pointer-events: all;
                top: calc(-100% - 8px);
                display: flex;
                grid-gap: 8px;
                flex-direction: column;
                transition: 400ms all ease;
                transform: translateX(200%);
                opacity: 0;
            }

            .moves.active {
                transition: 400ms all ease;
                transform: translateX(0);
                opacity: 1;
            }

            .moves .move {
                position: relative;
                padding: 0;
                margin: 0;
                cursor: pointer;
                display: flex;
                border-radius: 8px;
                border: 2px solid black;
            }

            .moves .move img {
                border-radius: 8px;
            }

            .move.active {
                border-color: white;
            }

            .move .move-info {
                pointer-events: none;
                filter: opacity(1);
                position: absolute;
                top: 50%;
                right: calc(100% + 8px);
                transform: translateY(-50%);
                opacity: 0;
                user-select: none;
                backdrop-filter: opacity(0.2) blur(10px);
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                color: white;
                transition: all 400ms ease 0s;
                min-width: 100px;
                display: flex;
                flex-direction: column;
                border-radius: 8px;
                border: 2px solid #00000050;
                box-shadow: inset 0px 32px 8px #ffffff20;
            }

            .move .move-info .move-info__attribute {
                width: 100%;
                display: flex;
                justify-content: space-between;
            }

            .move:hover .move-info {
                opacity: 1;
            }

            .move:disabled:not(.active) {
                filter: opacity(0.5);
                cursor: unset;
            }

            .moves .move.hidden {
                display: none;
            }
        `
    ];

    private energy: Number = 0;
    private crystals: Number = 0;
    private buttonSound: Audio = new Audio('/button.mp3');
    private selection = {
        axie: undefined,
        move: undefined
    };

    private axies = {
        "puffy": {
            id: "puffy",
            active: false,
            moves: [
                { active: false, 'img': '/puffy-puff.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/puffy-baby.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/puffy-jellytackle.png', 'action': '', cost: 10, damage: 70, healing: 0, shield: 0 },
                { active: false, 'img': '/puffy-little crab.png', 'action': '', cost: 10, damage: 65, healing: 0, shield: 0 },
                { active: false, 'img': '/puffy-puff-tail.png', 'action': '', cost: 10, damage: 80, healing: 0, shield: 0 },
                { active: false, 'img': '/puffy-tiny-dino.png', 'action': '', cost: 10, damage: 63, healing: 0, shield: 0 }
            ]
        },
        "olek": {
            id: "olek",
            active: false,
            moves: [
                { active: false, 'img': '/olek-beetroot.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/olek-hidden-ears.png', 'action': '', cost: 10, damage: 0, healing: 0, shield: 0 },
                { active: false, 'img': '/olek-risky-trunk.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/olek-rusty-helm.png', 'action': '', cost: 10, damage: 40, healing: 0, shield: 0 },
                { active: false, 'img': '/olek-sprout.png', 'action': '', cost: 10, damage: 50, healing: 0, shield: 0 },
                { active: false, 'img': '/olek-succulent.png', 'action': '', cost: 10, damage: 40, healing: 0, shield: 0 }
            ]
        },
        "buba": {
            id: "buba",
            active: false,
            moves: [
                { active: false, 'img': '/buba-buba-brush.png', 'action': '', cost: 10, damage: 65, healing: 0, shield: 0 },
                { active: false, 'img': '/buba-forest-hero.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/buba-foxy-mouth.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/buba-persimmon.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 },
                { active: false, 'img': '/buba-foxy.png', 'action': '', cost: 10, damage: 120, healing: 0, shield: 0 },
                { active: false, 'img': '/buba-sparky.png', 'action': '', cost: 10, damage: 60, healing: 0, shield: 0 }
            ]
        }
    }

    constructor() {
        super();
        window.$game_state.addEventListener('energy', (e) => {
            this.energy = e.detail.value;
            this.update();
        });
    }

    returnToStartScreen() {
        window.$game_state.dispatchEvent('1v1.back');
    }

    selectAxie(axie) {
        this.buttonSound.play();
        if (this.selection.axie == axie)
            this.selection.axie = null;
        else
            this.selection.axie = axie;
        if (this.selection.axie)
            this.renderRoot.querySelector('.moves')?.classList.add('active');
        else
            this.renderRoot.querySelector('.moves')?.classList.remove('active');
        setTimeout(this.update.bind(this), 100);
        window.$game_state.dispatchEvent('1v1.axie', {
            axie: this.selection.axie,
        })
    }

    activateMove(move) {
        this.buttonSound.play();
        if (this.energy >= move.cost)
            this.selection.axie.moves.find(m => m == move).active = true;
        this.update();
        window.$game_state.dispatchEvent('1v1.move', {
            move: move
        })
    }

    renderAxies() {
        return html`
            ${Object.keys(this.axies).map(key => {
            let axie = this.axies[key];
            return html`
                <gui-axie-preview @click=${() => this.selectAxie(axie)} meshName="${key}" ?active=${axie == this.selection.axie}>
                </gui-axie-preview>`
        })}
        `
    }

    renderMoves() {
        return html`
                ${Object.keys(this.axies).map(key => this.axies[key].moves.map(move => html`
                    <button @click=${() => this.activateMove(move)} class="move ${move.active ? 'active' : ''} ${this.selection.axie == this.axies[key] ? '' : 'hidden'}" ?disabled=${move.cost > this.energy}>
                    <img draggable="false" src=${move.img} width="48" height="48" />
                    <div class="move-info">
                        <!--<div class="move-info__attribute"><span><strong>name</strong></span><span>${move.name}</span></div>-->
                        <div class="move-info__attribute"><span><strong>cost</strong></span><span>+ ${move.cost}</span></div>
                        <div class="move-info__attribute"><span><strong>damage</strong></span><span>+ ${move.damage}</span></div>
                        <div class="move-info__attribute"><span><strong>healing</strong></span><span>+ ${move.healing}</span></div>
                        <div class="move-info__attribute"><span><strong>shield</strong></span><span>+ ${move.shield}</span></div>
                    </div>
                </button>
                `))}
                `
    }

    render() {
        return html`
        <div class="top-bar">
            <gui-amount-display amount=${this.energy} iconColor="orange">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
                    <path
                        d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z" />
                    </svg>
            </gui-amount-display>

                <gui-button btnStyle="stylized" class="right-align" @click="${this.returnToStartScreen}">Back</gui-button>
        </div>
        <div class="side-bar">
            <div class="moves">
                ${this.renderMoves()}
            </div>   </div>
        <div class="bottom-bar">
            ${this.renderAxies()}
        </div>
        `;
    }
}
