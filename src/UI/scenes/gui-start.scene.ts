import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js'

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
                background: rgb(254 169 45);
                padding: 32px;
                border-radius: 16px;
                backdrop-filter: blur(12px);
                box-shadow: inset -4px -4px 0px 7px #00000020, inset 4px 4px 0px 7px #00000020, 0px 0px 36px #00000080;
            }

            .logo {
                animation: logoAnimation 1s linear infinite alternate;
                object-fit: cover;
                aspect-ratio: 1.5;
                margin-top: -100px;
            }
            
            .message {
                border-top-left-radius: 2px;
                border-top-right-radius: 2px;
                position: relative;
                font-size: 36px;
                background: red;
                width: calc(100% + 96px);
                margin: -32px -50px 0px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: cursive;
                font-weight: bold;
                text-shadow: 0px 2px 4px #00000080;
                box-shadow: rgb(52 0 0 / 40%) 0px -2px 2px 0px inset, rgb(247 233 165 / 80%) 0px 2px 2px 0px inset, inset 0px -32px 0px 0px #ff7600ab;
            }

            .message:before {
                content: '';
                position: absolute;
                left: 0;
                bottom: -11px;
                width: 0;
                width: 16px;
                height: 12px;
                background: #9b0000;
                clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
            }

            .message:after {
                content: '';
                position: absolute;
                right: 0;
                bottom: -11px;
                width: 0;
                width: 16px;
                height: 12px;
                background: #9b0000;
                clip-path: polygon(0% 0%, 0% 100%, 100% 0%);                
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
    public won: boolean | undefined = undefined;


    connectedCallback() {
        super.connectedCallback();
        window.$game_state.addEventListener('1v1.won', (event) => {
            this.won = event.detail;
            this.update();
            window.$game_state.commitState('1v1.won', undefined);
        })
    }

    render() {
        return html`
            <div class="start-menu" data-start-menu>
                <img class="logo" width="250" src="/axie-raids.png"/>
                <div style="${this.won == undefined ? 'display: none;' : ''}" class="message">${(this.won ? 'You won!' : 'You lost...')}</div>
                <gui-button @click=${()=> this.menuClick('create')} btnStyle="stylized">Create game</gui-button>
                <gui-button @click=${()=> this.menuClick('join')} btnStyle="stylized">Join game</gui-button>
                <gui-button @click=${()=> this.menuClick('createOrJoin')} btnStyle="stylized">Create or join</gui-button>
            </div>
        `;
    }

    menuClick(action): void {
        window.$game_state.dispatchEvent(`start.${action}`);
    }


}
