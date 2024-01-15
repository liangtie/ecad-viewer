import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLLoader } from "./kicad_vrml_loader";

import { CSS, css } from "../../base/web-components";
import { KCUIElement } from "../../kc-ui";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
class VRMLViewer extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        new CSS(kc_ui_styles),
        css`
            :host {
                margin: 0;
                display: flex;
                position: relative;
                width: 100%;
                height: 100%;
                max-height: 100%;
                max-width: 100%;
                background-color: aqua;
                color: var(--fg);
            }

            main {
                display: contents;
            }

            vrml-viewer,
            canvas {
                width: 100%;
                height: 100%;
                flex: 1;
            }
        `,
    ];

    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loader: VRMLLoader;
    private vrmlScene: THREE.Scene;

    public constructor() {
        super();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1e10,
        );
        this.camera.position.set(-10, 5, 10);

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        // light

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(200, 200, 200);
        this.scene.add(dirLight);

        this.loader = new VRMLLoader();
        this.loadAsset("DIP-8_W8.89mm_SMDSocket");

        // renderer

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // this.controls

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement,
        );
        this.controls.minDistance = 1;
        this.controls.maxDistance = 200;
        this.controls.enableDamping = true;

        const do_animate = () => {
            requestAnimationFrame(do_animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        do_animate();
    }

    public make_view() {
        return this.renderer.domElement;
    }
    override render(): Element | DocumentFragment {
        return this.renderer.domElement;
    }

    public loadAsset(asset: string) {
        this.loader.load(
            "vrml/" + asset + ".wrl",
            (object: any) => {
                this.vrmlScene = object;
                this.scene.add(object);
                this.controls.reset();
            },
            undefined,
            undefined,
        );
    }

    public updateControl() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.customElements.define("vrml-viewer", VRMLViewer);
