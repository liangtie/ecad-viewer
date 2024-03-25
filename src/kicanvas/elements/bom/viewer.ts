/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { KCUIElement } from "../../../kc-ui";
import { css, html } from "../../../base/web-components";
import "./viewer";
import type { Project } from "../../project";
import { SchematicBomVisitor } from "../../../kicad/schematic_bom_visitor";
import type { BomItem } from "../../../kicad/bom_item";
import { KicadSch } from "../../../kicad";
import { BoardBomItemVisitor } from "../../../kicad/board_bom_visitor";

class ItemsGroupedByFpValueDNP implements BomItem {
    #references: string[] = [];

    public get Price() {
        return 0;
    }

    public get Qty() {
        return this.#references.length;
    }

    public get Reference() {
        return this.#references.filter((i) => i.length).join(",\n");
    }

    public addReference(ref: string) {
        this.#references.push(ref);
    }

    public constructor(
        public Name: string,
        public Datasheet: string,
        public Description: string,
        public Footprint: string,
        public DNP: boolean,
    ) {}
}

export class BomViewer extends KCUIElement {
    #project: Project;
    #bom_items: BomItem[] = [];

    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                margin: 0;
                display: flex;
                position: relative;
                width: 100%;
                max-height: 100%;
                aspect-ratio: 1.414;
                background-color: white;
                color: var(--fg);
                contain: layout paint;
            }

            .vertical {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
            }
            .tab-content {
                height: 100%;
                width: 100%;
                flex: 1;
                display: none;
            }

            .tab-content.active {
                display: inherit;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                table-layout: auto;
            }
            th,
            td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                overflow: hidden;
                word-wrap: break-word;
                color: black;
            }

            th {
                top: 0;
                position: sticky;
                background: #666;
            }

            #summary {
                color: white;
                text-align: right;
                background: #666;
            }
            tr:nth-child(odd) {
                background-color: #f9f9f9; /* Alternative color for odd rows */
            }
            tr:nth-child(even) {
                background-color: #ffffff; /* Background color for even rows */
            }
            ::-webkit-scrollbar {
                position: absolute;
                width: 6px;
                height: 6px;
                margin-left: -6px;
                background: var(--scrollbar-bg);
            }

            ::-webkit-scrollbar-thumb {
                position: absolute;
                background: var(--scrollbar-fg);
            }

            ::-webkit-scrollbar-thumb:hover {
                background: var(--scrollbar-hover-fg);
            }

            ::-webkit-scrollbar-thumb:active {
                background: var(--scrollbar-active-fg);
            }
        `,
    ];

    override connectedCallback() {
        (async () => {
            this.#project = await this.requestContext("project");
            await this.#project.loaded;

            const bom_items = (() => {
                if (this.#project.has_schematics) {
                    const visitor = new SchematicBomVisitor();
                    for (const page of this.#project.pages) {
                        const doc = page.document;
                        if (doc instanceof KicadSch) visitor.visit(doc);
                    }
                    return visitor.bom_list;
                } else if (this.#project.has_boards) {
                    const visitor = new BoardBomItemVisitor();
                    for (const b of this.#project.boards()) visitor.visit(b);

                    return visitor.bom_list;
                }
                return [];
            })();
            this.#sort_bom(bom_items);
            super.connectedCallback();
        })();
    }

    #sort_bom(bom_list: BomItem[]) {
        const grouped_it_map: Map<string, ItemsGroupedByFpValueDNP> = new Map();

        const group_by_fp_value = (itm: BomItem) =>
            `${itm.Footprint}-${itm.Name}-${itm.DNP}`;

        for (const it of bom_list) {
            const key = group_by_fp_value(it);

            if (!grouped_it_map.has(key)) {
                grouped_it_map.set(
                    key,
                    new ItemsGroupedByFpValueDNP(
                        it.Name,
                        it.Datasheet,
                        it.Description,
                        it.Footprint,
                        it.DNP,
                    ),
                );
            }
            grouped_it_map.get(key)!.addReference(it.Reference);
        }
        this.#bom_items = Array.from(grouped_it_map.values());
    }

    override initialContentCallback() {}
    generateBomItemHtml(bomItem: BomItem, index: number) {
        return html`
            <tr>
                <td>${index}</td>
                <td>${bomItem.Name}</td>
                <td>N/A</td>
                <td>${bomItem.Description}</td>
                <td>${bomItem.Footprint}</td>
                <td>${bomItem.Reference}</td>
                <td>${bomItem.Qty}</td>
            </tr>
        `;
    }
    override render() {
        const table = html`<table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Footprint</th>
                    <th>Designator</th>
                    <th>Quantity</th>
                </tr>
            </thead>
        </table>`;

        const body = html`<tbody id="bomItemsBody"></tbody>`;

        let total_cp = 0;
        for (let i = 0; i < this.#bom_items.length; i++) {
            const it = this.#bom_items[i]!;
            body.appendChild(this.generateBomItemHtml(it, i + 1));
            total_cp += it.Qty;
        }

        table.appendChild(body);
        const headerCells = table.querySelectorAll("th");
        const bodyCells = table.querySelectorAll("td");

        headerCells.forEach((cell, index) => {
            const headerWidth = cell.getBoundingClientRect().width;
            const bodyWidth = bodyCells[index]!.getBoundingClientRect().width;
            const maxWidth = Math.max(headerWidth, bodyWidth);
            cell.style.width = maxWidth + "px";
        });
        return html`
            <!-- <kc-ui-panel-title title="Nets"></kc-ui-panel-title> -->
            <div class="vertical">
                <kc-ui-panel-body> ${table} </kc-ui-panel-body>
                <p id="summary">Total: ${total_cp} Price: N/A</p>
            </div>
        `;
    }
}

window.customElements.define("bom-viewer", BomViewer);
