/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { later } from "../../base/async";
import type { CrossHightAble } from "../../base/cross_highlight_able";
import { Vec2 } from "../../base/math";
import { Color, Renderer } from "../../graphics";
import { WebGL2Renderer } from "../../graphics/webgl";
import type { BoardTheme } from "../../kicad";
import * as board_items from "../../kicad/board";
import {
    BoardBBoxVisitor,
    type BoardInteractiveItem,
    Depth,
} from "../../kicad/board_bbox_visitor";
import { DocumentViewer } from "../base/document-viewer";
import { KiCanvasFitterMenuEvent, KiCanvasSelectEvent } from "../base/events";
import { ViewerType } from "../base/viewer";
import { LayerNames, LayerSet, ViewLayer } from "./layers";
import { BoardPainter } from "./painter";
import { OrderedMap } from "immutable";

export class BoardViewer extends DocumentViewer<
    board_items.KicadPCB,
    BoardPainter,
    LayerSet,
    BoardTheme
> {
    public highlight_net(num: number | null) {
        if (this.painter.paint_net(this.board, num)) this.draw();
    }

    override on_click(pos: Vec2): void {
        const items = this.find_items_under_pos(pos);

        if (items.length > 0) {
            if (items.length == 1) {
                const it = items[0];
                if (it) {
                    this.highlight_net(it.net ?? null);
                    later(() => {
                        this.dispatchEvent(
                            new KiCanvasSelectEvent({
                                item: it.item,
                                previous: null,
                            }),
                        );
                        this.dispatchEvent(
                            new KiCanvasFitterMenuEvent({
                                items: [],
                            }),
                        );
                    });
                }
            } else {
                this.dispatchEvent(
                    new KiCanvasSelectEvent({
                        item: null,
                        previous: null,
                    }),
                );
                this.dispatchEvent(
                    new KiCanvasFitterMenuEvent({
                        items: items,
                    }),
                );
            }
        }
    }

    find_items_under_pos(pos: Vec2) {
        const items: BoardInteractiveItem[] = [];

        const check_depth = (depth: Depth) => {
            const layer_items = this.#interactive.get(depth) ?? [];
            if (layer_items.length)
                for (const i of layer_items) {
                    if (i.contains(pos)) {
                        items.push(i);
                    }
                }
        };

        for (const [depth] of this.#interactive) {
            switch (depth) {
                case Depth.GRAPHICS:
                    break;
                case Depth.VIA:
                case Depth.PAD:
                case Depth.LINE_SEGMENTS:
                    check_depth(depth);
                    break;
                case Depth.FOOT_PRINT:
                case Depth.ZONE:
                    break;
            }
        }

        // look up the footprints then
        if (!items.length) check_depth(Depth.FOOT_PRINT);

        // look up the zones finally
        if (!items.length) check_depth(Depth.ZONE);

        return items;
    }

    override on_dblclick(pos: Vec2): void {}
    override type: ViewerType = ViewerType.PCB;

    #interactive: OrderedMap<Depth, BoardInteractiveItem[]> = OrderedMap();

    #last_hover: BoardInteractiveItem | null = null;

    #highlighted_track = true;

    set_highlighted_track(val: boolean) {
        this.#highlighted_track = val;
    }

    get board(): board_items.KicadPCB {
        return this.document;
    }

    override async load(src: board_items.KicadPCB) {
        const visitor = new BoardBBoxVisitor();
        visitor.visit(src);

        for (let k = Depth.START; k < Depth.END; k++)
            this.#interactive = this.#interactive.set(k, []);

        for (const e of visitor.highlight_item)
            this.#interactive.get(e.depth)?.push(e);

        await super.load(src);
    }

    protected override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new WebGL2Renderer(canvas);
        renderer.background_color = Color.gray;
        return renderer;
    }

    protected override create_painter() {
        return new BoardPainter(this.renderer, this.layers, this.theme);
    }

    protected override create_layer_set() {
        return new LayerSet(this.board, this.theme);
    }

    protected override get grid_origin() {
        return new Vec2(0, 0);
    }

    private set_layers_opacity(layers: Generator<ViewLayer>, opacity: number) {
        for (const layer of layers) {
            layer.opacity = opacity;
        }
        this.draw();
    }

    set track_opacity(value: number) {
        this.set_layers_opacity(
            (this.layers as LayerSet).copper_layers(),
            value,
        );
    }

    set via_opacity(value: number) {
        this.set_layers_opacity((this.layers as LayerSet).via_layers(), value);
    }

    set zone_opacity(value: number) {
        this.set_layers_opacity((this.layers as LayerSet).zone_layers(), value);
    }

    set pad_opacity(value: number) {
        this.set_layers_opacity((this.layers as LayerSet).pad_layers(), value);
    }

    set pad_hole_opacity(value: number) {
        this.set_layers_opacity(
            (this.layers as LayerSet).pad_hole_layers(),
            value,
        );
    }

    set grid_opacity(value: number) {
        this.set_layers_opacity((this.layers as LayerSet).grid_layers(), value);
    }

    set page_opacity(value: number) {
        this.layers.by_name(LayerNames.drawing_sheet)!.opacity = value;
        this.draw();
    }

    zoom_to_board() {
        const edge_cuts = this.layers.by_name(LayerNames.edge_cuts)!;
        const board_bbox = edge_cuts.bbox;
        this.viewport.camera.bbox = board_bbox.grow(board_bbox.w * 0.1);
    }

    findHighlightItem(pos: Vec2): CrossHightAble | null {
        return null;
    }

    findInteractive(pos: Vec2) {
        for (const [, v] of this.#interactive) {
            for (const e of v)
                if (e.contains(pos)) {
                    return e;
                }
        }
        return null;
    }

    override on_hover(_pos: Vec2) {
        const hover_item = this.findInteractive(_pos);

        if (hover_item === this.#last_hover) return;

        this.#last_hover = hover_item;

        if (
            !this.#highlighted_track &&
            hover_item?.depth === Depth.LINE_SEGMENTS
        )
            return;

        this.painter.highlight(hover_item);
        this.draw();
    }
}
