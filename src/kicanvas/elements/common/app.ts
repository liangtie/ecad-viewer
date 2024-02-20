/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { DeferredPromise } from "../../../base/async";
import { delegate, listen } from "../../../base/events";
import { html, type ElementOrFragment } from "../../../base/web-components";
import type { KicadFootprint } from "../../../ecad-viewer/model/footprint/kicad_footprint";
import type { KicadSymbolLib } from "../../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import { KCUISelectElement, KCUIElement } from "../../../kc-ui";
import type { KicadPCB, KicadSch } from "../../../kicad";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";
import type { Viewer } from "../../../viewers/base/viewer";
import type { Project } from "../../project";

// import dependent elements so they're registered before use.
import "./help-panel";
import "./preferences-panel";
import "./project-panel";
import "./viewer-bottom-toolbar";

export type KicadAssert = KicadSymbolLib | KicadFootprint | KicadPCB | KicadSch;

interface ViewerElement extends HTMLElement {
    viewer: Viewer;
    load(src: KicadAssert): Promise<void>;
    disableinteraction: boolean;
}

export interface SourceSelection {
    idx: number;
    name: string;
}

/**
 * Common base class for the schematic, board, etc. apps.
 */
export abstract class KCViewerAppElement<
    ViewerElementT extends ViewerElement,
> extends KCUIElement {
    #viewer_elm: ViewerElementT;
    #property_viewer: ElementOrFragment;

    project: Project;
    viewerReady: DeferredPromise<boolean> = new DeferredPromise<boolean>();

    constructor() {
        super();
        this.provideLazyContext("viewer", () => this.viewer);
    }

    get viewer() {
        return this.#viewer_elm.viewer;
    }

    abstract apply_alter_src(idx: SourceSelection): void;

    override connectedCallback() {
        this.hidden = true;
        (async () => {
            this.project = await this.requestContext("project");
            await this.project.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        // If the project already has an active page, load it.
        if (this.project.first_page) {
            this.load(this.project.first_page!);
        }

        // Listen for changes to the project's active page and load or hide
        // as needed.
        this.addDisposable(
            listen(this.project, "change", async (e) => {
                const page = this.project.page_by_path(
                    this.project.active_page_name,
                );
                if (page) {
                    await this.load(page);
                } else {
                    this.hidden = true;
                }
            }),
        );

        // Handle item selection in the viewers.
        this.addDisposable(
            this.viewer.addEventListener(KiCanvasSelectEvent.type, (e) => {
                this.on_viewer_select(e.detail.item, e.detail.previous);
            }),
        );

        // Handle download button.
        delegate(this.renderRoot, "kc-ui-button", "click", (e) => {
            const target = e.target as KCUISelectElement;
            console.log("button", target);
            switch (target.name) {
                case "download":
                    if (this.project.active_page_name) {
                        this.project.download(this.project.active_page_name);
                    }
                    break;
                default:
                    console.warn("Unknown button", e);
            }
        });
    }

    protected abstract on_viewer_select(
        item?: unknown,
        previous?: unknown,
    ): void;

    protected abstract can_load(src: KicadAssert): boolean;

    override async load(src: KicadAssert) {
        await this.viewerReady;
        if (this.can_load(src)) {
            await this.#viewer_elm.load(src);
            this.hidden = false;
        } else {
            this.hidden = true;
        }
    }

    protected abstract make_property_element(): ElementOrFragment;

    protected abstract make_viewer_element(): ViewerElementT;

    override render() {
        this.#viewer_elm = this.make_viewer_element();
        this.#property_viewer = this.make_property_element();
        return html` ${this.#viewer_elm} ${this.#property_viewer} `;
    }

    override renderedCallback(): void | undefined {
        window.requestAnimationFrame(() => {
            this.viewerReady.resolve(true);
        });
    }
}
