import type { CrossHightAble } from "../base/cross_highlight_able";
import { Angle, BBox, Matrix3, Vec2 } from "../base/math";
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
    START,
    GRAPHICS = START,
    VIA,
    PAD,
    FOOT_PRINT,
    END,
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
        const bb = footprint.bbox;
        this.highlight_item.push(
            new BoardHighlightItem(bb, this.next_index, Depth.FOOT_PRINT),
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
            new BoardHighlightItem(
                bbox.transform(position_mat).transform(M1),
                this.next_index,
                Depth.PAD,
            ),
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
