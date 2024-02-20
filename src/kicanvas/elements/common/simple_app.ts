/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { DeferredPromise } from "../../../base/async";
import { listen } from "../../../base/events";
import { attribute, html } from "../../../base/web-components";
import type { KicadFootprint } from "../../../ecad-viewer/model/footprint/kicad_footprint";
import type { KicadSymbolLib } from "../../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import {
    KCUIActivitySideBarElement,
    KCUISelectElement,
    KCUIElement,
} from "../../../kc-ui";
import type { KicadPCB, KicadSch } from "../../../kicad";
import type { Viewer } from "../../../viewers/base/viewer";
import { SchematicViewer } from "../../../viewers/schematic/viewer";
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
export abstract class SimplAppElement<
    ViewerElementT extends ViewerElement,
> extends KCUIElement {
    viewer_elm: ViewerElementT;
    select: KCUISelectElement = html`<kc-ui-select>
    </kc-ui-select> ` as KCUISelectElement;

    activity_bar: KCUIActivitySideBarElement | null;

    top_toolbar: HTMLElement;

    project: Project;
    viewerReady: DeferredPromise<boolean> = new DeferredPromise<boolean>();

    constructor() {
        super();
        this.provideLazyContext("viewer", () => this.viewer);
    }

    get viewer() {
        return this.viewer_elm.viewer;
    }

    @attribute({ type: String })
    controls: "none" | "basic" | "full";

    @attribute({ type: String })
    controlslist: string;

    @attribute({ type: Boolean })
    sidebarcollapsed: boolean;

    abstract apply_alter_src(idx: SourceSelection): void;

    public init_alter_source(src: string[]) {
        this.select.addSelections(src);
    }

    override connectedCallback() {
        this.hidden = true;
        (async () => {
            this.project = await this.requestContext("project");
            await this.project.loaded;
            super.connectedCallback();
            this.select.addSelections(
                await this.requestContext("alter_source"),
            );
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
        this.select.select.addEventListener("change", (e) => {
            this.apply_alter_src({
                idx: this.select.select.selectedIndex,
                name: this.select.select.value,
            });
        });
    }

    protected abstract can_load(src: KicadAssert): boolean;

    override async load(src: KicadAssert) {
        await this.viewerReady;
        if (this.can_load(src)) {
            await this.viewer_elm.load(src);
            this.hidden = false;
        } else {
            this.hidden = true;
        }

        if (this.viewer_elm.viewer instanceof SchematicViewer)
            this.select.addSelections(
                (this.viewer_elm.viewer as SchematicViewer)
                    .alter_footprint_parts,
            );
    }

    protected abstract make_viewer_element(): ViewerElementT;

    override render() {
        const controls = this.controls ?? "none";
        this.viewer_elm = this.make_viewer_element();
        this.viewer_elm.disableinteraction = controls == "none";
        const bottom_toolbar = html`<kc-viewer-bottom-toolbar></kc-viewer-bottom-toolbar>`;
        this.top_toolbar = html`<kc-ui-floating-toolbar>
            ${this.select}
        </kc-ui-floating-toolbar>` as HTMLElement;
        this.top_toolbar.style.display = "none";

        this.addEventListener("mouseenter", (e) => {
            if (this.select.select.options.length > 1)
                this.top_toolbar.style.display = "block";
        });
        this.addEventListener("mouseleave", (e) => {
            this.top_toolbar.style.display = "none";
        });

        return html`<kc-ui-split-view vertical>
            <kc-ui-view class="grow">
                ${this.top_toolbar} ${this.viewer_elm} ${bottom_toolbar}
            </kc-ui-view>
            ${this.activity_bar}
        </kc-ui-split-view>`;
    }

    override renderedCallback(): void | undefined {
        window.requestAnimationFrame(() => {
            this.viewerReady.resolve(true);
        });
    }
}
