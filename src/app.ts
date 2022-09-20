// import styling
import './index.scss'
// import UI Components
import './UI/gui'
import Menu from './menu'


window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let menu = new Menu('renderCanvas');

    // Create the scene.
    menu.createMenu();
    menu.wireButtons();
});
