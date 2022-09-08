import * as BABYLON from "babylonjs";
import Axie, { Bullet, Bunker } from "./raid_objects";
import * as GUI from 'babylonjs-gui';
import { Button } from "babylonjs-gui";
import Card from "./card";
import { int } from "babylonjs";

export const axie_move_source_by_id_map = new Map<String, string[]>();
export var type_map: Map<String, int> = new Map<String, int>([["mouth", 0], ["eyes", 1], ["ears", 2], ["horn", 3], ["back", 4], ["tail", 5]]);

export const createSkyBox = (scene: BABYLON.Scene) => {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./public/textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    skybox.isPickable = false;
}

export var getHorizontalPlaneVector = function (y, pos, rot) {
    if (!rot.y) {
        return null; // no solution, as it will never hit the zero plane
    }
    return new BABYLON.Vector3(
        pos.x - (pos.y - y) * rot.x / rot.y,
        1,
        pos.z - (pos.y - y) * rot.z / rot.y
    );
};

export var getZeroPlaneVector = function (pos, rot) {
    return getHorizontalPlaneVector(0, pos, rot);
};

export var getRotationVectorFromTarget = function (xnormal, mesh, target) {
    let forward = mesh.position.subtract(target.mesh.position).normalize();
    let up = BABYLON.Vector3.Cross(xnormal, forward);
    let side = BABYLON.Vector3.Cross(forward, up);

    return BABYLON.Vector3.RotationFromAxis(forward, up, side);
}

export var createPuffy = function createPuffy(scene) {
    const puffy = BABYLON.MeshBuilder.CreateSphere("puffy", { diameterZ: 1.5 });
    puffy.position = new BABYLON.Vector3(5, 1, 180);
    puffy.actionManager = new BABYLON.ActionManager(scene);

    const puffy_material = new BABYLON.StandardMaterial("puffy_material");
    puffy_material.diffuseColor = BABYLON.Color3.Blue();
    puffy.material = puffy_material;

    axie_move_source_by_id_map.set('puffy', ['./public/puffy-puff.png', './public/puffy-baby.png', './public/puffy-little crab.png', './public/puffy-jellytackle.png', './public/puffy-tiny-dino.png', './public/puffy-puff-tail.png']);

    const puffy_axie = new Axie(puffy.id, 0, 0, 0, 0, 'puffy', puffy, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('puffy').length; i++) {
        puffy_axie.cards_list.push(new Card(i, i * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('puffy')[i]));
    }

    return puffy_axie;
}

export var createBubba = function createBubba(scene) {
    const bubba = BABYLON.MeshBuilder.CreateBox("bubba", { width: 1, height: 1, depth: 1 });
    bubba.position = new BABYLON.Vector3(0, 1, 180);
    bubba.actionManager = new BABYLON.ActionManager(scene);

    const bubba_material = new BABYLON.StandardMaterial("bubba_material");
    bubba_material.diffuseColor = BABYLON.Color3.Red();
    bubba.material = bubba_material;

    axie_move_source_by_id_map.set('bubba', ['./public/bubba-foxy-mouth.png', './public/bubba-sparky.png', './public/bubba-foxy.png', './public/bubba-persimmon.png', './public/bubba-forest-hero.png', './public/bubba-buba-brush.png']);

    const bubba_axie = new Axie(bubba.id, 0, 0, 0, 0, 'bubba', bubba, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('bubba').length; i++) {
        bubba_axie.cards_list.push(new Card(i, i * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('bubba')[i]));
    }

    return bubba_axie;
}

export var createOlek = function createOlek(scene) {
    const olek = BABYLON.MeshBuilder.CreateCylinder("olek", { diameterTop: 0, height: 1, diameterBottom: 1 });
    olek.position = new BABYLON.Vector3(-5, 1, 180);
    olek.actionManager = new BABYLON.ActionManager(scene);

    const olek_material = new BABYLON.StandardMaterial("olek_material");
    olek_material.diffuseColor = BABYLON.Color3.Green();
    olek.material = olek_material;
    olek.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1));

    axie_move_source_by_id_map.set('olek', ['./public/olek-beetroot.png', './public/olek-risky-trunk.png', './public/olek-hidden-ears.png', './public/olek-rusty-helm.png', './public/olek-succulent.png', './public/olek-sprout.png']);

    const olek_axie = new Axie(olek.id, 0, 0, 0, 0, 'olek', olek, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('olek').length; i++) {
        olek_axie.cards_list.push(new Card(i, (i + 1) * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('olek')[i]));
    }

    return olek_axie;
}

export var createBunker = function createBunker(scene) {
    let bunker_mesh = BABYLON.MeshBuilder.CreateBox("bunker_mesh", { width: 1, height: 2, depth: 2 })
    let bunker_material = new BABYLON.StandardMaterial("bunker_material", scene);

    bunker_material.diffuseColor = BABYLON.Color3.Black();
    bunker_mesh.material = bunker_material;

    return new Bunker(bunker_mesh.id, 200, 50, 1, 'bunker', bunker_mesh, null);
}

export var createBulletMesh = function createBulletMesh(scene) {
    const bullet_mesh = BABYLON.MeshBuilder.CreateSphere("bullet_mesh", { diameter: 0.1 });
    bullet_mesh.position = new BABYLON.Vector3(0, 1, -47.8);

    const bullet_material = new BABYLON.StandardMaterial("bullet_material", scene);
    bullet_material.diffuseColor = BABYLON.Color3.Black();
    bullet_mesh.material = bullet_material;

    return bullet_mesh;
}

export var createButton = function createButton(name, source, game): Button {
    const button = GUI.Button.CreateImageOnlyButton(name, source);
    button.width = "80px";
    button.height = "80px";
    button.thickness = 0;
    button.paddingTop = "10px"
    button.onPointerClickObservable.add(function (ev, state) {
        const button = state.currentTarget;
        if (game.crystal >= 10) {
            if (button.thickness == 0) {
                button.thickness = 3;

                game.crystal = game.crystal - 10;
                game.selectedAxie.active_cards[type_map.get(button.name)] = 1;
                setCrystalText(game);

                if (game.selectedAxie.mesh.id.includes("puffy")) {
                    game.puffy.active_cards[type_map.get(button.id)] = 1;
                } else if (game.selectedAxie.mesh.id.includes("bubba")) {
                    game.bubba.active_cards[type_map.get(button.id)] = 1;
                } else {
                    game.olek.active_cards[type_map.get(button.id)] = 1;
                }
            }
        }
    });

    return button;
}

export var setEnergyText = function setEnergyText(game) {
    game.energy_text_block.text = `Energy: ${game.energy}`.toUpperCase();
}

export var setCrystalText = function setCrystalText(game) {
    game.crystal_text_block.text = `Crystal: ${game.crystal}`.toUpperCase();
}

