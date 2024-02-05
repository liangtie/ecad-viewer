/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { FootPrintViewer } from "../../../viewers/board/footprint-viewer";
import { KCViewerElement } from "../common/viewer";

export class FootprintViewer extends KCViewerElement<FootPrintViewer> {
    protected override update_theme(): void {
        this.viewer.theme = this.themeObject.board;
    }

    protected override make_viewer(): FootPrintViewer {
        return new FootPrintViewer(
            this.canvas,
            !this.disableinteraction,
            this.themeObject.board,
        );
    }
}

window.customElements.define("footprint-viewer", FootprintViewer);
