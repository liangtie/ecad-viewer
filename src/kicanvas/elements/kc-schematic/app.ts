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
import "./viewer";

import { KicadSch } from "../../../kicad";
import { SchematicSheet } from "../../../kicad/schematic";
import { AssertType } from "../../project";
import { SchPreviewListElement } from "./sch-preview-list";
import { SheetChangeEvent } from "../../../viewers/base/events";

/**
 * Internal "parent" element for KiCanvas's schematic viewer. Handles
 * setting up the schematic viewer as well as interface controls. It's
 * basically KiCanvas's version of EESchema.
 */
export class KCSchematicAppElement extends KCViewerAppElement<KCSchematicViewerElement> {
    override assert_type(): AssertType {
        return AssertType.SCH;
    }

    protected override make_property_element(): ElementOrFragment {
        return html`<kc-schematic-properties-panel></kc-schematic-properties-panel>`;
    }

    protected override make_fitter_menu(): HTMLElement {
        const preview = new SchPreviewListElement();
        return preview;
    }
    override initialContentCallback() {
        super.initialContentCallback();
        this.viewer.addEventListener(SheetChangeEvent.type, (e) => {
            const sch = this.project.file_by_name(e.detail);
            if (sch instanceof KicadSch) this.viewer.load(sch);
        });
    }
    override on_viewer_select(item?: unknown, previous?: unknown) {
        // Only handle double-selecting/double-clicking on items.
        if (!item || item != previous) {
            return;
        }

        // If it's a sheet instance, switch over to the new sheet.
        if (item instanceof SchematicSheet) {
            this.project.activate_sch(
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
