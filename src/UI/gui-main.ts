import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js'

// import scenes
import './scenes/gui-start.scene'
import './scenes/gui-1v1.scene'

@customElement('gui-main')
export class GuiMain extends LitElement {

public scene;

    static styles = [
        css`
            :host {
                display: grid;
                padding: var(--ui-spacing);
                width: 100vw;
            }
        `
    ];

    constructor() {
        super();
        this.scene = this.renderStartScene;
        window.$game_state.addEventListener('state.scene', this.changeScene.bind(this)); 
    }

    changeScene(event) {
        switch(event.detail.value) {
            case 'start':
                this.scene = this.renderStartScene;
                break;
            case '1v1':
                this.scene = this.render1v1Scene;
                break;
        }
        this.update();
    }

    renderStartScene() {
        return html`
                    <gui-start-scene>
                        
                    </gui-start-scene>
        `
    }

    render1v1Scene() {
        return html`<gui-1v1-scene></gui-1v1-scene>`
    }

    render() {
        return html`
                ${this.scene()}
        `;
    }
}
