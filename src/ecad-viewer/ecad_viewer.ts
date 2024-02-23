import { later } from "../base/async";
import {
    CSS,
    CustomElement,
    attribute,
    css,
    html,
} from "../base/web-components";
import { KCUIElement } from "../kc-ui";
import kc_ui_styles from "../kc-ui/kc-ui.css";
import { Project } from "../kicanvas/project";
import { FetchFileSystem, VirtualFileSystem } from "../kicanvas/services/vfs";
import { KCBoardAppElement } from "../kicanvas/elements/kc-board/app";
import type { KCSchematicAppElement } from "../kicanvas/elements/kc-schematic/app";
import type { TabHeaderElement } from "./tab_header";
import {
    TabActivateEvent,
    TabMenuClickEvent,
    TabMenuVisibleChangeEvent,
} from "../viewers/base/events";
import { TabKind } from "./constraint";
class ECadViewer extends KCUIElement {
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

            .vertical {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }

            kc-board-app,
            kc-schematic-app {
                flex: 1;
                height: 100%;
                width: 100%;
            }
        `,
    ];

    constructor() {
        super();
        this.provideContext("project", this.#project);
        this.addEventListener("contextmenu", function (event) {
            event.preventDefault();
        });
    }
    #project: Project = new Project();
    #schematic_app: KCSchematicAppElement;
    #board_app: KCBoardAppElement;
    #tab_header: TabHeaderElement;

    @attribute({ type: Boolean })
    public loading: boolean;

    @attribute({ type: String })
    controlslist: string | null;

    @attribute({ type: Boolean })
    public loaded: boolean;

    override initialContentCallback() {
        this.#setup_events();
        later(() => {
            this.#load_src();
        });
    }

    async #setup_events() {}

    async #load_src() {
        const sources = [];
        for (const src_elm of this.querySelectorAll<EcadSourceElement>(
            "ecad-source",
        )) {
            if (src_elm.src) {
                sources.push(src_elm.src);
            }
        }
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
            if (this.#project.first_page) this.#project.activate();
        } finally {
            this.loading = false;
        }
    }

    override render() {
        if (!this.loaded) return html``;

        this.#tab_header = html`<tab-header></tab-header>` as TabHeaderElement;
        this.#tab_header.addEventListener(TabActivateEvent.type, (event) => {
            const tab = (event as TabActivateEvent).detail;
            if (tab.previous) {
                switch (tab.previous) {
                    case TabKind.pcb:
                        this.#board_app.tabMenuHidden = true;
                        break;
                    case TabKind.sch:
                        break;
                    case TabKind.bom:
                        break;
                }
            }
        });

        this.#tab_header.addEventListener(TabMenuClickEvent.type, (event) => {
            const tab = (event as TabMenuClickEvent).detail;
            switch (tab) {
                case TabKind.pcb:
                    this.#board_app.tabMenuHidden =
                        !this.#board_app.tabMenuHidden;
                    break;
                case TabKind.sch:
                    break;
                case TabKind.bom:
                    break;
            }
        });

        if (this.#project.has_boards && !this.#board_app) {
            this.#board_app = html`<kc-board-app>
            </kc-board-app>` as KCBoardAppElement;
            this.#board_app.addEventListener(
                TabMenuVisibleChangeEvent.type,
                (event) => {
                    const visible = (event as TabMenuVisibleChangeEvent).detail;
                    this.#tab_header.tabMenuChecked = visible;
                },
            );
        }

        if (this.#project.has_schematics && !this.#schematic_app) {
            this.#schematic_app = html`<kc-schematic-app>
            </kc-schematic-app>` as KCSchematicAppElement;
        }
        return html`<div class="vertical">
            ${this.#tab_header}
            <div class="vertical">
                ${this.#schematic_app} ${this.#board_app}
            </div>
        </div> `;
    }
}

window.customElements.define("ecad-viewer", ECadViewer);

class EcadSourceElement extends CustomElement {
    constructor() {
        super();
        this.ariaHidden = "true";
        this.hidden = true;
        this.style.display = "none";
    }

    @attribute({ type: String })
    src: string | null;
}

window.customElements.define("ecad-source", EcadSourceElement);
