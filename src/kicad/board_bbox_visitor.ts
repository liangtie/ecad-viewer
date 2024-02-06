import type { CrossHightAble } from "../base/cross_highlight_able";
import { BBox } from "../base/math";
import { Color } from "../graphics";
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
    VIA,
    PAD = VIA,
    FOOT_PRINT,
    GRAPHICS,
}

export class BoardHighlightItem implements CrossHightAble {
    public highlighted = true;
    public highlightColor: Color = Color.from_css("#2ee0bf");
    public index: string;
    public cross_index: string;
    public constructor(
        public bbox: BBox,
        idx: number,
        public depth: number,
    ) {
        this.index = `${idx}`;
        this.cross_index = `cross_${idx}`;
    }
}

export class BoardBBoxVisitor extends BoardVisitorBase {
    public get highlight_item() {
        return this.#highlight_items;
    }

    #highlight_items: BoardHighlightItem[] = [];

    #index = 0;

    get next_index() {
        return ++this.#index;
    }

    protected override visitLineSegment(lineSegment: LineSegment) {
        return true;
    }
    protected override visitArcSegment(arcSegment: ArcSegment) {
        return true;
    }
    protected override visitVia(via: Via) {
        this.highlight_item.push(
            new BoardHighlightItem(
                new BBox(
                    via.at.position.x,
                    via.at.position.y,
                    via.size,
                    via.size,
                ),
                this.next_index,
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
        this.highlight_item.push(
            new BoardHighlightItem(
                footprint.bbox,
                this.next_index,
                Depth.FOOT_PRINT,
            ),
        );
        return true;
    }
    protected override visitGraphicItem(graphicItem: GraphicItem) {
        this.highlight_item.push(
            new BoardHighlightItem(
                graphicItem.bbox,
                this.next_index,
                Depth.GRAPHICS,
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
            new BoardHighlightItem(pad.bbox, this.next_index, Depth.PAD),
        );
        return true;
    }
    protected override visitPadDrill(padDrill: PadDrill) {
        this.highlight_item.push(
            new BoardHighlightItem(
                new BBox(
                    padDrill.offset.x,
                    padDrill.offset.y,
                    padDrill.width,
                    padDrill.width,
                ),
                this.next_index,
                Depth.VIA,
            ),
        );
        return true;
    }
}
