import type { Interactive } from "../base/interactive";
import { Angle, BBox, Matrix3, Vec2 } from "../base/math";
import { Color } from "../graphics";
import type { DocumentPainter } from "../viewers/base/painter";
import {
    LineSegment,
    ArcSegment,
    Via,
    Zone,
    ZoneKeepout,
    ZoneFill,
    Layer,
    Setup,
    PCBPlotParams,
    Stackup,
    StackupLayer,
    Net,
    Dimension,
    DimensionFormat,
    DimensionStyle,
    Footprint,
    GraphicItem,
    TextRenderCache,
    Text,
    Pad,
    PadDrill,
} from "./board";
import { BoardVisitorBase } from "./board_visitor_base";

export enum Depth {
    START,
    GRAPHICS = START,
    VIA,
    PAD,
    LINE_SEGMENTS,

    FOOT_PRINT,
    END,
}

export interface BoardInteractiveItem extends Interactive {
    depth: number;
}

export class BoxInteractiveItem implements Interactive {
    #bbox: BBox;
    constructor(
        bbox: BBox,
        public depth: number,
    ) {
        this.#bbox = bbox;
    }
    contains(pos: Vec2): boolean {
        return this.#bbox.contains_point(pos);
    }
    highlight(painter: DocumentPainter): void {
        const layer = painter.layers.overlay;
        layer.clear();
        painter.gfx.start_layer(layer.name);
        painter.gfx.line(
            [
                this.#bbox.top_left,
                this.#bbox.top_right,
                this.#bbox.bottom_right,
                this.#bbox.bottom_left,
                this.#bbox.top_left,
            ],
            0.2,
            Color.cyan,
        );

        layer.highlighted = true;
        layer.graphics = painter.gfx.end_layer();
        layer.graphics.composite_operation = "overlay";
    }
    select(): void {
        throw new Error("Method not implemented.");
    }
}

export interface BoardLine {
    start: Vec2;
    end: Vec2;
    width: number;
}

function pointOnLineSegment(p0: Vec2, p1: Vec2, p2: Vec2, width: number) {
    // Function to calculate the perpendicular distance from a point to a line
    function pointToLineDistance(point: Vec2, lineStart: Vec2, lineEnd: Vec2) {
        const lineVector = {
            x: lineEnd.x - lineStart.x,
            y: lineEnd.y - lineStart.y,
        };
        const pointVector = {
            x: point.x - lineStart.x,
            y: point.y - lineStart.y,
        };

        const crossProduct =
            pointVector.x * lineVector.y - pointVector.y * lineVector.x;
        return (
            Math.abs(crossProduct) /
            Math.sqrt(lineVector.x ** 2 + lineVector.y ** 2)
        );
    }

    // Function to check if a point is within the extended range of a line segment
    function isPointOnExtendedLineSegment(
        point: Vec2,
        lineStart: Vec2,
        lineEnd: Vec2,
        extendedWidth: number,
    ) {
        const minX = Math.min(lineStart.x, lineEnd.x) - extendedWidth;
        const maxX = Math.max(lineStart.x, lineEnd.x) + extendedWidth;
        const minY = Math.min(lineStart.y, lineEnd.y) - extendedWidth;
        const maxY = Math.max(lineStart.y, lineEnd.y) + extendedWidth;

        return (
            point.x >= minX &&
            point.x <= maxX &&
            point.y >= minY &&
            point.y <= maxY
        );
    }

    // Calculate the extended width based on half of the line width
    const extendedWidth = width / 2;

    // Check if P0 is within the extended range of the line segment
    if (isPointOnExtendedLineSegment(p0, p1, p2, extendedWidth)) {
        // Calculate the perpendicular distance
        const distance = pointToLineDistance(p0, p1, p2);

        // Check if the distance is within half of the width
        return distance <= extendedWidth;
    }

    return false;
}
export class LineInteractiveItem implements Interactive {
    #line: BoardLine;
    constructor(
        public depth: number,
        line: BoardLine,
    ) {
        this.#line = line;
    }
    contains(pos: Vec2): boolean {
        return pointOnLineSegment(
            pos,
            this.#line.start,
            this.#line.end,
            this.#line.width,
        );
    }
    highlight(painter: DocumentPainter): void {
        const layer = painter.layers.overlay;
        layer.clear();
        painter.gfx.start_layer(layer.name);
        painter.gfx.line(
            [this.#line.start, this.#line.end],
            this.#line.width,
            Color.cyan,
        );

        layer.highlighted = true;
        layer.graphics = painter.gfx.end_layer();
        layer.graphics.composite_operation = "overlay";
    }
    select(): void {
        throw new Error("Method not implemented.");
    }
}

export class BoardBBoxVisitor extends BoardVisitorBase {
    public get highlight_item() {
        return this.#highlight_items;
    }

    #highlight_items: BoardInteractiveItem[] = [];

    protected override visitLineSegment(lineSegment: LineSegment) {
        this.highlight_item.push(
            new LineInteractiveItem(Depth.LINE_SEGMENTS, {
                start: lineSegment.start,
                end: lineSegment.end,
                width: lineSegment.width,
            }),
        );
        return true;
    }

    protected override visitArcSegment(arcSegment: ArcSegment) {
        return true;
    }
    protected override visitVia(via: Via) {
        this.highlight_item.push(
            new BoxInteractiveItem(
                new BBox(
                    via.at.position.x,
                    via.at.position.y,
                    via.size,
                    via.size,
                ),
                Depth.VIA,
            ),
        );
        return true;
    }
    protected override visitZone(zone: Zone) {
        return true;
    }
    protected override visitZoneKeepout(zoneKeepout: ZoneKeepout) {
        return true;
    }
    protected override visitZoneFill(zoneFill: ZoneFill) {
        return true;
    }
    protected override visitLayer(layer: Layer) {
        return true;
    }
    protected override visitSetup(setup: Setup) {
        return true;
    }
    protected override visitPCBPlotParams(pcbPlotParams: PCBPlotParams) {
        return true;
    }
    protected override visitStackup(stackup: Stackup) {
        return true;
    }
    protected override visitStackupLayer(stackupLayer: StackupLayer) {
        return true;
    }
    protected override visitNet(net: Net) {
        return true;
    }
    protected override visitDimension(dimension: Dimension) {
        return true;
    }
    protected override visitDimensionFormat(dimensionFormat: DimensionFormat) {
        return true;
    }
    protected override visitDimensionStyle(dimensionStyle: DimensionStyle) {
        return true;
    }
    protected override visitFootprint(footprint: Footprint) {
        const bb = footprint.bbox;
        this.highlight_item.push(new BoxInteractiveItem(bb, Depth.FOOT_PRINT));
        return true;
    }
    protected override visitGraphicItem(graphicItem: GraphicItem) {
        this.highlight_item.push(
            new BoxInteractiveItem(graphicItem.bbox, Depth.GRAPHICS),
        );
        return true;
    }
    protected override visitTextRenderCache(textRenderCache: TextRenderCache) {
        return true;
    }
    protected override visitText(text: Text) {
        return true;
    }

    private getPadBBox(pad: Pad): BBox {
        const position_mat = Matrix3.translation(
            pad.at.position.x,
            pad.at.position.y,
        );

        position_mat.rotate_self(-Angle.deg_to_rad(pad.parent.at.rotation));
        position_mat.rotate_self(Angle.deg_to_rad(pad.at.rotation));

        const center = new Vec2(0, 0);
        switch (pad.shape) {
            case "circle": {
                const r = pad.size.x / 2;
                return new BBox(-r, -r, 2 * r, 2 * r);
            }
            case "rect":
            case "roundrect":
            case "trapezoid":
                return new BBox(
                    -pad.size.x / 2,
                    -pad.size.y / 2,
                    pad.size.x,
                    pad.size.y,
                );
            case "oval": {
                const pad_pos = center.add(pad.drill?.offset || new Vec2(0, 0));
                return new BBox(
                    pad_pos.x - pad.size.x / 2,
                    pad_pos.y - pad.size.y / 2,
                    pad.size.x,
                    pad.size.y,
                );
            }

            default:
                return new BBox();
        }
    }

    protected override visitPad(pad: Pad) {
        const bbox = this.getPadBBox(pad);
        const fp = pad.parent;
        const M1 = Matrix3.translation(
            fp.at.position.x,
            fp.at.position.y,
        ).rotate(Angle.deg_to_rad(fp.at.rotation));

        const position_mat = Matrix3.translation(
            pad.at.position.x,
            pad.at.position.y,
        );
        position_mat.rotate_self(-Angle.deg_to_rad(pad.parent.at.rotation));
        position_mat.rotate_self(Angle.deg_to_rad(pad.at.rotation));
        if (pad.drill?.offset) {
            position_mat.translate_self(pad.drill.offset.x, pad.drill.offset.y);
        }

        this.highlight_item.push(
            new BoxInteractiveItem(
                bbox.transform(position_mat).transform(M1),
                Depth.PAD,
            ),
        );

        return true;
    }
    protected override visitPadDrill(padDrill: PadDrill) {
        this.highlight_item.push(
            new BoxInteractiveItem(
                new BBox(
                    padDrill.offset.x,
                    padDrill.offset.y,
                    padDrill.width,
                    padDrill.width,
                ),
                Depth.VIA,
            ),
        );
        return true;
    }
}
