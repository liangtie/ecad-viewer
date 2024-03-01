/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import {
    KCUIElement,
} from "../../../kc-ui";
import { KicadPCB } from "../../../kicad";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";
import { BoardViewer } from "../../../viewers/board/viewer";

export class SelectionPopMenu extends KCUIElement {
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

    viewer: BoardViewer;



    on_usr_select(idx: number) {
        this.dispatchEvent(
            new KiCanvasSelectEvent({
                item: null,
                previous: null,
            }),
        );
    }


    override render() {
        const board = this.viewer.board;

        const nets = [];
        if (board instanceof KicadPCB)
            for (const net of board.nets) {
                nets.push(
                    html`<kc-ui-menu-item
                        name="${net.number}"
                        data-match-text="${net.number} ${net.name}">
                        <span class="very-narrow"> ${net.number} </span>
                        <span>${net.name}</span>
                    </kc-ui-menu-item>`,
                );
            }

        return html`
            <kc-ui-panel>
                <!-- <kc-ui-panel-title title="Nets"></kc-ui-panel-title> -->
                <kc-ui-panel-body>
                    <kc-ui-text-filter-input></kc-ui-text-filter-input>
                    <kc-ui-filtered-list>
                        <kc-ui-menu class="outline">${nets}</kc-ui-menu>
                    </kc-ui-filtered-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("kc-board-selection-menu", SelectionPopMenu);
