/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import {
    KCUIElement,
    KCUIPanelTitleElement,
    HorizontalResizerElement,
} from "../../../kc-ui";
import { Footprint, LineSegment, Pad } from "../../../kicad/board";
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
                position: absolute;
                right: 0;
                height: 100%;
                width: calc(max(20%, 200px));
                top: 0;
                bottom: 0;
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
            }
        `,
    ];
    constructor() {
        super();
        this.hidden = true;
    }
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
                if (!this.selected_item) {
                    this.hidden = true;
                } else {
                    this.update();
                    this.hidden = false;
                }
            }),
        );
    }
    entry = (name: string, desc?: any, suffix = "") =>
        html`<kc-ui-property-list-item name="${name}">
            ${desc ?? ""} ${suffix}
        </kc-ui-property-list-item>`;

    header = (name: string) =>
        html`<kc-ui-property-list-item class="label" name="${name}">
        </kc-ui-property-list-item>`;

    checkbox = (value?: boolean) =>
        value
            ? html`<kc-ui-icon>check</kc-ui-icon>`
            : html`<kc-ui-icon>close</kc-ui-icon>`;
    override render() {
        let entries;

        const title = html`
            <kc-ui-panel-title title="Properties"></kc-ui-panel-title>
        ` as KCUIPanelTitleElement;

        title.close.addEventListener("click", (e) => {
            this.hidden = true;
        });
        const itm = this.selected_item;

        if (!itm) {
            entries = this.header("No item selected");
        } else {
            switch (itm.typeId) {
                case "Footprint":
                    entries = this.getFootprintProperties(itm as Footprint);
                    break;

                case "Pad":
                    entries = this.getPadProperties(itm as Pad);
                    break;

                case "LineSegment":
                    entries = this.getLineSegmentProperties(itm as LineSegment);
                    break;
            }
        }
        const sizer_element: HorizontalResizerElement =
            new HorizontalResizerElement(this);
        return html`
            ${sizer_element}
            <kc-ui-panel>
                ${title}
                <kc-ui-panel-body>
                    <kc-ui-property-list> ${entries} </kc-ui-property-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }

    getFootprintProperties(itm: Footprint) {
        const properties = Object.entries(itm.properties).map(([k, v]) => {
            return this.entry(k, v);
        });
        const bbox = itm.bbox;
        return html`
            ${this.header("Basic properties")}
            ${this.entry("X", itm.at.position.x.toFixed(4), "mm")}
            ${this.entry("Y", itm.at.position.y.toFixed(4), "mm")}
            ${this.entry("Height", bbox.h.toFixed(4), "mm")}
            ${this.entry("Width", bbox.w.toFixed(4), "mm")}
            ${this.entry("Orientation", itm.at.rotation, "°")}
            ${this.entry("Layer", itm.layer)}
            ${this.header("Footprint properties")}
            ${this.entry("Reference", itm.reference)}
            ${this.entry("Value", itm.value)}
            ${this.entry(
                "Type",
                itm.attr.through_hole
                    ? "through hole"
                    : itm.attr.smd
                      ? "smd"
                      : "unspecified",
            )}
            ${this.entry("Pads", itm.pads.length)}
            ${this.entry("Library link", itm.library_link)}
            ${this.entry("Description", itm.descr)}
            ${this.entry("Keywords", itm.tags)} ${properties}
            ${this.header("Fabrication attributes")}
            ${this.entry(
                "Not in schematic",
                this.checkbox(itm.attr.board_only),
            )}
            ${this.entry(
                "Exclude from position files",
                this.checkbox(itm.attr.exclude_from_pos_files),
            )}
            ${this.entry(
                "Exclude from BOM",
                this.checkbox(itm.attr.exclude_from_bom),
            )}
            ${this.header("Overrides")}
            ${this.entry(
                "Exempt from courtyard requirement",
                this.checkbox(itm.attr.allow_missing_courtyard),
            )}
            ${this.entry("Clearance", itm.clearance ?? 0, "mm")}
            ${this.entry(
                "Solderpaste margin",
                itm.solder_paste_margin ?? 0,
                "mm",
            )}
            ${this.entry(
                "Solderpaste margin ratio",
                itm.solder_paste_ratio ?? 0,
            )}
            ${this.entry("Zone connection", itm.zone_connect ?? "inherited")}
        `;
    }

    getPadProperties(itm: Pad) {
        const bbox = itm.bbox;
        return html`
            ${this.header("Basic properties")}
            ${this.entry("X", bbox.x.toFixed(4), "mm")}
            ${this.entry("Y", bbox.y.toFixed(4), "mm")}
            ${this.entry("Height", bbox.h.toFixed(4), "mm")}
            ${this.entry("Width", bbox.w.toFixed(4), "mm")}
            ${this.entry("Orientation", itm.at.rotation, "°")}
            ${this.entry("Layer", itm.parent.layer)}
            ${this.header("Pad properties")} ${this.entry("Type", itm.type)}
            ${this.entry("Shape", itm.shape)}
            ${this.entry("Drill", itm.drill.diameter)}
            ${this.entry("Net", itm.net.name)}
            ${this.entry("PinNum", itm.number)}
            ${this.entry("PinType", itm.pintype)}
            ${this.entry("PinFunction", itm.pinfunction)}
        `;
    }

    getLineSegmentProperties(itm: LineSegment) {
        return html`
            ${this.entry("X", itm.start.x.toFixed(4), "mm")}
            ${this.entry("Y", itm.start.y.toFixed(4), "mm")}
            ${this.entry("Width", itm.width.toFixed(4), "mm")}
            ${this.entry("Layer", itm.layer)}
            ${this.entry("Net", this.viewer.board.getNetName(itm.net))}
        `;
    }
}

window.customElements.define(
    "kc-board-properties-panel",
    KCBoardPropertiesPanelElement,
);
