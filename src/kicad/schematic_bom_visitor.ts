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
        if (
            node.footprint.length == 0 ||
            !node.in_bom ||
            (node.unit && node.unit != 1) // Check if the symbol has multiple parts , count only the part 1
        )
            return;

        const schematicSymbol: BomItem = {
            Reference: "",
            Name: node.value,
            Description: node.description,
            Datasheet: node.datasheet,
            Footprint: node.footprint,
            DNP: node.dnp,
            Qty: 1,
            Price: 0,
        };

        for (const [, ins] of node.instances) {
            this.#bom_list.push({
                ...schematicSymbol,
                Reference: ins.reference ?? schematicSymbol.Reference,
                Name: ins.value ?? schematicSymbol.Name,
                Footprint: ins.footprint ?? schematicSymbol.Footprint,
            });
        }
    }
}
