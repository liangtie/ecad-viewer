import type { BomItem } from "./bom_item";
import type { SchematicSymbol } from "./schematic";
import { SchematicVisitorBase } from "./schematic_visitor_base";

export class SchematicBomVisitor extends SchematicVisitorBase {
    #bom_list: BomItem[] = [];

    public constructor() {
        super();
    }

    get bom_list() {
        return this.#bom_list;
    }

    visitSchematicSymbol(node: SchematicSymbol) {
        if (node.footprint.length == 0 || !node.in_bom) return;

        const schematicSymbol: BomItem = {
            Reference: "",
            Value: node.value,
            Datasheet: node.datasheet,
            Footprint: node.footprint,
            DNP: node.dnp,
            Qty: 1,
        };

        for (const [, ins] of node.instances) {
            this.#bom_list.push({
                ...schematicSymbol,
                Reference: ins.reference ?? schematicSymbol.Reference,
                Value: ins.value ?? schematicSymbol.Value,
                Footprint: ins.footprint ?? schematicSymbol.Footprint,
            });
        }
    }
}
