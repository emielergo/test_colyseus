import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

@customElement('gui-1v1-scene')
export class Gui1V1Scene extends LitElement {
    static styles = [
        css`
            :host {
                display: block;
            }

            .top-bar {
                display: flex;
                flex-wrap: wrap;
                grid-gap: 16px;
            }

            .right-align {
                margin-left: auto;
                margin-right: 0;
            }
        `
    ];

    private energy: Number = 0;
    private crystals: Number = 0;

    constructor() {
        super();
        window.$game_state.addEventListener('energy', (e) => {
            this.energy = e.detail.value;
            this.update();
        });
        window.$game_state.addEventListener('crystal', (e) => {
            this.crystals = e.detail.value;
            this.update();
        });
    }

    returnToStartScreen() {
        window.$game_state.dispatchEvent('1v1.back');
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
            <gui-amount-display amount=${this.crystals} iconColor="blue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
                    <path
                        d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8H376c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.6 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.6L63.3 192c-4.1 .3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16c.4 0 .9 0 1.3 0l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8L301.5 179.8l57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1L256 172.2 165.9 74.6c-2.8-3-7.4-3.4-10.7-1z" />
                    </svg>
                </gui-amount-display>
                <gui-button class="right-align" @click="${this.returnToStartScreen}">Back</gui-button>
        </div>
        <div class="bottom-bar">
            <gui-axie-preview meshName="olek"></gui-axie-preview>
        </div>
        `;
    }
}