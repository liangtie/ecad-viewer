import type { Parseable } from "../../kicad/parser";
import { KicadSch, LibSymbol } from "../../kicad/schematic";

export class KicadSymbol extends LibSymbol {
    public constructor(
        expr: Parseable,
        public override parent?: LibSymbol | KicadSch,
    ) {
        super(expr, parent);
    }
}
