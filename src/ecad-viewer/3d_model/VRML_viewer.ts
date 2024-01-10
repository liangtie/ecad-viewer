import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLLoader } from "three/addons/loaders/VRMLLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let camera: THREE.Object3D<THREE.Object3DEventMap>,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    stats: Stats,
    controls: OrbitControls,
    loader: VRMLLoader;

const params = {
    asset: "house",
};

const assets = [
    "creaseAngle",
    "crystal",
    "house",
    "elevationGrid1",
    "elevationGrid2",
    "extrusion1",
    "extrusion2",
    "extrusion3",
    "lines",
    "meshWithLines",
    "meshWithTexture",
    "pixelTexture",
    "points",
    "DIP-8_W8.89mm_SMDSocket",
];

let vrmlScene: { traverse: (arg0: (object: any) => void) => void };

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // controls

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 200;
    controls.enableDamping = true;

    //

    stats = new Stats();
    document.body.appendChild(stats.dom);

    //

    window.addEventListener("resize", onWindowResize);

    //

    const gui = new GUI();
    gui.add(params, "asset", assets).onChange(function (value) {
        if (vrmlScene) {
            vrmlScene.traverse(function (object: {
                material: { dispose: () => void; map: { dispose: () => void } };
                geometry: { dispose: () => void };
            }) {
                if (object.material) object.material.dispose();
                if (object.material && object.material.map)
                    object.material.map.dispose();
                if (object.geometry) object.geometry.dispose();
            });

            scene.remove(vrmlScene);
        }

        loadAsset(value);
    });
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

    stats.update();
}
