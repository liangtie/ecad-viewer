import type { Parseable } from "../../kicad/parser";
import { LibSymbol } from "../../kicad/schematic";
import type { Project } from "../../kicanvas/project";

export class KicadSymbol extends LibSymbol {
    project?: Project;

    public constructor(
        expr: Parseable,
        public override parent?: any,
    ) {
        super(expr, parent);
    }
}
