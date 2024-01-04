/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { first } from "../../base/iterator";
import { BBox } from "../../base/math";
import { is_string } from "../../base/types";
import type { KicadSymbolLib } from "../../ecad-viewer/lib_symbol/kicad_symbol_lib";
import { Renderer } from "../../graphics";
import { Canvas2DRenderer } from "../../graphics/canvas2d";
import { type SchematicTheme } from "../../kicad";
import {
    KicadSch,
    SchematicSheet,
    SchematicSymbol,
} from "../../kicad/schematic";
import { ProjectPage } from "../../kicanvas/project";
import { DocumentViewer } from "../base/document-viewer";
import { LayerSet } from "./layers";
import { SchematicPainter } from "./painter";

export class SchematicViewer extends DocumentViewer<
    KicadSch | KicadSymbolLib,
    SchematicPainter,
    LayerSet,
    SchematicTheme
> {
    get schematic(): KicadSch | KicadSymbolLib {
        return this.document;
    }

    override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new Canvas2DRenderer(canvas);
        renderer.state.fill = this.theme.note;
        renderer.state.stroke = this.theme.note;
        renderer.state.stroke_width = 0.1524;
        return renderer;
    }

    override async load(src: KicadSch | KicadSymbolLib | ProjectPage) {
        if (src instanceof KicadSch) {
            return await super.load(src);
        }

        this.document = null!;

        if (src instanceof ProjectPage) {
            const doc = src.document;
            if (doc instanceof KicadSch)
                doc.update_hierarchical_data(src.sheet_path);

            if (doc instanceof KicadSch) return await super.load(doc);
        } else return await super.load(src);
    }

    protected override create_painter() {
        return new SchematicPainter(this.renderer, this.layers, this.theme);
    }

    protected override create_layer_set() {
        return new LayerSet(this.theme);
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
