import { Footprint, Pad } from "../../kicad/board";
import type { Parseable } from "../../kicad/parser";

export class KicadPad extends Pad {
    public constructor(
        expr: Parseable,
        public override parent: Footprint,
    ) {
        super(expr, parent);
    }
}
