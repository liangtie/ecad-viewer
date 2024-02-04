/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { later } from "../../base/async";
import { CSS, attribute, css, html } from "../../base/web-components";
import { KCUIElement } from "../../kc-ui";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
import { Project } from "../../kicanvas/project";
import {
    FetchFileSystem,
    VirtualFileSystem,
} from "../../kicanvas/services/vfs";
import { KCSchematicAppElement } from "../../kicanvas/elements/kc-schematic/app";
import { ECadSource } from "../utils/ecad_source";

/**
 *
 */
class KicadSymbolViewer extends KCUIElement {
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

    #schematic_app: KCSchematicAppElement;

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

        this.provideContext("alter_source", []);

        const vfs = new FetchFileSystem(sources);
        await this.#setup_project(vfs);
    }

    async #setup_project(vfs: VirtualFileSystem) {
        this.loaded = false;
        this.loading = true;

        try {
            await this.#project.load(vfs);

            this.loaded = true;
            await this.update();

            this.#project.set_active_page(this.#project.active_page_name!);
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
        return html` ${this.#schematic_app}`;
    }
}

window.customElements.define("kicad-symbol-viewer", KicadSymbolViewer);
