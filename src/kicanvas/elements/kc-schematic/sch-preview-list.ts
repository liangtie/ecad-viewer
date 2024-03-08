/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import type { Project } from "../../project";
import { SchPreviewElement } from "./sch-preview";

export class SchPreviewListElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                position: absolute;
                padding-top: 5px;
                left: 0;
                height: 100%;
                width: calc(max(15%, 240px));
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
                display: content;
                flex-direction: column;
                flex: 1;
                height: 100%;
                width: 100%;
                justify-content: flex-start;
            }
        `,
    ];

    #project: Project;
    #viewers: SchPreviewElement[] = [];

    override connectedCallback() {
        (async () => {
            this.#project = await this.requestContext("project");
            await this.#project.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        super.initialContentCallback();
    }
    override render() {
        const vertical_layout = html`<div
            class="vertical-layout"></div>` as HTMLElement;

        for (const sch of this.#project.schematics()) {
            const viewer = new SchPreviewElement(sch);
            this.#viewers.push(viewer);
            vertical_layout.appendChild(viewer);
        }
        return html` <kc-ui-panel>
            <kc-ui-panel-body> ${vertical_layout} </kc-ui-panel-body>
        </kc-ui-panel>`;
    }
}

window.customElements.define("sch-preview-list-panel", SchPreviewListElement);
