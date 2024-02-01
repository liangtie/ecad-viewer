import * as OV from "online-3d-viewer";
import { KCUIElement } from "../../kc-ui/element";
import { later } from "../../base/async";
import { CSS, attribute, css, html } from "../../base/web-components";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
import { Project } from "../../kicanvas/project";
import type { ECadSource } from "../utils/ecad_source";

class OnLine3dViewer extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        new CSS(kc_ui_styles),
        css`
            :host {
                margin: 0;
                display: flex;
                position: relative;
                width: 100%;
                max-height: 100%;
                aspect-ratio: 1.414;
                background-color: white;
                color: var(--fg);
                contain: layout paint;
            }

            main {
                display: contents;
            }

            kc-schematic-app {
                width: 100%;
                height: 100%;
                flex: 1;
            }
        `,
    ];

    constructor() {
        super();
        this.provideContext("project", this.#project);
        this.#viewer = new OV.EmbeddedViewer(this, {
            camera: new OV.Camera(
                new OV.Coord3D(-1.5, 2, 3),
                new OV.Coord3D(0, 0, 0),
                new OV.Coord3D(0, 1, 0),
                45,
            ),
            backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
            defaultColor: new OV.RGBColor(200, 200, 200),
            edgeSettings: new OV.EdgeSettings(
                false,
                new OV.RGBColor(0, 0, 0),
                1,
            ),
        });
    }

    #project: Project = new Project();

    @attribute({ type: String })
    src: string | null;

    @attribute({ type: Boolean })
    public loading: boolean;

    @attribute({ type: Boolean })
    public loaded: boolean;

    @attribute({ type: String })
    controls: "none" | "basic" | "full" | null;

    @attribute({ type: String })
    controlslist: string | null;

    @attribute({ type: String })
    theme: string | null;

    @attribute({ type: String })
    zoom: "objects" | "page" | string | null;

    #viewer: OV.EmbeddedViewer;

    override initialContentCallback() {
        this.#setup_events();
        later(() => {
            this.#load_src();
        });
    }

    async #setup_events() {}

    async #load_src() {
        this.loaded = false;
        this.loading = true;
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

        const first = sources[0];

        if (!first) {
            this.loaded = false;
            this.loading = false;
            console.warn("No valid sources specified");
        } else {
            this.#viewer.LoadModelFromUrlList([first]);
            await this.update();
            this.loaded = true;
            this.loading = false;
        }
    }

    override render() {
        if (!this.loaded) {
            return html``;
        }

        return html` <style>
                :host {
                    display: block;
                    touch-action: none;
                    width: 100%;
                    height: 100%;
                }
                canvas {
                    width: 100%;
                    height: 100%;
                    border: solid 1px rgb(24, 144, 255);
                }
            </style>
            ${this.#viewer}`;
    }
}

window.addEventListener("load", () => {
    // set the location of the external libraries
    OV.SetExternalLibLocation("../libs");
});

window.customElements.define("online-3d-viewer", OnLine3dViewer);
