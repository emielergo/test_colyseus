import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

@customElement('gui-button')
export class GuiButton extends LitElement {
    static styles = [
        css`
            button {
                user-select: none;
                text-rendering: auto;
                display: flex;
                min-height: 32px;
                align-items: center;
                justify-content: center;
                padding: 12px 16px;
                border: none;
                cursor: pointer;
                border-radius: var(--ui-roundness);
                transition: 400ms all var(--ui-easing-bounce);
                pointer-events: all;
            }

            button.stylized {
                user-select: none;
                text-rendering: auto;
                display: flex;
                min-height: 32px;
                align-items: center;
                justify-content: center;
                padding: 12px 16px;
                border: none;
                cursor: pointer;
                border-radius: var(--ui-roundness);
                transition: 400ms all var(--ui-easing-bounce);
                pointer-events: all;
                border: 2px solid black;
                background: linear-gradient(var(--ui-palette-blue),var(--ui-palette-lightblue));
                box-shadow: inset 0px -2px 0px 0px #ffffffab, inset 0 -24px 0px 0px #3b7bce, inset 0px 2px 0px 0px #ffffff38;
                color: white;
                min-width: 140px;
            }

            button:hover.stylized {
                transform: scale(1);
                box-shadow: inset 0px -2px 0px 0px #ffffff1c, inset 0 -18px 0px 0px #3b7bce, inset 0px 2px 0px 0px #ffffff00;
            }

            button.pill {
                box-shadow: inset 0px 0px 16px 0px #1561eb21, 0px 0px 8px #000000ba;
                border: 1px solid #ffffff50;
                border-top: 1px solid #ffffff6b;
                background-color: #3289c7;
                color: white;
                border-radius: 30px;
                padding: 12px 24px;
                z-index: 10;
                min-width: 140px;
            }

            button:hover {
                transform: scale(1.08);
                transition: 300ms all ease;
            }
        `
    ];

    @property({ type: String })
    btnStyle = 'pill';

    @property({ type: Boolean, reflect: true, attribute: true })
    disabled = false;

    render() {
        return html`
            <button type="button" ?disabled=${this.disabled} class="${this.btnStyle}">
                <slot></slot>
            </button>
        `;
    }
}
