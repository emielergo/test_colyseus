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
                padding: 0;
                margin: 0;
                overflow: hidden;
                cursor: pointer;
                display: flex;
                border-radius: 8px;
                border: 2px solid black;
            }

            .move.active {
                border-color: white;
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
    private selection = {
        axie: undefined,
        move: undefined
    };

    private axies = {
        "puffy": {
            id: "puffy",
            active: false,
            moves: [
                { active: false, 'img': '/puffy-puff.png', 'action': '', cost: 10 },
                { active: false, 'img': '/puffy-baby.png', 'action': '', cost: 10 },
                { active: false, 'img': '/puffy-jellytackle.png', 'action': '', cost: 10 },
                { active: false, 'img': '/puffy-little crab.png', 'action': '', cost: 10 },
                { active: false, 'img': '/puffy-puff-tail.png', 'action': '', cost: 10 },
                { active: false, 'img': '/puffy-tiny-dino.png', 'action': '', cost: 10 }
            ]
        },
        "olek": {
            id: "olek",
            active: false,
            moves: [
                { active: false, 'img': '/olek-beetroot.png', 'action': '', cost: 10 },
                { active: false, 'img': '/olek-hidden-ears.png', 'action': '', cost: 10 },
                { active: false, 'img': '/olek-risky-trunk.png', 'action': '', cost: 10 },
                { active: false, 'img': '/olek-rusty-helm.png', 'action': '', cost: 10 },
                { active: false, 'img': '/olek-sprout.png', 'action': '', cost: 10 },
                { active: false, 'img': '/olek-succulent.png', 'action': '', cost: 10 }
            ]
        },
        "buba": {
            id: "buba",
            active: false,
            moves: [
                { active: false, 'img': '/buba-buba-brush.png', 'action': '', cost: 10 },
                { active: false, 'img': '/buba-forest-hero.png', 'action': '', cost: 10 },
                { active: false, 'img': '/buba-foxy-mouth.png', 'action': '', cost: 10 },
                { active: false, 'img': '/buba-persimmon.png', 'action': '', cost: 10 },
                { active: false, 'img': '/buba-foxy.png', 'action': '', cost: 10 },
                { active: false, 'img': '/buba-sparky.png', 'action': '', cost: 10 }
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
                    <button @click=${() => this.activateMove(move)} class="move ${move.active ? 'active' : ''} ${this.selection.axie == this.axies[key] ? '' : 'hidden'}" ?disabled=${move.cost > this.energy}><img draggable="false" src=${move.img} width="48" height="48" /></button>
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
