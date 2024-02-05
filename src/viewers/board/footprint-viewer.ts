/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import type { CrossHightAble } from "../../base/cross_highlight_able";
import { BBox, Vec2 } from "../../base/math";
import { is_string } from "../../base/types";
import { KicadFootprint } from "../../ecad-viewer/model/footprint/kicad_footprint";
import { Renderer } from "../../graphics";
import { WebGL2Renderer } from "../../graphics/webgl";
import type { BoardTheme } from "../../kicad";
import * as board_items from "../../kicad/board";
import { DocumentViewer } from "../base/document-viewer";
import { LayerNames, LayerSet, ViewLayer } from "./layers";
import { BoardPainter } from "./painter";

export class FootPrintViewer extends DocumentViewer<
    KicadFootprint,
    BoardPainter,
    LayerSet,
    BoardTheme
> {
    private pads: Map<string, board_items.Pad> = new Map();

    get board(): KicadFootprint {
        return this.document;
    }

    override async load(src: KicadFootprint) {
        if (src instanceof KicadFootprint) {
            for (const v of src.pads) this.pads.set(v.index, v);
        }
        await super.load(src);
    }

    protected override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new WebGL2Renderer(canvas);
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

    protected override on_pick(
        mouse: Vec2,
        items: Generator<{ layer: ViewLayer; bbox: BBox }, void, unknown>,
    ): void {
        let selected = null;

        for (const { layer: _, bbox } of items) {
            if (bbox.context instanceof board_items.Footprint) {
                selected = bbox.context;
                break;
            }
        }

        this.select(selected);
    }

    override select(item: board_items.Footprint | string | BBox | null) {
        if (this.board instanceof board_items.KicadPCB) {
            // If item is a string, find the footprint by uuid or reference.
            if (is_string(item)) {
                item = this.board.find_footprint(item);
            }
            // If it's a footprint, use the footprint's nominal bounding box.
            if (item instanceof board_items.Footprint) {
                item = item.bbox;
            }
            super.select(item);
        }
    }

    highlight_net(net: number) {
        // this.painter.paint_net(this.board, net);
        this.draw();
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
        for (const [, v] of this.pads) {
            if (v.boundingBox.contains_point(pos)) {
                return v;
            }
        }
        return null;
    }

    locateItemForCrossHight(idx: string): CrossHightAble | null {
        return this.pads.get(idx) ?? null;
    }
}
