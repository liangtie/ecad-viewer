import type { Parseable } from "../../kicad/parser";
import { LibSymbol, PinDefinition } from "../../kicad/schematic";

export class KicadPin extends PinDefinition {
    constructor(
        expr: Parseable,
        public override parent: LibSymbol,
    ) {
        super(expr, parent);
    }
}
