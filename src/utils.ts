import * as BABYLON from "babylonjs";
import { Bullet, Bunker } from "./raid_objects";

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

    return puffy;
}

export var createBubba = function createBubba(scene) {
    const bubba = BABYLON.MeshBuilder.CreateBox("bubba", { width: 1, height: 1, depth: 1 });
    bubba.position = new BABYLON.Vector3(0, 1, 180);
    bubba.actionManager = new BABYLON.ActionManager(scene);

    const bubba_material = new BABYLON.StandardMaterial("bubba_material");
    bubba_material.diffuseColor = BABYLON.Color3.Red();
    bubba.material = bubba_material;

    return bubba;
}

export var createOlek = function createOlek(scene) {
    const olek = BABYLON.MeshBuilder.CreateCylinder("olek", { diameterTop: 0, height: 1, diameterBottom: 1 });
    olek.position = new BABYLON.Vector3(-5, 1, 180);
    olek.actionManager = new BABYLON.ActionManager(scene);

    const olek_material = new BABYLON.StandardMaterial("olek_material");
    olek_material.diffuseColor = BABYLON.Color3.Green();
    olek.material = olek_material;
    olek.rotation = BABYLON.Vector3.RotationFromAxis(new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1));

    return olek;
}

export var createBunker = function createBunker(scene) {
    let bunker_mesh = BABYLON.MeshBuilder.CreateBox("bunker_mesh", { width: 1, height: 2, depth: 2 })
    let bunker_material = new BABYLON.StandardMaterial("bunker_material", scene);

    bunker_material.diffuseColor = BABYLON.Color3.Black();
    bunker_mesh.material = bunker_material;

    return new Bunker(bunker_mesh.id, 200, bunker_mesh);
}

export var createBulletMesh = function createBulletMesh(scene) {
    const bullet_mesh = BABYLON.MeshBuilder.CreateSphere("bullet_mesh", { diameter: 0.1 });
    bullet_mesh.position = new BABYLON.Vector3(0, 1, -47.8);

    const bullet_material = new BABYLON.StandardMaterial("bullet_material", scene);
    bullet_material.diffuseColor = BABYLON.Color3.Black();
    bullet_mesh.material = bullet_material;

    return bullet_mesh;
}

