import { Footprint, KicadPCB } from "../../kicad/board";
import type { Parseable } from "../../kicad/parser";

export class KicadFootprint extends Footprint {
    public constructor(
        expr: Parseable,
        public override parent: KicadPCB,
    ) {
        super(expr, parent);
    }
}
