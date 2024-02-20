/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html } from "../../../base/web-components";
import { type KicadAssert, type SourceSelection } from "../common/app";
import { KCSymbolViewerElement } from "./symbol-viewer";

// import dependent elements so they're registered before use.
import "./info-panel";
import "./properties-panel";
import "./symbols-panel";
import "./viewer";
import { KicadSch } from "../../../kicad";
import { KicadSymbolLib } from "../../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import type { SchematicViewer } from "../../../viewers/schematic/viewer";
import { SimplAppElement } from "../common/simple_app";

/**
 * Internal "parent" element for KiCanvas's schematic viewer. Handles
 * setting up the schematic viewer as well as interface controls. It's
 * basically KiCanvas's version of EESchema.
 */
export class SymbolAppElement extends SimplAppElement<KCSymbolViewerElement> {

    override apply_alter_src(idx: SourceSelection) {
        (this.viewer as SchematicViewer).set_active_part_unit(idx.idx);
    }
    override can_load(src: KicadAssert): boolean {
        return src instanceof KicadSch || src instanceof KicadSymbolLib;
    }

    override make_viewer_element(): KCSymbolViewerElement {
        return html`<kc-symbol-viewer></kc-symbol-viewer>` as KCSymbolViewerElement;
    }
}

window.customElements.define("symbol-app-element", SymbolAppElement);
