/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { later } from "../../base/async";
import {
    CSS,
    CustomElement,
    attribute,
    css,
    html,
} from "../../base/web-components";
import { KCUIElement } from "../../kc-ui";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
import { FetchFileSystem, VirtualFileSystem } from "../services/vfs";
import type { KCBoardAppElement } from "./kc-board/app";
import type { KCSchematicAppElement } from "./kc-schematic/app";

/**
 *
 */
class Kicad3DViewer extends CustomElement {
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
                background-color: aqua;
                color: var(--fg);
                font-family: "Nunito", ui-rounded, "Hiragino Maru Gothic ProN",
                    Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold",
                    Calibri, source-sans-pro, sans-serif;
                contain: layout paint;
            }

            main {
                display: contents;
            }

            kc-board-app,
            kc-schematic-app {
                width: 100%;
                height: 100%;
                flex: 1;
            }
        `,
    ];

    constructor() {
        super();
    }

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

    #schematic_app: KCSchematicAppElement;
    #board_app: KCBoardAppElement;

    override initialContentCallback() {
        this.#setup_events();
        later(() => {
            this.#load_src();
        });
    }

    async #setup_events() {}

    async #load_src() {
        const sources = [];

        if (this.src) {
            sources.push(this.src);
        }

        if (sources.length == 0) {
            console.warn("No valid sources specified");
            return;
        }

        const vfs = new FetchFileSystem(sources);
        await this.#setup_project(vfs);
    }

    async #setup_project(vfs: VirtualFileSystem) {
        this.loaded = false;
        this.loading = true;

        try {
            this.loaded = true;
            await this.update();
        } finally {
            this.loading = false;
        }
    }

    override render() {
        if (!this.loaded) {
            return html``;
        }

        this.#schematic_app = html`<kc-schematic-app
            sidebarcollapsed
            controls="${this.controls}"
            controlslist="${this.controlslist}">
        </kc-schematic-app>` as KCSchematicAppElement;
        return html` ${this.#schematic_app} ${this.#board_app} `;
    }
}

window.customElements.define("kicad-3d-viewer", Kicad3DViewer);
