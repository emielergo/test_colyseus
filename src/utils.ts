import * as BABYLON from "babylonjs";
import Axie, { Bullet, Bunker } from "./raid_objects";
import * as GUI from 'babylonjs-gui';
import { Button } from "babylonjs-gui";
import Card from "./card";
import { int, ShadowGenerator } from "babylonjs";
import "@babylonjs/loaders/glTF";
import { Delaunay } from 'd3-delaunay';
import * as BABYLONMaterials from 'babylonjs-materials'
import 'babylonjs-loaders'

export const axie_move_source_by_id_map = new Map<String, string[]>();
export var type_map: Map<String, int> = new Map<String, int>([["mouth", 0], ["eyes", 1], ["ears", 2], ["horn", 3], ["back", 4], ["tail", 5]]);

export const createSkyBox = (scene: BABYLON.Scene) => {
    var box = BABYLON.MeshBuilder.CreateSphere("gradient-sky", { diameter: 1000 }, scene);
    box.position.y = 0;
    var gradientMaterial = new BABYLONMaterials.GradientMaterial("sky-gradient", scene);
    gradientMaterial.topColor = new BABYLON.Color3(0, 0.88, 1);
    gradientMaterial.bottomColor = new BABYLON.Color3(0, 0.52, 1);
    gradientMaterial.offset = 2;
    gradientMaterial.smoothness = 1;
    gradientMaterial.scale = 0.005;
    gradientMaterial.backFaceCulling = false;
    box.material = gradientMaterial;
    box.isPickable = false;

}

export var getRotationVectorFromTarget = function (xnormal, mesh, target) {
    let forward = target.mesh.position.subtract(mesh.position);
    let up = xnormal;
    let side = BABYLON.Vector3.Cross(forward, up);

    return BABYLON.Vector3.RotationFromAxis(forward, up, side);
}

export var createPuffy = async function createPuffy(scene) {
    let puffy;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/Meshes/", "puffy.glb").then((result) => {
        puffy = scene.getMeshByName("puffy");
    });
    puffy.position = new BABYLON.Vector3(5, 1, 180);
    puffy.actionManager = new BABYLON.ActionManager(scene);
    puffy.setEnabled(false);

    axie_move_source_by_id_map.set('puffy', ['/puffy-puff.png', '/puffy-baby.png', '/puffy-little crab.png', '/puffy-jellytackle.png', '/puffy-tiny-dino.png', '/puffy-puff-tail.png']);

    const puffy_axie = new Axie(puffy.id, 0, 0, 0, 0, 0, 'puffy', puffy, null);

    puffy_axie.cards_list.push(new Card('mouth', 0, 60, 0, 30, null, axie_move_source_by_id_map.get('puffy')[0]));
    puffy_axie.cards_list.push(new Card('eyes', 0, 60, 0, 0, 'baby buff', axie_move_source_by_id_map.get('puffy')[1]));
    puffy_axie.cards_list.push(new Card('ears', 5, 70, 0, 0, null, axie_move_source_by_id_map.get('puffy')[2]));
    puffy_axie.cards_list.push(new Card('horns', 0, 65, 0, 15, null, axie_move_source_by_id_map.get('puffy')[3]));
    puffy_axie.cards_list.push(new Card('back', 0, 80, 0, 0, null, axie_move_source_by_id_map.get('puffy')[4]));
    puffy_axie.cards_list.push(new Card('tail', 5, 63, 0, 0, null, axie_move_source_by_id_map.get('puffy')[5]));

    return puffy_axie;
}

export var createbuba = async function createbuba(scene) {
    let buba;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/Meshes/", "buba.glb").then((result) => {
        buba = scene.getMeshByName("buba");
    });
    buba.position = new BABYLON.Vector3(0, 1, 180);
    buba.actionManager = new BABYLON.ActionManager(scene);
    buba.setEnabled(false);

    axie_move_source_by_id_map.set('buba', ['/buba-foxy-mouth.png', '/buba-sparky.png', '/buba-foxy.png', '/buba-persimmon.png', '/buba-forest-hero.png', '/buba-buba-brush.png']);

    const buba_axie = new Axie(buba.id, 0, 0, 0, 0, 0, 'buba', buba, null);

    buba_axie.cards_list.push(new Card('mouth', 0, 65, 0, 0, null, axie_move_source_by_id_map.get('buba')[0]));
    buba_axie.cards_list.push(new Card('eyes', 0, 60, 0, 0, 'rage buff', axie_move_source_by_id_map.get('buba')[1]));
    buba_axie.cards_list.push(new Card('ears', 15, 60, 0, 0, null, axie_move_source_by_id_map.get('buba')[2]));
    buba_axie.cards_list.push(new Card('horns', 15, 60, 0, 0, null, axie_move_source_by_id_map.get('buba')[3]));
    buba_axie.cards_list.push(new Card('back', 0, 120, 0, 0, null, axie_move_source_by_id_map.get('buba')[4]));
    buba_axie.cards_list.push(new Card('tail', 0, 60, 0, 0, null, axie_move_source_by_id_map.get('buba')[5]));


    return buba_axie;
}

export var createOlek = async function createOlek(scene) {
    let olek;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/Meshes/", "olek.glb").then((result) => {
        olek = scene.getMeshByName("olek");
    });
    olek.position = new BABYLON.Vector3(-5, 1, 180);
    olek.setEnabled(false);

    axie_move_source_by_id_map.set('olek', ['/olek-beetroot.png', '/olek-risky-trunk.png', '/olek-hidden-ears.png', '/olek-rusty-helm.png', '/olek-succulent.png', '/olek-sprout.png']);

    const olek_axie = new Axie(olek.id, 0, 0, 0, 0, 0, 'olek', olek, null);

    //TODO: This should really be different
    olek_axie.cards_list.push(new Card('mouth', 0, 60, 0, 0, null, axie_move_source_by_id_map.get('olek')[0]));
    olek_axie.cards_list.push(new Card('eyes', 0, 0, 0, 50, 'heal allies', axie_move_source_by_id_map.get('olek')[1]));
    olek_axie.cards_list.push(new Card('ears', 0, 0, 60, 0, null, axie_move_source_by_id_map.get('olek')[2]));
    olek_axie.cards_list.push(new Card('horns', 0, 40, 40, 0, null, axie_move_source_by_id_map.get('olek')[3]));
    olek_axie.cards_list.push(new Card('back', 0, 0, 50, 0, null, axie_move_source_by_id_map.get('olek')[4]));
    olek_axie.cards_list.push(new Card('tail', 0, 0, 40, 40, null, axie_move_source_by_id_map.get('olek')[5]));

    return olek_axie;
}

export var createBunker = function createBunker(scene, game) {
    let bunker_mesh = BABYLON.MeshBuilder.CreateBox("bunker_mesh", { width: 2, height: 2, depth: 2 })
    let bunker_material = new BABYLON.StandardMaterial("bunker_material", scene);

    bunker_material.diffuseColor = BABYLON.Color3.Black();
    bunker_mesh.material = bunker_material;

    return new Bunker(bunker_mesh.id, 200, 30, 100, 'bunker', bunker_mesh, null, game);
}

export var createBulletMesh = function createBulletMesh(scene) {
    const bullet_mesh = BABYLON.MeshBuilder.CreateSphere("bullet_mesh", { diameter: 0.4 });
    bullet_mesh.position = new BABYLON.Vector3(0, 1, -47.8);

    const bullet_material = new BABYLON.StandardMaterial("bullet_material", scene);
    bullet_material.diffuseColor = BABYLON.Color3.White();
    bullet_mesh.material = bullet_material;

    return bullet_mesh;
}

export var createHealthBarMesh = function createHealthBarMesh(scene) {
    const health_bar = BABYLON.MeshBuilder.CreateBox("health_bar", { width: 1, height: 0.2, depth: 0.2 });
    health_bar.setEnabled(false);

    const health_bar_material = new BABYLON.StandardMaterial("health_bar_material");
    health_bar_material.diffuseColor = BABYLON.Color3.Green();
    health_bar.material = health_bar_material;

    return health_bar;
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
                game.selectedAxie.level++;
                game.selectedAxie.setDamageAndRangeFromCards();
                setCrystalText(game);

                if (game.selectedAxie.mesh.id.includes("puffy")) {
                    game.puffy.active_cards[type_map.get(button.id)] = 1;
                    game.puffy.level++;
                } else if (game.selectedAxie.mesh.id.includes("buba")) {
                    game.buba.active_cards[type_map.get(button.id)] = 1;
                    game.buba.level++;
                } else {
                    game.olek.active_cards[type_map.get(button.id)] = 1;
                    game.olek.level++;
                }
            }
        }
    });

    return button;
}

export var setEnergyText = function setEnergyText(game) {
    window.$game_state.dispatchEvent('energy', { value: game.energy });
    //game.energy_text_block.text = `Energy: ${game.energy}`.toUpperCase();
}

export var setCrystalText = function setCrystalText(game) {
    window.$game_state.dispatchEvent('crystal', { value: game.crystals });
    //game.crystal_text_block.text = `Crystal: ${game.crystal}`.toUpperCase();
}


export function generateMap(scene: BABYLON.Scene, mapSize = { x: 15, y: 30 }, minHeight: number = 1, color: BABYLON.Color3 = new BABYLON.Color3(0.70, 0.62, 0.52), ground, shadowGenerator: ShadowGenerator) {
    let points = [];
    for (let y = 0; y < mapSize.y; y++) {
        for (let x = 0; x < mapSize.x; x++) {

            points.push([
                (x + Math.random()),
                (y + Math.random()),
            ])

        }
    }
    let delaunay = Delaunay.from(points);
    let voronoi = delaunay.voronoi([0, 0, mapSize.x, mapSize.y]);
    let materials = [];
    for (let i = 0; i < 3; i++) {
        let material = new BABYLON.StandardMaterial('terrain-' + i, scene);
        let generatedColor = new BABYLON.Color3(color.r + i * 0.05, color.g + i * 0.05, color.b + i * 0.05);
        material.ambientColor = generatedColor;
        material.diffuseColor = generatedColor;
        material.specularPower = 1000;
        material.roughness = 10;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        materials.push(material);
    }

    let meshes = [];
    for (var polygon of voronoi.cellPolygons()) {
        let x = points[polygon.index][0];
        let y = points[polygon.index][1];
        let baseHeight = minHeight * 1000;
        if ((x > 2 && x < mapSize.x - 2) && (y > 2 && y < mapSize.y - 2))
            continue;
        if ((x > 1 && x < mapSize.x - 1) && (y > 1 && y < mapSize.y - 1))
            baseHeight = baseHeight / 3;

        // TODO: add terrain to root object
        let mesh = BABYLON.MeshBuilder.ExtrudeShape('polygon' + polygon.index, {
            shape: polygon.map(p => new BABYLON.Vector3(p[0], p[1], 0)),
            path: [new BABYLON.Vector3(x, 0, y), new BABYLON.Vector3(x, Math.random() * baseHeight + baseHeight, y)],
            updatable: false,
            closeShape: true,
            cap: BABYLON.Mesh.CAP_ALL,
            scale: 1000 // scale up, when not scaling by a huge number, the whole thing gets warped for some reason
        }, scene);

        mesh.material = materials[Math.floor(Math.random() * 2.99)];
        mesh.scaling = new BABYLON.Vector3(0.00164, 0.002, 0.001670);
        // mesh.parent = ground;
        mesh.position.x = 20;
        mesh.position.z = 150;
        meshes.push(mesh);
    }

    let mesh = BABYLON.Mesh.MergeMeshes(meshes, true, undefined, undefined, undefined, true)
    shadowGenerator.getShadowMap().renderList.push(mesh);
    mesh.receiveShadows = true;
    mesh.parent = ground;
}
