import type { KicadSch } from "./schematic";
import { SchematicVisitorBase } from "./schematic_visitor_base";

export class SchematicBomVisitor extends SchematicVisitorBase {
    visitKicadSch(node: KicadSch) {
        if (node.lib_symbols)
            for (const lib_symbol of node.lib_symbols.symbols)
                this.visit(lib_symbol);
    }
}
