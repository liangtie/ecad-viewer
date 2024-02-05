import { later } from "../../base/async";
import { CSS, attribute, css, html } from "../../base/web-components";
import { KCUIElement } from "../../kc-ui";
import kc_ui_styles from "../../kc-ui/kc-ui.css";
import { Project } from "../project";
import { FetchFileSystem, VirtualFileSystem } from "../services/vfs";
import { KCBoardAppElement } from "./kc-board/app";

class BoardViewer extends KCUIElement {
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
        this.provideContext("project", this.#project);
    }
    #project: Project = new Project();

    @attribute({ type: String })
    src: string;

    @attribute({ type: String })
    controls: "none" | "basic" | "full" | null;

    @attribute({ type: Boolean })
    public loading: boolean;

    @attribute({ type: String })
    controlslist: string | null;

    @attribute({ type: Boolean })
    public loaded: boolean;

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

            this.#project.activate();
        } finally {
            this.loading = false;
        }
    }

    override render() {
        if (!this.loaded) return html``;

        if (!this.#board_app)
            this.#board_app = html`<kc-board-app controls="${this.controls}">
            </kc-board-app>` as KCBoardAppElement;

        return html` ${this.#board_app} `;
    }
}

window.customElements.define("board-viewer", BoardViewer);
