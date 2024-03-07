/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import type { Project } from "../../project";
import { KCSchematicViewerElement } from "./viewer";

export class SchPreviewListElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                position: absolute;
                left: 0;
                height: 100%;
                width: calc(max(20%, 200px));
                top: 0;
                bottom: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                background-color: var(--panel-bg);
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
            .vertical-layout {
                display: flex;
                flex-direction: column;
                flex: 1;
                height: 100%;
                width: 100%;
                justify-content: flex-start;
            }
        `,
    ];

    #project: Project;
    #viewers: KCSchematicViewerElement[] = [];
    #vertical_layout = html`<div class="vertical-layout"></div>` as HTMLElement;

    override connectedCallback() {
        (async () => {
            this.#project = await this.requestContext("project");
            await this.#project.loaded;
            for (const sch of this.#project.schematics()) {
                const viewer = new KCSchematicViewerElement();
                viewer.assert = sch;
                this.#viewers.push(viewer);
                this.#vertical_layout.appendChild(viewer);
            }
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        for (const viewer of this.#viewers) {
            viewer.load(viewer.assert).then(() => {
                viewer.style.height = `120px`;
            });
        }
    }
    override render() {
        return html` <kc-ui-panel>
            <kc-ui-panel-body> ${this.#vertical_layout} </kc-ui-panel-body>
        </kc-ui-panel>`;
    }
}

window.customElements.define("sch-preview-list-panel", SchPreviewListElement);
