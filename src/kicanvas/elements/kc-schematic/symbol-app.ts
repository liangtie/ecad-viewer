/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html, type ElementOrFragment } from "../../../base/web-components";
import {
    KCViewerAppElement,
    type KicadAssert,
    type SourceSelection,
} from "../common/app";
import { KCSymbolViewerElement } from "./symbol-viewer";

// import dependent elements so they're registered before use.
import "./info-panel";
import "./properties-panel";
import "./symbols-panel";
import "./viewer";
import { KicadSch } from "../../../kicad";
import { SchematicSheet } from "../../../kicad/schematic";
import { KicadSymbolLib } from "../../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import type { SchematicViewer } from "../../../viewers/schematic/viewer";

/**
 * Internal "parent" element for KiCanvas's schematic viewer. Handles
 * setting up the schematic viewer as well as interface controls. It's
 * basically KiCanvas's version of EESchema.
 */
export class SymbolAppElement extends KCViewerAppElement<KCSymbolViewerElement> {
    protected override make_activities(): ElementOrFragment[] {
        throw new Error("Method not implemented.");
    }
    override on_viewer_select(item?: unknown, previous?: unknown) {
        // Only handle double-selecting/double-clicking on items.
        if (!item || item != previous) {
            return;
        }

        // If it's a sheet instance, switch over to the new sheet.
        if (item instanceof SchematicSheet) {
            this.project.activate(
                `${item.sheetfile}:${item.path}/${item.uuid}`,
            );
            return;
        }

        // Otherwise, selecting the same item twice should show the
        // properties panel.
        this.change_activity("properties");
    }

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
