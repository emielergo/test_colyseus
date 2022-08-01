import * as BABYLON from "babylonjs";

export const createSkyBox = (scene: BABYLON.Scene) => {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0}, scene);
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
