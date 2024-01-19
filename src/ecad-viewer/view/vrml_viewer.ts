import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLLoader } from "../model/3d_model/kicad_vrml_loader";

import { CSS, attribute, css, html } from "../../base/web-components";
import { KCUIElement } from "../../kc-ui";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
import type { ECadSource } from "../utils/ecad_source";

class VRMLViewer extends KCUIElement {
    @attribute({ type: String })
    src: string | null;

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
                background-color: white;
                color: var(--fg);
            }

            main {
                display: contents;
            }

            vrml-viewer,
            canvas {
                width: 100%;
                height: 90%;
                flex: 1;
            }
            .spacer {
                height: 10px; /* Adjust the height as needed */
              }
        `,
    ];

    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loader: VRMLLoader;
    private vrmlScene: THREE.Scene;

    private spacer : HTMLDivElement

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
        this.loadAsset();
        this.spacer = html`<div class="spacer"></div>` as HTMLDivElement;

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
        return  html` <style>
        :host {
            display: block;
            touch-action: none;
            width: 90%;
            height: 90%;
        }
        canvas {
            width: 90%;
            height: 90%;
            border: solid 1px rgb(24, 144, 255);
        }
        spacer {
            height: 10%; /* Adjust the height as needed */
        }
    </style>  ${this.renderer.domElement} ${this.spacer} `;
    }

    public loadAsset() {
        const sources = [];
        if (this.src) {
            sources.push(this.src);
        }

        for (const src_elm of this.querySelectorAll<ECadSource>(
            "ecad-source",
        )) {
            if (src_elm.src) {
                sources.push(src_elm.src);
            }
        }

        if (sources.length == 0) {
            console.warn("No valid sources specified");
            return;
        }

        if (sources.length == 0) {
            console.warn("No valid sources specified");
            return;
        }

        if (sources.length)
            this.loader.load(
                sources[0]!,
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
