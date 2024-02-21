/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../base/web-components";
import { KCUIElement } from "../kc-ui/element";
import type { BoardViewer } from "../viewers/board/viewer";
import type { SchematicViewer } from "../viewers/schematic/viewer";

export interface TabData {
    title: string;
    content: HTMLElement;
}

export class Header extends KCUIElement {
    #container: HTMLDivElement;
    #pcb: BoardViewer;
    #sch: SchematicViewer;

    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                position: absolute;
                left: 0;
                height: 3em;
                width: 100%;
                top: 0;
                bottom: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                background-color: var(--panel-bg);
                margin: 5px;
            }
            .horizontal-bar {
                display: flex;
                height: 20px;
                background-color: #f1f1f1;
                overflow: hidden;
            }

            .bar-section {
                flex: 1;
                height: 100%;
            }

            .beginning {
                background-color: #3498db;
            }

            .middle {
                background-color: #2ecc71;
            }

            .end {
                background-color: #e74c3c;
            }

            .menu {
                display: none;
            }

            .menu.active {
                display: block;
            }
        `,
    ];

    #menu = {
        PCB: html`
            <kc-ui-button icon="svg:layer">Layers/Objects</kc-ui-button>
        `,
        SCH: html` <kc-ui-button icon="svg:page">Pages</kc-ui-button> `,
        STEP: html` <kc-ui-button icon="svg:layer">Objects</kc-ui-button> `,
    };

    constructor() {
        super();
        // Create the container for the header
        this.#container = document.createElement("div");
        this.#container.classList.add("horizontal-bar");

        // Create the three sections
        const beginningSection = this.createSection("beginning");
        const middleSection = this.createSection("middle");
        const endSection = this.createSection("end");

        // Append sections to the container
        this.#container.appendChild(beginningSection);
        this.#container.appendChild(middleSection);
        this.#container.appendChild(endSection);

        // Append the container to the document body
        document.body.appendChild(this.#container);
    }

    private createSection(sectionClass: string): HTMLDivElement {
        const section = document.createElement("div");
        section.classList.add("bar-section", sectionClass);

        // For the first section, create three widgets
        if (sectionClass === "beginning") {
            Object.entries(this.#menu).forEach(([k, v]) =>
                section.appendChild(v),
            );
        }

        return section;
    }

    override initialContentCallback() {}

    override render() {
        return html`${this.#container}`;
    }
}

window.customElements.define("header", Header);
