/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html, type ElementOrFragment } from "../../../base/web-components";
import { KicadPCB } from "../../../kicad";
import { KCViewerAppElement, type KicadAssert } from "../common/app";
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
import "./selection-pop-menu";
import { KCBoardLayersPanelElement } from "./layers-panel";
import { KCBoardObjectsPanelElement } from "./objects-panel";
import { TabView } from "../../../kc-ui/tab-view";
import { KCBoardNetsPanelElement } from "./nets-panel";
import {
    TabMenuVisibleChangeEvent,
} from "../../../viewers/base/events";

/**
 * Internal "parent" element for KiCanvas's board viewer. Handles
 * setting up the actual board viewer as well as interface controls. It's
 * basically KiCanvas's version of PCBNew.
 */
export class KCBoardAppElement extends KCViewerAppElement<KCBoardViewerElement> {
    #selection_menu: HTMLElement;
    protected override make_property_element(): ElementOrFragment {
        return html`<kc-board-properties-panel></kc-board-properties-panel>`;
    }

    public set tabMenuHidden(v: boolean) {
        this.#tab_view.setHidden(v);
    }

    public get tabMenuHidden() {
        return this.tab_view.hidden;
    }
    override initialContentCallback() {
        super.initialContentCallback();
    }

    #tab_view: TabView;

    public get tab_view(): TabView {
        return this.#tab_view;
    }

    protected override make_fitter_menu(): ElementOrFragment {
        const layer = new KCBoardLayersPanelElement();
        const obj = new KCBoardObjectsPanelElement();
        const nets = new KCBoardNetsPanelElement();
        this.#tab_view = new TabView([
            {
                title: "Layers",
                content: layer,
            },
            {
                title: "Objects",
                content: obj,
            },
            {
                title: "Nets",
                content: nets,
            },
        ]);
        this.#tab_view.hidden = true;
        this.#tab_view.addEventListener(TabMenuVisibleChangeEvent.type, (e) => {
            this.dispatchEvent(
                new TabMenuVisibleChangeEvent(
                    (e as TabMenuVisibleChangeEvent).detail,
                ),
            );
        });
        return this.#tab_view;
    }

    override on_viewer_select(item?: unknown, previous?: unknown) {
        // Selecting the same item twice should show the properties panel.
    }

    override can_load(src: KicadAssert): boolean {
        return src instanceof KicadPCB;
    }

    override make_viewer_element(): KCBoardViewerElement {
        return html`<kc-board-viewer></kc-board-viewer>` as KCBoardViewerElement;
    }
    override render() {
        this.#selection_menu =
            html`<kc-board-selection-menu></kc-board-selection-menu>` as HTMLElement;
        const content = super.render();
        return html`${content} ${this.#selection_menu}`;
    }
}

window.customElements.define("kc-board-app", KCBoardAppElement);
