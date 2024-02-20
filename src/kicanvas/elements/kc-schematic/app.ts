/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html, type ElementOrFragment } from "../../../base/web-components";
import { KCViewerAppElement, type KicadAssert } from "../common/app";
import { KCSchematicViewerElement } from "./viewer";

// import dependent elements so they're registered before use.
import "./info-panel";
import "./properties-panel";
import "./symbols-panel";
import "./viewer";
import { KicadSch } from "../../../kicad";
import { SchematicSheet } from "../../../kicad/schematic";

/**
 * Internal "parent" element for KiCanvas's schematic viewer. Handles
 * setting up the schematic viewer as well as interface controls. It's
 * basically KiCanvas's version of EESchema.
 */
export class KCSchematicAppElement extends KCViewerAppElement<KCSchematicViewerElement> {
    protected override make_property_element(): ElementOrFragment {
        throw new Error("Method not implemented.");
    }

    protected override make_fitter_menu(): ElementOrFragment {
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
    }

    override can_load(src: KicadAssert): boolean {
        return src instanceof KicadSch;
    }

    override make_viewer_element(): KCSchematicViewerElement {
        return html`<kc-schematic-viewer></kc-schematic-viewer>` as KCSchematicViewerElement;
    }
}

window.customElements.define("kc-schematic-app", KCSchematicAppElement);
