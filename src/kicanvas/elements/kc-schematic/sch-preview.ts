/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import { KicadSch } from "../../../kicad";
import { SchematicViewer } from "../../../viewers/schematic/viewer";
import { KCSchematicViewerElement } from "./viewer";

export class SchPreviewElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                display: block;
                height: 100%;
                width: 100%;

                overflow-y: auto;
                overflow-x: hidden;
                user-select: none;
            }
            ::-webkit-scrollbar {
                position: absolute;
                width: 6px;
                height: 6px;
                margin-left: -6px;
                background: var(--scrollbar-bg);
            }

            ::-webkit-scrollbar-thumb {
                position: absolute;
                background: var(--scrollbar-fg);
            }

            ::-webkit-scrollbar-thumb:hover {
                background: var(--scrollbar-hover-fg);
            }

            ::-webkit-scrollbar-thumb:active {
                background: var(--scrollbar-active-fg);
            }
        `,
    ];

    #viewer: KCSchematicViewerElement;

    #sch: KicadSch;

    constructor(sch: KicadSch) {
        super();
        this.#sch = sch;
        this.#viewer = new KCSchematicViewerElement();
    }

    override connectedCallback() {
        (async () => {
            this.#viewer = await this.requestLazyContext("viewer");
            await this.#viewer.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        this.addEventListener("kc-ui-menu:select", (e) => {});
    }

    override render() {
        return html`
            <kc-ui-panel>
                <!-- <kc-ui-panel-title title="Nets"></kc-ui-panel-title> -->
                <kc-ui-panel-body>
                    <kc-ui-text-filter-input></kc-ui-text-filter-input>
                    <kc-ui-filtered-list>
                        <kc-ui-menu class="outline"></kc-ui-menu>
                    </kc-ui-filtered-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("sch-preview", SchPreviewElement);
