import * as BABYLON from "babylonjs";
import Axie, { Bullet, Bunker } from "./raid_objects";
import * as GUI from 'babylonjs-gui';
import { Button } from "babylonjs-gui";
import Card from "./card";
import { int } from "babylonjs";
import "@babylonjs/loaders/glTF";
import { Delaunay } from 'd3-delaunay';

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
    let forward = target.mesh.position.subtract(mesh.position);
    let up = xnormal;
    let side = BABYLON.Vector3.Cross(up, forward);

    return BABYLON.Vector3.RotationFromAxis(side, up, forward);
}

export var createPuffy = async function createPuffy(scene) {
    let puffy;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", "puffy.babylon").then((result) => {
        puffy = scene.getMeshByName("puffy");
        result.meshes.forEach(mesh => {
            if (mesh.id != "puffy") {
                mesh.parent = puffy;
            }
        })
    });
    puffy.position = new BABYLON.Vector3(5, 1, 180);
    puffy.actionManager = new BABYLON.ActionManager(scene);

    axie_move_source_by_id_map.set('puffy', ['./public/puffy-puff.png', './public/puffy-baby.png', './public/puffy-little crab.png', './public/puffy-jellytackle.png', './public/puffy-tiny-dino.png', './public/puffy-puff-tail.png']);

    const puffy_axie = new Axie(puffy.id, 0, 0, 0, 0, 'puffy', puffy, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('puffy').length; i++) {
        puffy_axie.cards_list.push(new Card(i, i * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('puffy')[i]));
    }

    return puffy_axie;
}

export var createBubba = async function createBubba(scene) {
    let bubba;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", "bubba.babylon").then((result) => {
        bubba = scene.getMeshByName("bubba");
        result.meshes.forEach(mesh => {
            if (mesh.id != "bubba") {
                mesh.parent = bubba;
            }
        })
    });
    bubba.position = new BABYLON.Vector3(0, 1, 180);
    bubba.actionManager = new BABYLON.ActionManager(scene);

    axie_move_source_by_id_map.set('bubba', ['./public/bubba-foxy-mouth.png', './public/bubba-sparky.png', './public/bubba-foxy.png', './public/bubba-persimmon.png', './public/bubba-forest-hero.png', './public/bubba-buba-brush.png']);

    const bubba_axie = new Axie(bubba.id, 0, 0, 0, 0, 'bubba', bubba, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('bubba').length; i++) {
        bubba_axie.cards_list.push(new Card(i, i * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('bubba')[i]));
    }

    return bubba_axie;
}

export var createOlek = async function createOlek(scene) {
    let olek;
    await BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", "olek.babylon").then((result) => {
        olek = scene.getMeshByName("olek");
        result.meshes.forEach(mesh => {
            if (mesh.id != "olek") {
                mesh.parent = olek;
            }
        })
    });
    olek.position = new BABYLON.Vector3(-5, 1, 180);

    axie_move_source_by_id_map.set('olek', ['./public/olek-beetroot.png', './public/olek-risky-trunk.png', './public/olek-hidden-ears.png', './public/olek-rusty-helm.png', './public/olek-succulent.png', './public/olek-sprout.png']);

    const olek_axie = new Axie(olek.id, 0, 0, 0, 0, 'olek', olek, null);

    for (let i = 0; i < axie_move_source_by_id_map.get('olek').length; i++) {
        olek_axie.cards_list.push(new Card(i, (i + 1) * 5, 25 - i * 5, 0, null, axie_move_source_by_id_map.get('olek')[i]));
    }

    return olek_axie;
}

// async function createMeshFromBabylonFile(name, scene){
//     let mesh;
//     await BABYLON.SceneLoader.ImportMeshAsync("", "/public/Meshes/", "name.babylon").then((result) => {
//         mesh = scene.getMeshByName("name");
//         result.meshes.forEach(mesh => {
//             console.log(mesh.name);
//             if (mesh.id != "id") {
//                 mesh.parent = mesh;
//             }
//         })
//     });

//     return mesh;
// }

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

export var createHealthBarMesh = function createHealthBarMesh(scene) {
    const health_bar = BABYLON.MeshBuilder.CreateBox("health_bar", { width: 1, height: 0.2, depth: 0.2 });

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
                } else if (game.selectedAxie.mesh.id.includes("bubba")) {
                    game.bubba.active_cards[type_map.get(button.id)] = 1;
                    game.bubba.level++;
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
    window.$game_state.dispatchEvent('energy', {value: game.energy});
    //game.energy_text_block.text = `Energy: ${game.energy}`.toUpperCase();
}

export var setCrystalText = function setCrystalText(game) {
    window.$game_state.dispatchEvent('crystal', {value: game.crystal});
    //game.crystal_text_block.text = `Crystal: ${game.crystal}`.toUpperCase();
}


export function generateMap(scene: BABYLON.Scene, mapSize = { x: 15, y: 30 }, minHeight: number = 1, color: BABYLON.Color3 = new BABYLON.Color3(0.70, 0.62, 0.52)) {
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
    let voronoi = delaunay.voronoi([0,0,mapSize.x,mapSize.y]);
  
    let material = new BABYLON.StandardMaterial('terrain', scene);
    material.diffuseColor = color;
    material.ambientColor = new BABYLON.Color3(0.5,0.5,0.5);
    material.specularPower = 100;
    material.specularColor = color;
  
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
        path: [new BABYLON.Vector3(x,0,y), new BABYLON.Vector3(x, Math.random() * baseHeight + baseHeight, y)],
        updatable: false,
        closeShape: true,
        cap: BABYLON.Mesh.CAP_ALL,
        scale: 1000 // scale up, when not scaling by a huge number, the whole thing gets warped for some reason
      }, scene);
      mesh.material = material;
      mesh.scaling = new BABYLON.Vector3(0.001,0.001,0.001);
    }
  
  }
