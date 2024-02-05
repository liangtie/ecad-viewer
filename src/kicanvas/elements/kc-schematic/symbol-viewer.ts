/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { SymbolViewer } from "../../../viewers/schematic/symbol-viewer";
import { KCViewerElement } from "../common/viewer";

export class KCSymbolViewerElement extends KCViewerElement<SymbolViewer> {
    protected override update_theme(): void {
        this.viewer.theme = this.themeObject.schematic;
    }

    protected override make_viewer(): SymbolViewer {
        return new SymbolViewer(
            this.canvas,
            !this.disableinteraction,
            this.themeObject.schematic,
        );
    }
}

window.customElements.define("kc-symbol-viewer", KCSymbolViewerElement);
