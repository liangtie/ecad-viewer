/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { WithContext } from "../../../base/dom/context";
import { CustomElement, html } from "../../../base/dom/custom-element";
import { delegate } from "../../../base/events";
import { KCUIFilteredListElement } from "../../../kc-ui/kc-ui-filtered-list";
import { KCUITextFilterInputElement } from "../../../kc-ui/kc-ui-text-filter-input";
import { BoardViewer } from "../../../viewers/board/viewer";

import "../../../kc-ui/kc-ui-filtered-list";
import "../../../kc-ui/kc-ui-panel";
import "../../../kc-ui/kc-ui-text-filter-input";

export class KCBoardNetsPanelElement extends WithContext(CustomElement) {
    static override useShadowRoot = false;
    viewer: BoardViewer;

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
            this.setup_events();
        })();
    }

    private setup_events() {
        delegate(this, "li[data-number]", "click", (e, source) => {
            const number = parseInt(source?.dataset["number"] as string, 10);

            if (!number) {
                return;
            }

            this.viewer.highlight_net(number);
            this.mark_selected_item(number);
        });

        // Wire up search to filter the list
        this.search_input_elm.addEventListener("input", (e) => {
            this.item_filter_elem.filter_text =
                this.search_input_elm.value ?? null;
        });
    }

    private get search_input_elm() {
        return this.$<KCUITextFilterInputElement>("kc-ui-text-filter-input")!;
    }

    private get item_filter_elem() {
        return this.$<KCUIFilteredListElement>("kc-ui-filtered-list")!;
    }

    private get items() {
        return this.$$<HTMLLIElement>("li[data-number]");
    }

    private mark_selected_item(number: number) {
        for (const el of this.items) {
            const current = el.dataset["number"] == `${number}`;
            el.ariaCurrent = current ? "true" : "false";
        }
    }

    override render() {
        const board = this.viewer.board;

        const nets = [];

        for (const net of board.nets) {
            nets.push(
                html` <li
                    data-number="${net.number}"
                    aria-role="button"
                    data-match-text="${net.number} ${net.name}">
                    <span class="very-narrow"> ${net.number} </span>
                    <span>${net.name}</span>
                </li>`,
            );
        }

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Nets"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <kc-ui-text-filter-input></kc-ui-text-filter-input>
                    <kc-ui-filtered-list>
                        <ul class="item-list outline">
                            ${nets}
                        </ul>
                    </kc-ui-filtered-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("kc-board-nets-panel", KCBoardNetsPanelElement);