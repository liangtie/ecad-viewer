/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { KicadPCB } from "../../kicad/board";
import { WithContext } from "../../base/dom/context";
import { CustomElement, html } from "../../base/dom/custom-element";
import { DropTarget } from "../../base/dom/drag-drop";
import * as theme from "../../kicad/theme";
import { Project } from "../project";
import { KicadSch } from "../../kicad/schematic";
import { FetchFileSystem, type VirtualFileSystem } from "../services/vfs";
import { KCBoardViewerElement } from "./kc-board/kc-board-viewer";
import type { KCProjectPanelElement } from "./kc-project-panel";
import { KCSchematicViewerElement } from "./kc-schematic/kc-schematic-viewer";
import kicanvas_app_styles from "./kicanvas-app.css";

import "./kc-board/kc-board-viewer";
import "./kc-project-panel";
import "./kc-schematic/kc-schematic-viewer";
import "../../kc-ui/kc-ui";
import { first } from "../../base/iterator";

class KiCanvasAppElement extends WithContext(CustomElement) {
    static override styles = kicanvas_app_styles;

    project: Project = new Project();

    #kc_schematic_viewer: KCSchematicViewerElement;
    #kc_board_viewer: KCBoardViewerElement;
    #project_panel: KCProjectPanelElement;

    constructor() {
        super();
        this.provideContext("project", this.project);
    }

    set loading(val: boolean) {
        this.setBooleanAttribute("loading", val);
        if (val) {
            this.loaded = false;
        }
    }

    get loading() {
        return this.getBooleanAttribute("loading");
    }

    set loaded(val: boolean) {
        this.setBooleanAttribute("loaded", val);
        this.loading = false;
    }

    get loaded() {
        return this.getBooleanAttribute("loaded");
    }

    override initialContentCallback() {
        const src = this.getAttribute("src");
        const url_params = new URLSearchParams(document.location.search);
        const github_path = url_params.get("github");

        (async () => {
            if (src) {
                await this.setup_project(new FetchFileSystem([src]));
                await this.load_default_file();
                return;
            }

            if (github_path) {
                // TODO: Use VFS
                console.log("Github loading disabled");
                // const gh = new GitHubUserContent();
                // const gh_url = gh.convert_url(github_path);
                // (async () => {
                //     this.load(await gh.get(gh_url));
                // })();
                return;
            }

            new DropTarget(this, async (fs) => {
                await this.setup_project(fs);
                this.load_default_file();
            });
        })();

        this.addEventListener("file:select", (e) => {
            const detail = (e as CustomEvent).detail;
            this.load_file(detail.filename);
        });
    }

    private async setup_project(vfs: VirtualFileSystem) {
        this.loading = true;
        await this.project.setup(vfs);
        this.#project_panel.update();
        this.loaded = true;
    }

    private async load_default_file() {
        // for right now just load the first schematic or board file
        if (this.project.has_boards()) {
            return await this.load_file(first(this.project.list_boards())!);
        } else if (this.project.has_schematics()) {
            return await this.load_file(first(this.project.list_schematics())!);
        } else {
            throw new Error("No valid KiCAD files found");
        }
    }

    private async load_file(filename: string) {
        const doc = await this.project.load_file(filename);
        this.#project_panel.selected = doc?.filename ?? null;

        if (doc instanceof KicadPCB) {
            this.#kc_board_viewer.classList.remove("is-hidden");
            this.#kc_schematic_viewer.classList.add("is-hidden");
            await this.#kc_board_viewer.load(doc);
        } else if (doc instanceof KicadSch) {
            this.#kc_board_viewer.classList.add("is-hidden");
            this.#kc_schematic_viewer.classList.remove("is-hidden");
            await this.#kc_schematic_viewer.load(doc);
        } else {
            throw new Error(`Unable to load ${filename}`);
        }
    }

    override render() {
        this.style.backgroundColor = theme.schematic.background.to_css();
        this.style.color = theme.schematic.note.to_css();

        this.#kc_schematic_viewer = html`<kc-schematic-viewer
            class="is-hidden"></kc-schematic-viewer>` as KCSchematicViewerElement;
        this.#kc_board_viewer = html`<kc-board-viewer
            class="is-hidden"></kc-board-viewer>` as KCBoardViewerElement;
        this.#project_panel =
            html`<kc-project-panel></kc-project-panel>` as KCProjectPanelElement;

        return html`
            <kc-ui-app>
                <section class="overlay">
                    <img src="kicanvas.png" />
                    <p>Drag & drop your kicad schematic or board file here.</p>
                </section>
                <main>
                    <kc-ui-floating-toolbar location="top">
                        <div slot="left">${this.#project_panel}</div>
                    </kc-ui-floating-toolbar>
                    ${this.#kc_schematic_viewer} ${this.#kc_board_viewer}
                </main>
            </kc-ui-app>
        `;
    }
}

window.customElements.define("kicanvas-app", KiCanvasAppElement);
