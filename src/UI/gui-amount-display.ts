import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

@customElement('gui-amount-display')
export class GuiAmountDisplay extends LitElement {
    static styles = [
        css`
            :host {
                display: flex;
                align-items: center;
            }
            .icon {
                width: 48px;
                border-radius: 100px;
                background-color: linear-gradient(0deg, var(--ui-palette-blue), var(--ui-palette-lightblue));
                z-index: 1;
                filter: drop-shadow(0px 0px 4px black);
            }
            .amount-bar {
                width: 75px;
                height: 32px;
                background: rgb(58, 58, 58);
                border-radius: 8px;
                margin-left: -48px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding: 0px 16px;
                box-shadow: rgb(46 46 46) 0px -23px 0px -4px inset;
            }
            .amount {
                color: white;
                text-shadow: 0px 0px 2px black;
                font-weight: bold;
                font-size: 16px;
                user-select: none;
            }

            .icon--orange {
                fill: var(--ui-palette-orange);
            }
            .icon--blue {
                fill: var(--ui-palette-blue);
            }
            .icon--white {
                fill: white;
            }
        `
    ];

    @property({ type: Number })
    public amount: Number = 0;

    @property({ type: String })
    public iconColor: String = 'white';

    render() {
        return html`
            <div class="icon icon--${this.iconColor}">
                <slot></slot>
            </div>
            <div class="amount-bar">
                <span class="amount">
                    ${this.amount < 1000 ? this.amount : Math.floor(this.amount / 1000) + 'k'}
                </span>
            </div>
        `;
    }
}
