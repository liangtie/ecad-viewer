/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import type { TabKind } from "../../ecad-viewer/constraint";

class KiCanvasEvent<T> extends CustomEvent<T> {
    constructor(name: string, detail: T, bubbles = false) {
        super(name, { detail: detail, composed: true, bubbles: bubbles });
    }
}

export class KiCanvasLoadEvent extends KiCanvasEvent<null> {
    static readonly type = "kicanvas:load";

    constructor() {
        super(KiCanvasLoadEvent.type, null);
    }
}

interface SelectDetails {
    item: unknown;
    previous: unknown;
}

export class KiCanvasSelectEvent extends KiCanvasEvent<SelectDetails> {
    static readonly type = "kicanvas:select";

    constructor(detail: SelectDetails) {
        super(KiCanvasSelectEvent.type, detail, true);
    }
}

interface FitterSelections {
    items: unknown[];
}

export class KiCanvasFitterMenuEvent extends KiCanvasEvent<FitterSelections> {
    static readonly type = "kicanvas:fitter-selection";

    constructor(detail: FitterSelections) {
        super(KiCanvasFitterMenuEvent.type, detail, true);
    }
}

interface MouseMoveDetails {
    x: number;
    y: number;
}

export class KiCanvasMouseMoveEvent extends KiCanvasEvent<MouseMoveDetails> {
    static readonly type = "kicanvas:mousemove";

    constructor(detail: MouseMoveDetails) {
        super(KiCanvasMouseMoveEvent.type, detail, true);
    }
}

export class KicadSyncHoverEvent extends KiCanvasEvent<string | null> {
    static readonly type = "kicanvas:sync_hover";

    constructor(index: string | null) {
        super(KicadSyncHoverEvent.type, index, true);
    }
}

export interface TabIndexChange {
    current: TabKind;
    previous?: TabKind;
}

export class TabActivateEvent extends CustomEvent<TabIndexChange> {
    static readonly type = "kicanvas:tab:activate";

    constructor(current: TabIndexChange) {
        super(TabActivateEvent.type, { detail: current });
    }
}

export class TabMenuVisibleChangeEvent extends CustomEvent<boolean> {
    static readonly type = "kicanvas:tab:menu:visible";

    constructor(v: boolean) {
        super(TabMenuVisibleChangeEvent.type, { detail: v });
    }
}

export class TabMenuClickEvent extends CustomEvent<TabKind> {
    static readonly type = "kicanvas:tab:menu:click";

    constructor(tab: TabKind) {
        super(TabMenuClickEvent.type, { detail: tab });
    }
}

// Event maps for type safe addEventListener.

export interface KiCanvasEventMap {
    [KiCanvasLoadEvent.type]: KiCanvasLoadEvent;
    [KiCanvasSelectEvent.type]: KiCanvasSelectEvent;
    [KiCanvasMouseMoveEvent.type]: KiCanvasMouseMoveEvent;
    [KicadSyncHoverEvent.type]: KicadSyncHoverEvent;
    [TabActivateEvent.type]: TabActivateEvent;
    [TabMenuVisibleChangeEvent.type]: TabMenuVisibleChangeEvent;
    [KiCanvasFitterMenuEvent.type]: KiCanvasFitterMenuEvent;
}

declare global {
    interface WindowEventMap {
        [KiCanvasLoadEvent.type]: KiCanvasLoadEvent;
        [KiCanvasSelectEvent.type]: KiCanvasSelectEvent;
        [TabMenuVisibleChangeEvent.type]: TabMenuVisibleChangeEvent;
    }

    interface HTMLElementEventMap {
        [KiCanvasLoadEvent.type]: KiCanvasLoadEvent;
        [KiCanvasSelectEvent.type]: KiCanvasSelectEvent;
        [TabMenuVisibleChangeEvent.type]: TabMenuVisibleChangeEvent;
    }
}
