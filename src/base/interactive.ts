import type { DocumentPainter } from "../viewers/base/painter";
import type { Vec2 } from "./math";

export interface Interactive {
    contains(pos: Vec2): boolean;
    highlight(painter: DocumentPainter): void;
    select(): void;
}
