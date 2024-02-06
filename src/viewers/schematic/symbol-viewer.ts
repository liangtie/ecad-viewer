/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import type { CrossHightAble } from "../../base/cross_highlight_able";
import { first } from "../../base/iterator";
import { BBox, Vec2 } from "../../base/math";
import { is_string } from "../../base/types";
import { KicadSymbolLib } from "../../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import { Renderer } from "../../graphics";
import { Canvas2DRenderer } from "../../graphics/canvas2d";
import { type SchematicTheme } from "../../kicad";
import {
    KicadSch,
    LibSymbol,
    LibSymbolPin,
    SchematicSheet,
    SchematicSymbol,
} from "../../kicad/schematic";
import { DocumentViewer } from "../base/document-viewer";
import { ViewerType } from "../base/viewer";
import { LayerSet } from "./layers";
import { SchematicPainter } from "./painter";

export class SymbolViewer extends DocumentViewer<
    KicadSymbolLib,
    SchematicPainter,
    LayerSet,
    SchematicTheme
> {
    override type: ViewerType = ViewerType.SCHEMATIC;

    private _alter_footprint_parts: string[] = [];

    public get alter_footprint_parts() {
        return this._alter_footprint_parts;
    }

    private libPins: Map<string, LibSymbolPin> = new Map();

    private _symbolLib?: KicadSymbolLib;

    get schematic(): KicadSymbolLib {
        return this.document;
    }

    override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new Canvas2DRenderer(canvas);
        renderer.state.fill = this.theme.note;
        renderer.state.stroke = this.theme.note;
        renderer.state.stroke_width = 0.1524;
        return renderer;
    }

    build_libPins(lib: LibSymbol) {
        for (const i of lib.libPins) {
            this.libPins.set(i.index, i);
        }
        for (const c of lib.children) this.build_libPins(c);
    }

    set_active_part_unit(idx: number) {
        if (this._symbolLib) {
            if (this._symbolLib.active_unit_index != idx) {
                this._symbolLib.set_active_unit_index(idx);
                this.paint();
                this.draw();
            }
        }
    }

    override async load(src: KicadSymbolLib) {
        if (src instanceof KicadSch) {
            return await super.load(src);
        }

        this.libPins = new Map();

        if (src instanceof KicadSymbolLib) {
            this._symbolLib = src;
            for (const i of src.items()) {
                this.build_libPins(i);
            }
            for (let i = 0; i < src.alter_symbol_parts; i++)
                this._alter_footprint_parts.push(
                    `Part ${String.fromCharCode(0x41 + i)}`,
                );
        }

        this.document = null!;
        return await super.load(src);
    }

    protected override create_painter() {
        return new SchematicPainter(this.renderer, this.layers, this.theme);
    }

    protected override create_layer_set() {
        return new LayerSet(this.theme);
    }
    findHighlightItem(pos: Vec2): CrossHightAble | null {
        for (const [, v] of this.libPins) {
            if (v.boundingBox.contains_point(pos)) {
                return v;
            }
        }
        return null;
    }

    findItemForCrossHight(idx: string): CrossHightAble | null {
        return this.libPins.get(idx) ?? null;
    }

    public override select(
        item: SchematicSymbol | SchematicSheet | string | BBox | null,
    ): void {
        if (this.schematic instanceof KicadSch) {
            // If item is a string, find the symbol by uuid or reference.
            if (is_string(item)) {
                item =
                    this.schematic.find_symbol(item) ??
                    this.schematic.find_sheet(item);
            }

            // If it's a symbol or sheet, find the bounding box for it.
            if (
                item instanceof SchematicSymbol ||
                item instanceof SchematicSheet
            ) {
                const bboxes = this.layers.query_item_bboxes(item);
                item = first(bboxes) ?? null;
            }

            super.select(item);
        }
    }
}
