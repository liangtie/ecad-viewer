/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";
import { Footprint } from "../../../kicad/board";
import type { BoardInspectItem } from "../../../kicad/board_bbox_visitor";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";
import { BoardViewer } from "../../../viewers/board/viewer";

export class KCBoardPropertiesPanelElement extends KCUIElement {
    viewer: BoardViewer;
    selected_item?: BoardInspectItem;
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                flex-shrink: 0;
                display: flex;
                flex-direction: row;
                height: 100%;
                overflow: hidden;
                min-width: calc(max(20%, 200px));
                max-width: calc(max(20%, 200px));
            }

            div {
                display: flex;
                overflow: hidden;
                flex-direction: column;
            }

            div.bar {
                flex-grow: 0;
                flex-shrink: 0;
                height: 100%;
                z-index: 1;
                display: flex;
                flex-direction: column;
                background: var(--activity-bar-bg);
                color: var(--activity-bar-fg);
                padding: 0.2em;
                user-select: none;
            }

            div.start {
                flex: 1;
            }

            div.activities {
                flex-grow: 1;
            }

            kc-ui-button {
                --button-bg: transparent;
                --button-fg: var(--activity-bar-fg);
                --button-hover-bg: var(--activity-bar-active-bg);
                --button-hover-fg: var(--activity-bar-active-fg);
                --button-selected-bg: var(--activity-bar-active-bg);
                --button-selected-fg: var(--activity-bar-active-fg);
                --button-focus-outline: none;
                margin-bottom: 0.25em;
            }

            kc-ui-button:last-child {
                margin-bottom: 0;
            }

            ::slotted(kc-ui-activity) {
                display: none;
                height: 100%;
            }

            ::slotted(kc-ui-activity[active]) {
                display: block;
            }
        `,
    ];

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
            this.setup_events();
        })();
    }

    private setup_events() {
        this.addDisposable(
            this.viewer.addEventListener(KiCanvasSelectEvent.type, (e) => {
                this.selected_item = e.detail.item as BoardInspectItem;
                this.update();
            }),
        );
    }

    override render() {
        const header = (name: string) =>
            html`<kc-ui-property-list-item class="label" name="${name}">
            </kc-ui-property-list-item>`;

        const entry = (name: string, desc?: any, suffix = "") =>
            html`<kc-ui-property-list-item name="${name}">
                ${desc ?? ""} ${suffix}
            </kc-ui-property-list-item>`;

        const checkbox = (value?: boolean) =>
            value
                ? html`<kc-ui-icon>check</kc-ui-icon>`
                : html`<kc-ui-icon>close</kc-ui-icon>`;

        let entries;

        if (!this.selected_item) {
            entries = header("No item selected");
        } else {
            const itm = this.selected_item;

            if (itm instanceof Footprint) {
                const properties = Object.entries(itm.properties).map(
                    ([k, v]) => {
                        return entry(k, v);
                    },
                );

                entries = html`
                    ${header("Basic properties")}
                    ${entry("X", itm.at.position.x.toFixed(4), "mm")}
                    ${entry("Y", itm.at.position.y.toFixed(4), "mm")}
                    ${entry("Orientation", itm.at.rotation, "°")}
                    ${entry("Layer", itm.layer)}
                    ${header("Footprint properties")}
                    ${entry("Reference", itm.reference)}
                    ${entry("Value", itm.value)}
                    ${entry(
                        "Type",
                        itm.attr.through_hole
                            ? "through hole"
                            : itm.attr.smd
                              ? "smd"
                              : "unspecified",
                    )}
                    ${entry("Pads", itm.pads.length)}
                    ${entry("Library link", itm.library_link)}
                    ${entry("Description", itm.descr)}
                    ${entry("Keywords", itm.tags)} ${properties}
                    ${header("Fabrication attributes")}
                    ${entry("Not in schematic", checkbox(itm.attr.board_only))}
                    ${entry(
                        "Exclude from position files",
                        checkbox(itm.attr.exclude_from_pos_files),
                    )}
                    ${entry(
                        "Exclude from BOM",
                        checkbox(itm.attr.exclude_from_bom),
                    )}
                    ${header("Overrides")}
                    ${entry(
                        "Exempt from courtyard requirement",
                        checkbox(itm.attr.allow_missing_courtyard),
                    )}
                    ${entry("Clearance", itm.clearance ?? 0, "mm")}
                    ${entry(
                        "Solderpaste margin",
                        itm.solder_paste_margin ?? 0,
                        "mm",
                    )}
                    ${entry(
                        "Solderpaste margin ratio",
                        itm.solder_paste_ratio ?? 0,
                    )}
                    ${entry("Zone connection", itm.zone_connect ?? "inherited")}
                `;
            }
        }

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Properties"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <kc-ui-property-list> ${entries} </kc-ui-property-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define(
    "kc-board-properties-panel",
    KCBoardPropertiesPanelElement,
);
