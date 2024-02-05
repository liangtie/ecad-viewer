/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html } from "../../../base/web-components";
import {
    KCViewerAppElement,
    type KicadAssert,
    type SourceSelection,
} from "../common/app";
import { FootprintViewer } from "./footprint-viewer";

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

/**
 * Internal "parent" element for KiCanvas's board viewer. Handles
 * setting up the actual board viewer as well as interface controls. It's
 * basically KiCanvas's version of PCBNew.
 */
export class FootprintAppElement extends KCViewerAppElement<FootprintViewer> {
    override on_viewer_select(item?: unknown, previous?: unknown) {
        // Selecting the same item twice should show the properties panel.
        if (item && item == previous) {
            this.change_activity("properties");
        }
    }

    override can_load(src: KicadAssert): boolean {
        return src instanceof KicadFootprint;
    }

    override apply_alter_src(idx: SourceSelection) {
        const fn = this.project.filesByIndex.get(idx.name);

        if (fn) {
            this.project.activate(idx.name);
        }
    }

    override make_viewer_element(): FootprintViewer {
        return html`<footprint-viewer></footprint-viewer>` as FootprintViewer;
    }

    override make_activities() {
        return [];
    }
}

window.customElements.define("footprint-app-element", FootprintAppElement);
