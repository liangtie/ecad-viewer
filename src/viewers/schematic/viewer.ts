/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { Vec2 } from "../../base/math";
import { Color, Renderer } from "../../graphics";
import { Canvas2DRenderer } from "../../graphics/canvas2d";
import { DrawingSheet, type SchematicTheme } from "../../kicad";
import { KicadSch } from "../../kicad/schematic";
import { DocumentViewer } from "../base/document-viewer";
import { KiCanvasSelectEvent, SheetChangeEvent } from "../base/events";
import { Grid } from "../base/grid";
import { ViewLayerNames } from "../base/view-layers";
import { ViewerType } from "../base/viewer";
import { DrawingSheetPainter } from "../drawing-sheet/painter";
import { LayerSet } from "./layers";
import { SchematicPainter } from "./painter";

export class SchematicViewer extends DocumentViewer<
    KicadSch,
    SchematicPainter,
    LayerSet,
    SchematicTheme
> {
    override on_click(pos: Vec2): void {
        for (const item of this.document.sheets) {
            if (item.bbox.contains_point(pos) && item.sheetfile) {
                this.dispatchEvent(
                    new KiCanvasSelectEvent({
                        item: item,
                        previous: null,
                    }),
                );
                break;
            }
        }
    }
    override on_dblclick(pos: Vec2): void {
        if (this.document.sheets)
            for (const item of this.document.sheets) {
                if (item.bbox.contains_point(pos) && item.sheetfile) {
                    this.dispatchEvent(new SheetChangeEvent(item.sheetfile));
                    break;
                }
            }
    }

    override on_hover(pos: Vec2): void {}
    override type: ViewerType = ViewerType.SCHEMATIC;

    private _alter_footprint_parts: string[] = [];

    public get alter_footprint_parts() {
        return this._alter_footprint_parts;
    }

    get schematic(): KicadSch {
        return this.document;
    }
    public override paint() {
        if (!this.document) {
            return;
        }

        // Update the renderer's background color to match the theme.
        this.renderer.background_color = this.theme.background;

        // Load the default drawing sheet.
        if (!this.drawing_sheet) {
            this.drawing_sheet = DrawingSheet.default();
        }
        this.drawing_sheet.document = this.document;

        // Setup graphical layers
        this.disposables.disposeAndRemove(this.layers);
        this.layers = this.disposables.add(this.create_layer_set());

        // Paint the board
        this.painter = this.create_painter();
        this.painter.paint(this.document);

        // Paint the drawing sheet
        new DrawingSheetPainter(this.renderer, this.layers, this.theme).paint(
            this.drawing_sheet,
        );

        // Create the grid
        this.grid = new Grid(
            this.renderer,
            this.viewport.camera,
            this.layers.by_name(ViewLayerNames.grid)!,
            this.grid_origin,
            this.theme.grid,
            this.theme.grid_axes,
        );
    }

    override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new Canvas2DRenderer(canvas);
        renderer.state.fill = this.theme.note;
        renderer.state.stroke = this.theme.note;
        renderer.state.stroke_width = 0.1524;
        renderer.background_color = Color.gray;
        return renderer;
    }
    public override zoom_fit_top_item() {
        this.viewport.camera.bbox = this.drawing_sheet.page_bbox.grow(10);
        this.draw();
    }

    protected override create_painter() {
        return new SchematicPainter(this.renderer, this.layers, this.theme);
    }

    protected override create_layer_set() {
        return new LayerSet(this.theme);
    }
}
