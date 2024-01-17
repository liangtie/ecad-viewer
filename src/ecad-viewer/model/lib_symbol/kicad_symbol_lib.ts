import { Arc, BBox, Vec2 } from "../../../base/math";
import { P, parse_expr, T, type Parseable } from "../../../kicad/parser";
import {
    Bezier,
    KicadSch,
    LibSymbol,
    Rectangle,
    TextBox,
    Circle,
    Polyline,
} from "../../../kicad/schematic";
import type { Project } from "../../../kicanvas/project";

import { calculateBoundingBox } from "./baz";

function Vect2dToBBox(a: Vec2, b: Vec2) {
    const x = a.x;

    const y = a.y;

    const width = b.x - a.x;
    const height = b.y - a.y;

    return new BBox(x, y, width, height);
}

function GetLibSymbolBBoxs(box_list: BBox[], s: LibSymbol) {
    {
        let x_min, x_max, y_min, y_max;
        for (const pin of s.pins) {
            {
                const pos = pin.at.position;
                if (x_min === undefined) {
                    x_min = x_max = pos.x;
                    y_min = y_max = pos.y;
                    continue;
                }
                x_min = x_min < pos.x ? x_min : pos.x;
                x_max = x_max! < pos.x ? pos.x : x_max;
                y_min = y_min! > pos.y ? pos.y : y_min;
                y_max = y_max! < pos.y ? pos.y : y_max;
            }
            box_list.push(
                new BBox(x_min, y_min, x_max! - x_min!, y_max! - y_min!),
            );
        }
    }
    //type Drawing = Arc | Bezier | Circle | Polyline | Rectangle | Text | TextBox;

    for (const d of s.drawings) {
        if (d instanceof Rectangle) {
            box_list.push(Vect2dToBBox(d.start, d.end));
        } else if (d instanceof TextBox) {
            box_list.push(PosSizeToBBox(d.at.position, d.size));
        } else if (d instanceof Arc) {
            box_list.push(d.bbox);
        } else if (d instanceof Circle) {
            box_list.push(
                new BBox(
                    d.center.x - d.radius,
                    d.center.y - d.radius,
                    d.radius * 2,
                    d.radius * 2,
                ),
            );
        } else if (d instanceof Bezier) {
            let x_min, x_max, y_min, y_max;

            for (const pos of d.pts) {
                if (x_min === undefined) {
                    x_min = x_max = pos.x;
                    y_min = y_max = pos.y;
                    continue;
                }
                x_min = x_min < pos.x ? x_min : pos.x;
                x_max = x_max! < pos.x ? pos.x : x_max;
                y_min = y_min! > pos.y ? pos.y : y_min;
                y_max = y_max! < pos.y ? pos.y : y_max;
            }

            const pts = calculateBoundingBox(d.start!, d.c1!, d.c2!, d.end!);
            box_list.push(
                new BBox(
                    pts.minX,
                    pts.minY,
                    pts.maxX - pts.minX,
                    pts.maxY - pts.minY,
                ),
            );
        } else if (d instanceof Polyline) {
            let x_min, x_max, y_min, y_max;

            for (const pos of d.pts) {
                if (x_min === undefined) {
                    x_min = x_max = pos.x;
                    y_min = y_max = pos.y;
                    continue;
                }
                x_min = x_min < pos.x ? x_min : pos.x;
                x_max = x_max! < pos.x ? pos.x : x_max;
                y_min = y_min! > pos.y ? pos.y : y_min;
                y_max = y_max! < pos.y ? pos.y : y_max;
            }
            box_list.push(
                new BBox(x_min, y_min, x_max! - x_min!, y_max! - y_min!),
            );
        }
    }

    for (const c of s.children) {
        GetLibSymbolBBoxs(box_list, c);
    }
}

function PosSizeToBBox(pos: Vec2, size: Vec2) {
    return new BBox(pos.x, pos.y, size.x, size.y);
}
export class KicadSymbolLib {
    public project: Project;
    public uuid;
    public version?: number;
    public generator?: string;
    #symbols_by_name: Map<string, LibSymbol> = new Map();

    symbols: LibSymbol[];
    constructor(
        public filename: string,
        expr: Parseable,
        public parent?: LibSymbol | KicadSch,
    ) {
        Object.assign(
            this,
            parse_expr(
                expr,
                P.start("kicad_symbol_lib"),
                P.pair("version", T.number),
                P.pair("generator", T.string),
                P.collection("symbols", "symbol", T.item(LibSymbol, this)),
            ),
        );
        this.uuid = filename;
        for (const symbol of this.symbols) {
            this.#symbols_by_name.set(symbol.name, symbol);
        }
    }

    *items() {
        yield* this.symbols;
    }
    resolve_text_var(name: string): string | undefined {
        return name;
    }
    by_name(name: string) {
        return this.#symbols_by_name.get(name);
    }

    public get bbox(): BBox {
        const box_list: BBox[] = [];

        for (const s of this.symbols) {
            GetLibSymbolBBoxs(box_list, s);
        }
        return BBox.combine(box_list);
    }
}
