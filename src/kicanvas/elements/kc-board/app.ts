/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html, type ElementOrFragment } from "../../../base/web-components";
import { KicadPCB } from "../../../kicad";
import {
    KCViewerAppElement,
    type KicadAssert,
    type SourceSelection,
} from "../common/app";
import { KCBoardViewerElement } from "./viewer";

// import dependent elements so they're registered before use.
import "../common/help-panel";
import "../common/preferences-panel";
import "../common/viewer-bottom-toolbar";
import "./footprints-panel";
import "./info-panel";
import "./layers-panel";
import "./nets-panel";
import "./objects-panel";
import "./properties-panel";
import "./viewer";
import { KicadFootprint } from "../../../ecad-viewer/model/footprint/kicad_footprint";
import type { KCBoardPropertiesPanelElement } from "./properties-panel";

/**
 * Internal "parent" element for KiCanvas's board viewer. Handles
 * setting up the actual board viewer as well as interface controls. It's
 * basically KiCanvas's version of PCBNew.
 */
export class KCBoardAppElement extends KCViewerAppElement<KCBoardViewerElement> {
    protected override make_activities(): ElementOrFragment[] {
        return [];
    }

    #property_panel: KCBoardPropertiesPanelElement =
        html`<kc-board-properties-panel></kc-board-properties-panel>` as KCBoardPropertiesPanelElement;

    override on_viewer_select(item?: unknown, previous?: unknown) {
        // Selecting the same item twice should show the properties panel.
        if (item && item == previous) {
            this.change_activity("properties");
        }
    }

    override can_load(src: KicadAssert): boolean {
        return src instanceof KicadPCB || src instanceof KicadFootprint;
    }

    override apply_alter_src(idx: SourceSelection) {
        const fn = this.project.filesByIndex.get(idx.name);

        if (fn) {
            this.project.activate(idx.name);
        }
    }

    override make_viewer_element(): KCBoardViewerElement {
        return html`<kc-board-viewer></kc-board-viewer>` as KCBoardViewerElement;
    }

    override render() {
        this.viewer_elm = this.make_viewer_element();

        return html`<kc-ui-split-view vertical>
            <kc-ui-view class="grow"> ${this.viewer_elm} </kc-ui-view>
            ${this.#property_panel}
        </kc-ui-split-view>`;
    }
}

window.customElements.define("kc-board-app", KCBoardAppElement);
