/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import { KicadSch } from "../../../kicad";
import { TabMenuVisibleChangeEvent } from "../../../viewers/base/events";
import type { SchematicViewer } from "../../../viewers/schematic/viewer";
import { KCSchematicViewerElement } from "./viewer";

export class SchPreviewElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                display: content;
                width: 100%;
                user-select: none;
                background-color: var(--panel-bg);
            }

            .margin-container {
                display: content;
                width: 100%;
                height: var(--preview-item-height);
                padding-right: 10px;
                padding-left: 10px;
                padding-top: 2px;
                padding-bottom: 2px;
            }

            .view-container {
                pointer-events: none;
                height: 85%;
                width: 100%;
            }
            .text-container {
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 15%;
                width: 100%;
            }
            .viewer-panel {
                width: 100%;
                height: 100%;
                background-color: var(--panel-bg);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                border-radius: 5px;
                color: var(--pop-menu-fg);
                align-items: center;
                border: 1px solid var(--pop-menu-bg);
                padding: 2px;
            }

            .viewer-panel:hover {
                border: 1px solid var(--preview-item-hover-fg);
            }
        `,
    ];

    #preview: KCSchematicViewerElement = new KCSchematicViewerElement();

    #sch: KicadSch;

    #sch_name: string;

    #sch_viewer: SchematicViewer;

    constructor(s: { name: string; sch: KicadSch }) {
        super();
        this.#sch = s.sch;
        this.#sch_name = s.name;
        this.#preview.classList.add("preview");
    }

    override connectedCallback() {
        (async () => {
            this.#sch_viewer =
                await this.requestLazyContext<SchematicViewer>("viewer");
            await this.#sch_viewer.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        this.addEventListener("click", () => {
            this.#sch_viewer.load(this.#sch);
            this.dispatchEvent(new TabMenuVisibleChangeEvent(true));
        });
        this.#preview.load(this.#sch);
    }

    override render() {
        return html`
            <div class="margin-container">
                <div class="viewer-panel">
                    <div class="view-container">${this.#preview}</div>
                    <div class="text-container">
                        <p>${this.#sch_name}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

window.customElements.define("sch-preview", SchPreviewElement);
