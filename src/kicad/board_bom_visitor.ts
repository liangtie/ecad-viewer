import { Footprint } from "./board";
import { BoardVisitorBase } from "./board_visitor_base";
import type { BomItem } from "./bom_item";

export class BoardBomItemVisitor extends BoardVisitorBase {
    #bom_list: BomItem[] = [];

    get bom_list(){
        return this.#bom_list
    }

    protected override visitFootprint(node: Footprint) {
        const schematicSymbol: BomItem = {
            Reference: node.Reference,
            Name: node.Value,
            Description: node.Description,
            Datasheet: node.Datasheet,
            Footprint: node.Footprint,
            DNP: false,
            Qty: 1,
            Price: 0,
        };

        this.#bom_list.push(schematicSymbol);
        return true;
    }
}
