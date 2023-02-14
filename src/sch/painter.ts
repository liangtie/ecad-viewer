/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { Color } from "../gfx/color";
import { Polygon, Polyline, Arc, Circle } from "../gfx/shapes";
import { Renderer } from "../gfx/renderer";
import { ShapedParagraph, TextOptions } from "../gfx/text";
import * as schematic from "../kicad/schematic";
import { Angle } from "../math/angle";
import { Arc as MathArc } from "../math/arc";
import { BBox } from "../math/bbox";
import { Matrix3 } from "../math/matrix3";
import { Vec2 } from "../math/vec2";
import { ViewLayer, LayerName, LayerSet } from "./layers";
import { ItemPainter, DocumentPainter } from "../framework/painter";
import { SchField } from "../text/sch_field";
import { StrokeFont } from "../text/stroke_font";
import { SchText } from "../text/sch_text";
import { LibText } from "../text/lib_text";
import { LibPin } from "../text/lib_pin";

function color_maybe(
    color?: Color,
    fallback_color?: Color,
    fail_color: Color = new Color(1, 0, 0, 1),
) {
    if (!color?.is_transparent) {
        return color!;
    }
    if (fallback_color) {
        return fallback_color;
    }
    return fail_color;
}

class RectanglePainter extends ItemPainter {
    classes = [schematic.Rectangle];

    layers_for(item: schematic.Rectangle) {
        return [LayerName.notes];
    }

    paint(layer: ViewLayer, r: schematic.Rectangle) {
        const color = color_maybe(
            r.stroke?.color,
            this.gfx.state.stroke,
            this.gfx.theme["note"] as Color,
        );

        const pts = [
            r.start,
            new Vec2(r.end.x, r.start.y),
            r.end,
            new Vec2(r.start.x, r.end.y),
            r.start,
        ];

        if (r.fill?.type !== "none") {
            this.gfx.polygon(new Polygon(pts, this.gfx.state.fill));
        }

        this.gfx.line(
            new Polyline(
                pts,
                r.stroke?.width || this.gfx.state.stroke_width,
                color,
            ),
        );
    }
}

class PolylinePainter extends ItemPainter {
    classes = [schematic.Polyline];

    layers_for(item: schematic.Polyline) {
        return [LayerName.notes];
    }

    paint(layer: ViewLayer, pl: schematic.Polyline) {
        const color = color_maybe(
            pl.stroke?.color,
            this.gfx.state.stroke,
            this.gfx.theme["note"] as Color,
        );

        this.gfx.line(
            new Polyline(
                pl.pts,
                pl.stroke?.width || this.gfx.state.stroke_width,
                color,
            ),
        );

        if (pl.fill?.type !== "none") {
            this.gfx.polygon(new Polygon(pl.pts, color));
        }
    }
}

class WirePainter extends ItemPainter {
    classes = [schematic.Wire];

    layers_for(item: schematic.Wire) {
        return [LayerName.wire];
    }

    paint(layer: ViewLayer, w: schematic.Wire) {
        this.gfx.line(
            new Polyline(
                w.pts,
                this.gfx.state.stroke_width,
                this.gfx.theme["wire"] as Color,
            ),
        );
    }
}

class CirclePainter extends ItemPainter {
    classes = [schematic.Circle];

    layers_for(item: schematic.Circle) {
        return [LayerName.notes];
    }

    paint(layer: ViewLayer, c: schematic.Circle) {
        const color =
            this.gfx.state.stroke ?? (this.gfx.theme["note"] as Color);

        this.gfx.arc(
            new Arc(
                c.center,
                c.radius,
                new Angle(0),
                new Angle(Math.PI * 2),
                c.stroke?.width || this.gfx.state.stroke_width,
                color,
            ),
        );

        if (c.fill?.type != "none") {
            this.gfx.circle(new Circle(c.center, c.radius, color));
        }
    }
}

class ArcPainter extends ItemPainter {
    classes = [schematic.Arc];

    layers_for(item: schematic.Arc) {
        return [LayerName.notes];
    }

    paint(layer: ViewLayer, a: schematic.Arc) {
        const color =
            this.gfx.state.stroke ?? (this.gfx.theme["note"] as Color);

        const arc = MathArc.from_three_points(
            a.start,
            a.mid,
            a.end,
            a.stroke?.width,
        );

        this.gfx.arc(
            new Arc(
                arc.center,
                arc.radius,
                arc.start_angle,
                arc.end_angle,
                a.stroke?.width || this.gfx.state.stroke_width,
                color,
            ),
        );
    }
}

class JunctionPainter extends ItemPainter {
    classes = [schematic.Junction];

    layers_for(item: schematic.Junction) {
        return [LayerName.junction];
    }

    paint(layer: ViewLayer, j: schematic.Junction) {
        const color = this.gfx.theme["junction"] as Color;
        this.gfx.circle(
            new Circle(j.at.position, (j.diameter || 1) / 2, color),
        );
    }
}

class NoConnectPainter extends ItemPainter {
    classes = [schematic.NoConnect];

    layers_for(item: schematic.NoConnect) {
        return [LayerName.junction];
    }

    paint(layer: ViewLayer, nc: schematic.NoConnect): void {
        const color = this.gfx.theme["no_connect"] as Color;
        const width = schematic.DefaultValues.line_width;
        const size = schematic.DefaultValues.noconnect_size / 2;

        this.gfx.state.push();
        this.gfx.state.matrix.translate_self(
            nc.at.position.x,
            nc.at.position.y,
        );

        this.gfx.line(
            new Polyline(
                [new Vec2(-size, -size), new Vec2(size, size)],
                width,
                color,
            ),
        );

        this.gfx.line(
            new Polyline(
                [new Vec2(size, -size), new Vec2(-size, size)],
                width,
                color,
            ),
        );

        this.gfx.state.pop();
    }
}

class TextPainter extends ItemPainter {
    classes = [schematic.Text];

    layers_for(item: schematic.Text) {
        return [LayerName.notes];
    }

    paint(layer: ViewLayer, t: schematic.Text) {
        if (t.effects.hide || !t.text) {
            return;
        }

        const schtext = new SchText(t.text);

        schtext.attributes.h_align = t.effects.justify.horizontal;
        schtext.attributes.v_align = t.effects.justify.vertical;
        schtext.attributes.stroke_width = t.effects.font.thickness * 10000;
        schtext.attributes.italic = t.effects.font.italic;
        schtext.attributes.bold = t.effects.font.bold;
        schtext.attributes.size.set(t.effects.font.size.multiply(10000));
        schtext.attributes.angle = Angle.from_degrees(t.at.rotation);
        schtext.text_pos = t.at.position.multiply(10000);

        schtext.attributes.stroke_width = schtext.get_effective_text_thickness(
            schematic.DefaultValues.line_width * 10000,
        );
        schtext.attributes.color = this.gfx.theme["notes"] as Color;

        this.gfx.state.push();
        StrokeFont.default().draw(
            this.gfx,
            schtext.shown_text,
            schtext.text_pos,
            new Vec2(0, 0),
            schtext.attributes,
        );
        this.gfx.state.pop();
    }
}

class NetLabelPainter extends ItemPainter {
    classes: any[] = [schematic.NetLabel];

    layers_for(
        item:
            | schematic.NetLabel
            | schematic.HierarchicalLabel
            | schematic.GlobalLabel,
    ) {
        return [LayerName.label];
    }

    get color() {
        return this.gfx.theme["label_local"] as Color;
    }

    get_text_baseline_offset_dist(
        l:
            | schematic.NetLabel
            | schematic.HierarchicalLabel
            | schematic.GlobalLabel,
        options: TextOptions,
    ) {
        return (
            l.effects.font.size.y * schematic.DefaultValues.text_offset_ratio +
            options.get_effective_thickness(schematic.DefaultValues.line_width)
        );
    }

    get_text_offset(
        l:
            | schematic.NetLabel
            | schematic.HierarchicalLabel
            | schematic.GlobalLabel,
        options: TextOptions,
    ) {
        const offset = new Vec2(0, 0);
        const offset_dist = this.get_text_baseline_offset_dist(l, options);

        if (l.at.rotation == 0 || l.at.rotation == 180) {
            offset.y = -offset_dist;
        } else {
            offset.x = -offset_dist;
        }

        return offset;
    }

    paint(
        layer: ViewLayer,
        l: schematic.NetLabel | schematic.HierarchicalLabel,
    ) {
        if (l.effects.hide) {
            return;
        }

        const color = this.color;
        const rotation = Angle.from_degrees(l.at.rotation).normalize();

        if (rotation.degrees == 180) {
            rotation.degrees = 0;
        } else if (rotation.degrees == 270) {
            rotation.degrees = 90;
        }

        const options = new TextOptions(
            this.gfx.text_shaper.default_font,
            l.effects.font.size,
            l.effects.font.thickness,
            l.effects.font.bold,
            l.effects.font.italic,
            l.effects.justify.vertical,
            l.effects.justify.horizontal,
            l.effects.justify.mirror,
        );

        const pos_offset = this.get_text_offset(l, options);
        const pos = l.at.position.add(pos_offset);

        const shaped = this.gfx.text_shaper.paragraph(
            l.text,
            pos,
            rotation,
            options,
        );

        for (const line of shaped.to_polylines(color)) {
            this.gfx.line(line);
        }

        this.paint_shape(l, shaped);
        // this.paint_debug(l, shaped);
    }

    paint_shape(
        l:
            | schematic.NetLabel
            | schematic.GlobalLabel
            | schematic.HierarchicalLabel,
        shaped: ShapedParagraph,
    ) {}

    paint_debug(
        l:
            | schematic.NetLabel
            | schematic.GlobalLabel
            | schematic.HierarchicalLabel,
        shaped: ShapedParagraph,
    ) {
        this.gfx.circle(
            new Circle(l.at.position, 0.2, new Color(1, 0.2, 0.2, 1)),
        );
        const bb = shaped.bbox;
        this.gfx.line(
            new Polyline(
                [
                    bb.top_left,
                    bb.top_right,
                    bb.bottom_right,
                    bb.bottom_left,
                    bb.top_left,
                ],
                0.1,
                new Color(1, 0.2, 0.2, 0.2),
            ),
        );
    }
}

class GlobalLabelPainter extends NetLabelPainter {
    // magic number from KiCAD's SCH_GLOBALLABEL::GetSchematicTextOffset
    // that centers the text so there's room for the overbar.
    static baseline_offset_ratio = 0.0715;
    static triangle_offset_ratio = 0.75;

    override classes = [schematic.GlobalLabel];

    override get color() {
        return this.gfx.theme["label_global"] as Color;
    }

    override get_text_offset(l: schematic.GlobalLabel, options: TextOptions) {
        const vert = 0;
        let horz = schematic.DefaultValues.label_size_ratio * options.size.y;

        if (["input", "bidirectional", "tri_state"].includes(l.shape)) {
            // accommodate triangular shaped tail
            horz += options.size.y * GlobalLabelPainter.triangle_offset_ratio;
        }

        const offset = new Vec2(horz, vert).rotate(
            Angle.from_degrees(l.at.rotation),
        );

        return offset;
    }

    override paint_shape(l: schematic.GlobalLabel, shaped: ShapedParagraph) {
        const color = this.color;
        const margin =
            shaped.options.size.y * schematic.DefaultValues.label_size_ratio;
        const half_size = shaped.options.size.y / 2 + margin;
        const thickness = shaped.options.get_effective_thickness(
            schematic.DefaultValues.line_width,
        );

        let length =
            l.at.rotation == 90 || l.at.rotation == 270
                ? shaped.bbox.h
                : shaped.bbox.w;
        length += 2 * margin;

        // hack: I'm not yet sure how kicad adds this extra length to the bbox.
        length += half_size * 0.5;

        const x = length + thickness + 0.03;
        const y = half_size + thickness + 0.03;

        const line = new Polyline(
            [
                new Vec2(0, 0),
                new Vec2(0, -y),
                new Vec2(-x, -y),
                new Vec2(-x, 0),
                new Vec2(-x, y),
                new Vec2(0, y),
                new Vec2(0, 0),
            ],
            thickness,
            color,
        );

        let x_offset = 0;

        switch (l.shape) {
            case "input":
                x_offset = -half_size;
                line.points[0]!.x += half_size;
                line.points[6]!.x += half_size;
                break;
            case "output":
                line.points[3]!.x -= half_size;
                break;
            case "bidirectional":
            case "tri_state":
                x_offset = -half_size;
                line.points[0]!.x += half_size;
                line.points[6]!.x += half_size;
                line.points[3]!.x -= half_size;
                break;
            default:
                break;
        }

        for (const pt of line.points) {
            pt.x += x_offset;
        }

        const rotation = Angle.from_degrees(l.at.rotation + 180);

        this.gfx.state.push();
        this.gfx.state.matrix.translate_self(l.at.position.x, l.at.position.y);
        this.gfx.state.matrix.rotate_self(rotation);
        this.gfx.line(line);
        this.gfx.state.pop();
    }
}

class HierarchicalLabelPainter extends NetLabelPainter {
    override classes = [schematic.HierarchicalLabel];

    override get color() {
        return this.gfx.theme["label_hier"] as Color;
    }

    override get_text_offset(
        l: schematic.HierarchicalLabel,
        options: TextOptions,
    ): Vec2 {
        const horiz =
            this.get_text_baseline_offset_dist(l, options) +
            l.effects.font.size.x;
        const vert = 0;
        const offset = new Vec2(horiz, vert);
        return offset.rotate(Angle.from_degrees(l.at.rotation));
    }

    override paint_shape(
        l: schematic.HierarchicalLabel,
        shaped: ShapedParagraph,
    ): void {
        const s = l.effects.font.size.y;
        const color = this.color;
        const thickness = shaped.options.get_effective_thickness(
            schematic.DefaultValues.line_width,
        );

        this.gfx.state.push();
        this.gfx.state.matrix.translate_self(l.at.position.x, l.at.position.y);
        this.gfx.state.matrix.rotate_self(Angle.from_degrees(l.at.rotation));

        let points: Vec2[];

        switch (l.shape) {
            case "output":
                points = [
                    new Vec2(0, s / 2),
                    new Vec2(s / 2, s / 2),
                    new Vec2(s, 0),
                    new Vec2(s / 2, -s / 2),
                    new Vec2(0, -s / 2),
                    new Vec2(0, s / 2),
                ];
                break;

            case "input":
                points = [
                    new Vec2(s, s / 2),
                    new Vec2(s / 2, s / 2),
                    new Vec2(0, 0),
                    new Vec2(s / 2, -s / 2),
                    new Vec2(s, -s / 2),
                    new Vec2(s, s / 2),
                ];
                break;

            case "bidirectional":
            case "tri_state":
                points = [
                    new Vec2(s / 2, s / 2),
                    new Vec2(s, 0),
                    new Vec2(s / 2, -s / 2),
                    new Vec2(0, 0),
                    new Vec2(s / 2, s / 2),
                ];
                break;

            case "passive":
            default:
                points = [
                    new Vec2(0, s / 2),
                    new Vec2(s, s / 2),
                    new Vec2(s, -s / 2),
                    new Vec2(0, -s / 2),
                    new Vec2(0, s / 2),
                ];
                break;
        }

        this.gfx.line(new Polyline(points, thickness, color));

        this.gfx.state.pop();
    }
}

class PinPainter extends ItemPainter {
    classes = [schematic.PinInstance];

    layers_for(item: schematic.PinInstance) {
        return [
            LayerName.symbol_pin,
            LayerName.symbol_foreground,
            LayerName.interactive,
        ];
    }

    paint(layer: ViewLayer, p: schematic.PinInstance) {
        if (p.definition.hide) {
            return;
        }

        const current_symbol_transform = (this.view_painter as SchematicPainter)
            .current_symbol_transform!;

        const libpin = new LibPin(p);

        libpin.apply_symbol_transformations(current_symbol_transform);

        this.gfx.state.push();
        this.gfx.state.matrix = Matrix3.identity();
        this.gfx.state.stroke = this.gfx.theme["pin"] as Color;

        if (
            layer.name == LayerName.symbol_pin ||
            layer.name == LayerName.interactive
        ) {
            libpin.draw_pin_shape(this.gfx);
        }
        if (layer.name == LayerName.symbol_foreground) {
            libpin.draw_name_and_number(this.gfx);
        }

        this.gfx.state.pop();
    }
}

class LibSymbolPainter extends ItemPainter {
    classes = [schematic.LibSymbol];

    layers_for(item: schematic.LibSymbol) {
        return [
            LayerName.symbol_foreground,
            LayerName.symbol_foreground,
            LayerName.symbol_field,
        ];
    }

    paint(layer: ViewLayer, s: schematic.LibSymbol) {
        for (const c of s.children) {
            this.paint(layer, c);
        }

        const outline_color = this.gfx.theme["component_outline"];
        const fill_color = this.gfx.theme["component_body"];

        if (
            [
                LayerName.symbol_background,
                LayerName.symbol_foreground,
                LayerName.interactive,
            ].includes(layer.name as LayerName)
        ) {
            for (const g of s.drawings) {
                if (g instanceof schematic.GraphicItem) {
                    if (
                        layer.name == LayerName.symbol_background &&
                        g.fill?.type == "background"
                    ) {
                        this.gfx.state.fill = fill_color as Color;
                    } else if (
                        layer.name == LayerName.symbol_foreground &&
                        g.fill?.type == "outline"
                    ) {
                        this.gfx.state.fill = outline_color as Color;
                    } else {
                        this.gfx.state.fill = Color.transparent;
                    }
                }

                this.gfx.state.stroke = outline_color as Color;

                this.view_painter.paint_item(layer, g);
            }
        }
    }
}

type SymbolTransform = {
    matrix: Matrix3;
    position: Vec2;
    rotations: number;
    mirror_x: boolean;
    mirror_y: boolean;
};

function get_symbol_transform(
    symbol: schematic.SchematicSymbol,
): SymbolTransform {
    // [x1, x2, 0, y1, y2, ...]
    const zero_deg_matrix = new Matrix3([1, 0, 0, 0, -1, 0, 0, 0, 1]); // [1, 0, 0, -1]
    const ninety_deg_matrix = new Matrix3([0, -1, 0, -1, 0, 0, 0, 0, 1]); // [0, -1, -1, 0]
    const one_eighty_deg_matrix = new Matrix3([-1, 0, 0, 0, 1, 0, 0, 0, 1]); // [-1, 0, 0, 1]
    const two_seventy_deg_matrix = new Matrix3([0, 1, 0, 1, 0, 0, 0, 0, 1]); // [0, 1, 1, 0]
    let rotations = 0;

    let matrix = zero_deg_matrix;
    if (symbol.at.rotation == 0) {
        // leave matrix as is
    } else if (symbol.at.rotation == 90) {
        rotations = 1;
        matrix = ninety_deg_matrix;
    } else if (symbol.at.rotation == 180) {
        rotations = 2;
        matrix = one_eighty_deg_matrix;
    } else if (symbol.at.rotation == 270) {
        rotations = 3;
        matrix = two_seventy_deg_matrix;
    } else {
        throw new Error(`unexpected rotation ${symbol.at.rotation}`);
    }

    if (symbol.mirror == "y") {
        // * [-1, 0, 0, 1]
        const x1 = matrix.elements[0]! * -1;
        const y1 = matrix.elements[3]! * -1;
        const x2 = matrix.elements[1]!;
        const y2 = matrix.elements[4]!;
        matrix.elements[0] = x1;
        matrix.elements[1] = x2;
        matrix.elements[3] = y1;
        matrix.elements[4] = y2;
    } else if (symbol.mirror == "x") {
        // * [1, 0, 0, -1]
        const x1 = matrix.elements[0]!;
        const y1 = matrix.elements[3]!;
        const x2 = matrix.elements[1]! * -1;
        const y2 = matrix.elements[4]! * -1;
        matrix.elements[0] = x1;
        matrix.elements[1] = x2;
        matrix.elements[3] = y1;
        matrix.elements[4] = y2;
    }

    return {
        matrix: matrix,
        position: symbol.at.position,
        rotations: rotations,
        mirror_x: symbol.mirror == "x",
        mirror_y: symbol.mirror == "y",
    };
}

class PropertyPainter extends ItemPainter {
    classes = [schematic.Property];

    layers_for(item: schematic.Property) {
        return [LayerName.symbol_field, LayerName.interactive];
    }

    paint(layer: ViewLayer, p: schematic.Property) {
        if (p.effects.hide || !p.text) {
            return;
        }

        let color = this.gfx.theme["fields"] as Color;

        switch (p.name) {
            case "Reference":
                color = this.gfx.theme["reference"] as Color;
                break;
            case "Value":
                color = this.gfx.theme["value"] as Color;
                break;
        }

        const parent = p.parent as schematic.SchematicSymbol;
        const transform = get_symbol_transform(parent);

        const schfield = new SchField(p.text, {
            position: parent.at.position.multiply(10000),
            transform: transform.matrix,
        });

        schfield.apply_effects(p.effects);
        schfield.attributes.angle = Angle.from_degrees(p.at.rotation);

        // Position is tricky. KiCAD's parser calls into SCH_FIELD::SetPosition
        // when parsing which sets the position relative to the parent transform
        // but KiCanvas doesn't do any of that. So we have to do that transform
        // here.
        let rel_position = p.at.position
            .multiply(10000)
            .sub(schfield.parent!.position);
        rel_position = transform.matrix.inverse().transform(rel_position);
        rel_position = rel_position.add(schfield.parent!.position);

        schfield.text_pos = rel_position;

        const orient = schfield.draw_rotation;
        const bbox = schfield.bounding_box;
        const pos = bbox.center;

        schfield.attributes.angle = orient;
        schfield.attributes.h_align = "center";
        schfield.attributes.v_align = "center";
        schfield.attributes.stroke_width =
            schfield.get_effective_text_thickness(
                schematic.DefaultValues.line_width * 10000,
            );
        schfield.attributes.color = color;

        const bbox_pts = Matrix3.scaling(0.0001, 0.0001).transform_all([
            bbox.top_left,
            bbox.top_right,
            bbox.bottom_right,
            bbox.bottom_left,
            bbox.top_left,
        ]);

        if (layer.name == LayerName.interactive) {
            // drawing text is expensive, just draw the bbox for the interactive layer.
            this.gfx.line(new Polyline(Array.from(bbox_pts), 0.1, Color.white));
        } else {
            this.gfx.state.push();
            StrokeFont.default().draw(
                this.gfx,
                schfield.shown_text,
                pos,
                new Vec2(0, 0),
                schfield.attributes,
            );
            this.gfx.state.pop();
        }
    }
}

class LibTextPainter extends ItemPainter {
    classes = [schematic.LibText];

    layers_for(item: schematic.LibText) {
        return [LayerName.symbol_foreground];
    }

    paint(layer: ViewLayer, lt: schematic.LibText) {
        if (lt.effects.hide || !lt.text) {
            return;
        }

        const current_symbol_transform = (this.view_painter as SchematicPainter)
            .current_symbol_transform!;

        const libtext = new LibText(lt.text);

        libtext.apply_effects(lt.effects);

        libtext.text_pos = lt.at.position.multiply(10000);
        libtext.text_angle = Angle.from_degrees(lt.at.rotation);
        libtext.attributes.color = this.gfx.theme["foreground"] as Color;

        libtext.apply_symbol_transformations(current_symbol_transform);

        // This gets the absolute world coordinates where the text should
        // be drawn.
        const pos = libtext.world_pos;

        // draw_pos already applies v_align, so set it to center to draw
        // the text in the right spot.
        // Note: I'm not sure why it doesn't clear h_align like SchField
        // does.
        libtext.attributes.v_align = "center";

        this.gfx.state.push();
        this.gfx.state.matrix = Matrix3.identity();

        StrokeFont.default().draw(
            this.gfx,
            libtext.shown_text,
            pos,
            new Vec2(0, 0),
            libtext.attributes,
        );

        // this.paint_debug(bbox);

        this.gfx.state.pop();
    }

    paint_debug(bbox: BBox) {
        this.gfx.line(
            Polyline.from_BBox(
                bbox.scale(1 / 10000),
                0.127,
                new Color(0, 0, 1, 1),
            ),
        );

        this.gfx.circle(
            new Circle(
                bbox.center.multiply(1 / 10000),
                0.2,
                new Color(0, 1, 0, 1),
            ),
        );
    }
}

class SchematicSymbolPainter extends ItemPainter {
    classes = [schematic.SchematicSymbol];

    layers_for(item: schematic.SchematicSymbol) {
        return [
            LayerName.interactive,
            LayerName.symbol_foreground,
            LayerName.symbol_background,
            LayerName.symbol_field,
            LayerName.symbol_pin,
        ];
    }

    paint(layer: ViewLayer, si: schematic.SchematicSymbol) {
        if (layer.name == LayerName.interactive && si.lib_symbol.power) {
            // Don't draw power symbols on the interactive layer.
            return;
        }

        const transform = get_symbol_transform(si);

        (this.view_painter as SchematicPainter).current_symbol = si;
        (this.view_painter as SchematicPainter).current_symbol_transform =
            transform;

        this.gfx.state.push();
        this.gfx.state.matrix = Matrix3.translation(
            si.at.position.x,
            si.at.position.y,
        );
        this.gfx.state.multiply(transform.matrix);

        this.view_painter.paint_item(layer, si.lib_symbol);

        this.gfx.state.pop();

        if (
            [
                LayerName.symbol_pin,
                LayerName.symbol_foreground,
                LayerName.interactive,
            ].includes(layer.name as LayerName)
        ) {
            for (const pin of si.pins) {
                this.view_painter.paint_item(layer, pin);
            }
        }

        if (
            layer.name == LayerName.symbol_field ||
            layer.name == LayerName.interactive
        ) {
            for (const p of si.properties) {
                this.view_painter.paint_item(layer, p);
            }
        }

        (this.view_painter as SchematicPainter).current_symbol = undefined;
    }
}

export class SchematicPainter extends DocumentPainter {
    constructor(gfx: Renderer, layers: LayerSet) {
        super(gfx, layers);
        this.painter_list = [
            new RectanglePainter(this, gfx),
            new PolylinePainter(this, gfx),
            new WirePainter(this, gfx),
            new CirclePainter(this, gfx),
            new ArcPainter(this, gfx),
            new JunctionPainter(this, gfx),
            new NoConnectPainter(this, gfx),
            new TextPainter(this, gfx),
            new LibTextPainter(this, gfx),
            new PinPainter(this, gfx),
            new LibSymbolPainter(this, gfx),
            new PropertyPainter(this, gfx),
            new SchematicSymbolPainter(this, gfx),
            new NetLabelPainter(this, gfx),
            new GlobalLabelPainter(this, gfx),
            new HierarchicalLabelPainter(this, gfx),
        ];
    }

    current_symbol?: schematic.SchematicSymbol;
    current_symbol_transform?: SymbolTransform;
}
