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
import {
    FetchFileSystem,
    type EcadBlob,
    type EcadSources,
} from "../kicanvas/services/vfs";
import { KCBoardAppElement } from "../kicanvas/elements/kc-board/app";
import type { KCSchematicAppElement } from "../kicanvas/elements/kc-schematic/app";
import type { TabHeaderElement } from "./tab_header";
import {
    TabActivateEvent,
    TabMenuClickEvent,
    TabMenuVisibleChangeEvent,
} from "../viewers/base/events";
import { TabKind } from "./constraint";
import type { InputContainer } from "./input_containter";

export class ECadViewer extends KCUIElement implements InputContainer {
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
        this.appendChild(this.#file_input);
        this.provideContext("project", this.#project);
        this.addEventListener("contextmenu", function (event) {
            event.preventDefault();
        });
    }

    get input() {
        return this.#file_input;
    }
    public get target() {
        return this;
    }

    #project: Project = new Project();
    #schematic_app: KCSchematicAppElement;
    #board_app: KCBoardAppElement;
    #tab_header: TabHeaderElement;
    #file_input: HTMLInputElement = html` <input
        type="file"
        id="fileInput"
        style="display: none" />` as HTMLInputElement;

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
        const files = [];
        const blobs: EcadBlob[] = [];
        for (const src_elm of this.querySelectorAll<EcadSourceElement>(
            "ecad-source",
        )) {
            if (src_elm.src) {
                files.push(src_elm.src);
            }
        }

        for (const blob_elm of this.querySelectorAll<EcadBlobElement>(
            "ecad-blob",
        )) {
            blobs.push({
                filename: blob_elm.filename,
                content: blob_elm.content,
            });
        }

        const vfs = new FetchFileSystem(files);
        await this.#setup_project({ vfs, blobs });
    }

    async #setup_project(sources: EcadSources) {
        this.loaded = false;
        this.loading = true;

        try {
            await this.#project.load(sources);

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
        this.#tab_header.input_container = this;
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
        return html`
            <div class="vertical">
                ${this.#tab_header}
                <div class="vertical">
                    ${this.#schematic_app} ${this.#board_app}
                </div>
            </div>
        `;
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

class EcadBlobElement extends CustomElement {
    constructor() {
        super();
        this.ariaHidden = "true";
        this.hidden = true;
        this.style.display = "none";
    }

    @attribute({ type: String })
    filename: string;

    @attribute({ type: String })
    content: string;
}

window.customElements.define("ecad-blob", EcadBlobElement);
