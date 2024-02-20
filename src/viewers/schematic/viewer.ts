/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { Vec2 } from "../../base/math";
import { Color, Renderer } from "../../graphics";
import { Canvas2DRenderer } from "../../graphics/canvas2d";
import { type SchematicTheme } from "../../kicad";
import {
    KicadSch,
} from "../../kicad/schematic";
import { DocumentViewer } from "../base/document-viewer";
import { ViewerType } from "../base/viewer";
import { LayerSet } from "./layers";
import { SchematicPainter } from "./painter";

export class SchematicViewer extends DocumentViewer<
    KicadSch,
    SchematicPainter,
    LayerSet,
    SchematicTheme
> {
    override on_click(pos: Vec2): void {
        throw new Error("Method not implemented.");
    }
    override on_dblclick(pos: Vec2): void {
        throw new Error("Method not implemented.");
    }
    override on_hover(pos: Vec2): void {
        throw new Error("Method not implemented.");
    }
    override type: ViewerType = ViewerType.SCHEMATIC;

    private _alter_footprint_parts: string[] = [];

    public get alter_footprint_parts() {
        return this._alter_footprint_parts;
    }

    get schematic(): KicadSch {
        return this.document;
    }

    override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new Canvas2DRenderer(canvas);
        renderer.state.fill = this.theme.note;
        renderer.state.stroke = this.theme.note;
        renderer.state.stroke_width = 0.1524;
        renderer.background_color = Color.gray;
        return renderer;
    }

    protected override create_painter() {
        return new SchematicPainter(this.renderer, this.layers, this.theme);
    }

    protected override create_layer_set() {
        return new LayerSet(this.theme);
    }

}
