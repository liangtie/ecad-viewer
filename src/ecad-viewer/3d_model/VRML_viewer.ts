import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLLoader } from "./kicad_vrml_loader";

let camera: THREE.Camera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    controls: OrbitControls,
    loader: VRMLLoader;

const params = {
    asset: "DIP-8_W8.89mm_SMDSocket",
};

let vrmlScene: THREE.Scene;

export function init() {
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1e10,
    );
    camera.position.set(-10, 5, 10);

    scene = new THREE.Scene();
    scene.add(camera);

    // light

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(200, 200, 200);
    scene.add(dirLight);

    loader = new VRMLLoader();
    loadAsset(params.asset);

    // renderer

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    //FIXME -
    // renderer.setSize(246, 246);
    document.body.appendChild(renderer.domElement);

    // controls

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 200;
    controls.enableDamping = true;

    window.addEventListener("resize", onWindowResize);
}

function loadAsset(asset: string) {
    loader.load("vrml/" + asset + ".wrl", function (object: any) {
        vrmlScene = object;
        scene.add(object);
        controls.reset();
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function animate() {
    requestAnimationFrame(animate);

    controls.update(); // to support damping

    renderer.render(scene, camera);
}
