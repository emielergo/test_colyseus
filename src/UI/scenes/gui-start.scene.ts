import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

@customElement('gui-start-scene')
export class GuiStartScene extends LitElement {
    static styles = [
        css`
            :host {
                display: flex;
                align-items: center;
                justify-content:center;
            }
            .start-menu {
                display: flex;
                flex-direction: column;
                grid-gap: var(--ui-spacing);
                align-items: center;
            }

            .logo {
                animation: logoAnimation 1s linear infinite alternate;
                object-fit: cover;
                aspect-ratio: 1.5;
            }

            @keyframes logoAnimation {
                0% {
                    filter: drop-shadow(2px 4px 0px #00000000);
                    transform: scale(0.9);
                }
                100% {
                    filter: drop-shadow(2px 4px 6px #00000080);
                    transform: scale(1) rotate(5deg);
                }
            }
        `
    ];

    render() {
        return html`
            <div class="start-menu" data-start-menu>
                <img class="logo" width="250" src="/public/axie-raids.png"/>
                <gui-button @click=${()=> this.menuClick('create')} btn-style="pill">Create game</gui-button>
                <gui-button @click=${()=> this.menuClick('join')} btn-style="pill">Join game</gui-button>
                <gui-button @click=${()=> this.menuClick('createOrJoin')} btn-style="pill">Create or join</gui-button>
            </div>
        `;
    }

    menuClick(action): void {
        window.$game_state.dispatchEvent(`start.${action}`);
    }


}
