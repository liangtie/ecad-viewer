import type { Interactive } from "../base/interactive";
import { BBox, Vec2 } from "../base/math";
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

export type BoardInspectItem = Footprint | Pad | LineSegment;

export interface BoardInteractiveItem extends Interactive {
    depth: number;
    net: number | null;
    item: BoardInspectItem | null;
}

export class BoxInteractiveItem implements BoardInteractiveItem {
    #bbox: BBox;

    get bbox() {
        return this.#bbox;
    }

    constructor(
        bbox: BBox,
        public depth: number,
        public net: number | null,
        public item: BoardInspectItem | null,
    ) {
        this.#bbox = bbox;
    }
    contains(pos: Vec2): boolean {
        return this.#bbox.contains_point(pos);
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

export class LineInteractiveItem implements BoardInteractiveItem {
    #line: BoardLine;

    get line() {
        return this.#line;
    }

    constructor(
        public depth: number,
        line: BoardLine,
        public net: number,
        public item: BoardInspectItem,
    ) {
        this.#line = line;
    }
    contains(pos: Vec2): boolean {
        return LineInteractiveItem.pointOnLineSegment(
            pos,
            this.#line.start,
            this.#line.end,
            this.#line.width,
        );
    }
    select(): void {
        throw new Error("Method not implemented.");
    }

    static pointOnLineSegment(p0: Vec2, p1: Vec2, p2: Vec2, width: number) {
        // Function to calculate the perpendicular distance from a point to a line
        function pointToLineDistance(
            point: Vec2,
            lineStart: Vec2,
            lineEnd: Vec2,
        ) {
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
}

export class BoardBBoxVisitor extends BoardVisitorBase {
    public get highlight_item() {
        return this.#highlight_items;
    }

    #highlight_items: BoardInteractiveItem[] = [];

    protected override visitLineSegment(lineSegment: LineSegment) {
        this.highlight_item.push(
            new LineInteractiveItem(
                Depth.LINE_SEGMENTS,
                {
                    start: lineSegment.start,
                    end: lineSegment.end,
                    width: lineSegment.width,
                },
                lineSegment.net,
                lineSegment,
            ),
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
                via.net,
                null,
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
        this.highlight_item.push(
            new BoxInteractiveItem(bb, Depth.FOOT_PRINT, null, footprint),
        );
        return true;
    }
    protected override visitGraphicItem(graphicItem: GraphicItem) {
        this.highlight_item.push(
            new BoxInteractiveItem(
                graphicItem.bbox,
                Depth.GRAPHICS,
                null,
                null,
            ),
        );
        return true;
    }
    protected override visitTextRenderCache(textRenderCache: TextRenderCache) {
        return true;
    }
    protected override visitText(text: Text) {
        return true;
    }

    protected override visitPad(pad: Pad) {
        this.highlight_item.push(
            new BoxInteractiveItem(pad.bbox, Depth.PAD, pad?.net?.number, pad),
        );

        return true;
    }
    protected override visitPadDrill(padDrill: PadDrill) {
        return true;
    }
}