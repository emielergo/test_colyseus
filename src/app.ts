// import styling
import './index.scss'
// import UI Components
import './UI/gui'
import Menu from './menu'
import { initState } from './state';


window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let menu = new Menu('renderCanvas');

    // Create the scene.
    menu.createMenu();
    initState();
    document.querySelector('.game-ui').innerHTML = '<gui-main></gui-main>';
    menu.wireButtons();
});
