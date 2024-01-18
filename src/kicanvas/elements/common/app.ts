/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { DeferredPromise } from "../../../base/async";
import { delegate, listen } from "../../../base/events";
import { length } from "../../../base/iterator";
import {
    attribute,
    html,
    type ElementOrFragment,
} from "../../../base/web-components";
import type { KicadFootprint } from "../../../ecad-viewer/model/footprint/kicad_footprint";
import type { KicadSymbolLib } from "../../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import {
    KCUIActivitySideBarElement,
    KCUISelectElement,
    KCUIElement,
} from "../../../kc-ui";
import type { KicadPCB, KicadSch } from "../../../kicad";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";
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
export abstract class KCViewerAppElement<
    ViewerElementT extends ViewerElement,
> extends KCUIElement {
    #viewer_elm: ViewerElementT;
    select: KCUISelectElement = html`<kc-ui-select slot="right">
    </kc-ui-select> ` as KCUISelectElement;

    #activity_bar: KCUIActivitySideBarElement | null;

    project: Project;
    viewerReady: DeferredPromise<boolean> = new DeferredPromise<boolean>();

    constructor() {
        super();
        this.provideLazyContext("viewer", () => this.viewer);
    }

    get viewer() {
        return this.#viewer_elm.viewer;
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

            this.select.select.addEventListener("change", (e) => {
                this.apply_alter_src({
                    idx: this.select.select.selectedIndex,
                    name: this.select.select.value,
                });
            });
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

        if (this.#viewer_elm.viewer instanceof SchematicViewer)
            this.select.addSelections(
                (this.#viewer_elm.viewer as SchematicViewer)
                    .alter_footprint_parts,
            );

    }

    #has_more_than_one_page() {
        return length(this.project.pages()) > 1;
    }

    protected make_pre_activities() {
        const activities = [];

        if (this.#has_more_than_one_page()) {
            activities.push(
                html`<kc-ui-activity
                    slot="activities"
                    name="Project"
                    icon="folder">
                    <kc-project-panel></kc-project-panel>
                </kc-ui-activity>`,
            );
        }

        return activities;
    }

    protected make_post_activities() {
        return [
            // Preferences
            html`<kc-ui-activity
                slot="activities"
                name="Preferences"
                icon="settings"
                button-location="bottom">
                <kc-preferences-panel></kc-preferences-panel>
            </kc-ui-activity>`,

            // Help
            html` <kc-ui-activity
                slot="activities"
                name="Help"
                icon="help"
                button-location="bottom">
                <kc-help-panel></kc-help-panel>
            </kc-ui-activity>`,
        ];
    }

    protected abstract make_activities(): ElementOrFragment[];

    protected change_activity(name?: string) {
        this.#activity_bar?.change_activity(name);
    }

    protected abstract make_viewer_element(): ViewerElementT;

    override render() {
        const controls = this.controls ?? "none";
        this.#viewer_elm = this.make_viewer_element();
        this.#viewer_elm.disableinteraction = controls == "none";
        const bottom_toolbar = html`<kc-viewer-bottom-toolbar></kc-viewer-bottom-toolbar>`;
        const top_toolbar = html`<kc-ui-floating-toolbar location="top">
            ${this.select}
        </kc-ui-floating-toolbar>`;

        return html`<kc-ui-split-view vertical>
            <kc-ui-view class="grow">
                ${top_toolbar} ${this.#viewer_elm} ${bottom_toolbar}
            </kc-ui-view>
            ${this.#activity_bar}
        </kc-ui-split-view>`;
    }

    override renderedCallback(): void | undefined {
        window.requestAnimationFrame(() => {
            this.viewerReady.resolve(true);
        });
    }
}
