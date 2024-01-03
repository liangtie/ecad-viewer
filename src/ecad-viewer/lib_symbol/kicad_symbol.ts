import type { Parseable } from "../../kicad/parser";
import { KicadSch, LibSymbol } from "../../kicad/schematic";
import type { Project } from "../../kicanvas/project";

export class KicadSymbol extends LibSymbol {
    project?: Project;


    public constructor(
        public fileName: string,
        expr: Parseable,
        public override parent?: LibSymbol | KicadSch,
    ) {
        super(expr, parent);
    }
}
