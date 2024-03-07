/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import { KicadSch } from "../../../kicad";
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
        `,
    ];

    #viewer: KCSchematicViewerElement;

    #sch: KicadSch;

    constructor(sch: KicadSch) {
        super();
        this.#sch = sch;
    }

    override connectedCallback() {
        (async () => {
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        this.addEventListener("kc-ui-menu:select", (e) => {});
    }

    override render() {
        this.#viewer = new KCSchematicViewerElement();
        this.#viewer.load(this.#sch);
        return html` ${this.#viewer} `;
    }
}

window.customElements.define("sch-preview", SchPreviewElement);
