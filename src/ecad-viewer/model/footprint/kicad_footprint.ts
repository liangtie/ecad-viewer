import { Footprint, KicadPCB, Layer } from "../../../kicad/board";
import { At } from "../../../kicad/common";
import type { Parseable } from "../../../kicad/parser";
import type { Project } from "../../../kicanvas/project";

export class KicadFootprint extends Footprint {
    project?: Project;
    filename: string;
    rotation: 0;
    override at: At;
    layers: Layer[] = JSON.parse(
        `[{"ordinal":0,"canonical_name":"F.Cu","type":"signal"},{"ordinal":31,"canonical_name":"B.Cu","type":"signal"},{"ordinal":32,"canonical_name":"B.Adhes","type":"user","user_name":"B.Adhesive"},{"ordinal":33,"canonical_name":"F.Adhes","type":"user","user_name":"F.Adhesive"},{"ordinal":34,"canonical_name":"B.Paste","type":"user"},{"ordinal":35,"canonical_name":"F.Paste","type":"user"},{"ordinal":36,"canonical_name":"B.SilkS","type":"user","user_name":"B.Silkscreen"},{"ordinal":37,"canonical_name":"F.SilkS","type":"user","user_name":"F.Silkscreen"},{"ordinal":38,"canonical_name":"B.Mask","type":"user"},{"ordinal":39,"canonical_name":"F.Mask","type":"user"},{"ordinal":40,"canonical_name":"Dwgs.User","type":"user","user_name":"User.Drawings"},{"ordinal":41,"canonical_name":"Cmts.User","type":"user","user_name":"User.Comments"},{"ordinal":42,"canonical_name":"Eco1.User","type":"user","user_name":"User.Eco1"},{"ordinal":43,"canonical_name":"Eco2.User","type":"user","user_name":"User.Eco2"},{"ordinal":44,"canonical_name":"Edge.Cuts","type":"user"},{"ordinal":45,"canonical_name":"Margin","type":"user"},{"ordinal":46,"canonical_name":"B.CrtYd","type":"user","user_name":"B.Courtyard"},{"ordinal":47,"canonical_name":"F.CrtYd","type":"user","user_name":"F.Courtyard"},{"ordinal":48,"canonical_name":"B.Fab","type":"user"},{"ordinal":49,"canonical_name":"F.Fab","type":"user"},{"ordinal":50,"canonical_name":"User.1","type":"user"},{"ordinal":51,"canonical_name":"User.2","type":"user"},{"ordinal":52,"canonical_name":"User.3","type":"user"},{"ordinal":53,"canonical_name":"User.4","type":"user"},{"ordinal":54,"canonical_name":"User.5","type":"user"},{"ordinal":55,"canonical_name":"User.6","type":"user"},{"ordinal":56,"canonical_name":"User.7","type":"user"},{"ordinal":57,"canonical_name":"User.8","type":"user"},{"ordinal":58,"canonical_name":"User.9","type":"user"}]`,
    );

    public constructor(
        public fileName: string,
        expr: Parseable,
        public override parent: KicadPCB,
    ) {
        super(expr, parent);
        this.fileName = fileName;
        this.at = new At();
    }
}
