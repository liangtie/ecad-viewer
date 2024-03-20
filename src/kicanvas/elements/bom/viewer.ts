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

class ItemsGroupedByFpValueDNP implements BomItem {
    #references: string[] = [];

    public get Qty() {
        return this.#references.length;
    }

    public get Reference() {
        return this.#references.join("\n");
    }

    public addReference(ref: string) {
        this.#references.push(ref);
    }

    public constructor(
        public Value: string,
        public Datasheet: string,
        public Footprint: string,
        public DNP: boolean,
    ) {}
}
function generateBomItemHtml(bomItem: BomItem) {
    return html`
        <tr>
            <td>${bomItem.Reference}</td>
            <td>${bomItem.Value}</td>
            <td>
                <a href="${bomItem.Datasheet}" target="_blank"
                    >${bomItem.Datasheet}</a
                >
            </td>
            <td>${bomItem.Footprint}</td>
            <td>${bomItem.DNP ? "Yes" : "No"}</td>
            <td>${bomItem.Qty}</td>
        </tr>
    `;
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
                overflow: hidden;
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

            if (this.#project.has_schematics) {
                const visitor = new SchematicBomVisitor();
                for (const page of this.#project.pages) {
                    const doc = page.document;
                    if (doc instanceof KicadSch) visitor.visit(doc);
                }
                const grouped_it_map: Map<string, ItemsGroupedByFpValueDNP> =
                    new Map();

                const group_by_fp_value = (itm: BomItem) =>
                    `${itm.Footprint}-${itm.Value}-${itm.DNP}`;

                for (const it of visitor.bom_list) {
                    const key = group_by_fp_value(it);

                    if (!grouped_it_map.has(key)) {
                        grouped_it_map.set(
                            key,
                            new ItemsGroupedByFpValueDNP(
                                it.Value,
                                it.Datasheet,
                                it.Footprint,
                                it.DNP,
                            ),
                        );
                    }
                    grouped_it_map.get(key)!.addReference(it.Reference);
                }
                this.#bom_items = Array.from(grouped_it_map.values());
            }

            super.connectedCallback();
        })();
    }

    override initialContentCallback() {}

    override render() {
        const table = html`<table>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Value</th>
                    <th>Datasheet</th>
                    <th>Footprint</th>
                    <th>DNP</th>
                    <th>Quantity</th>
                </tr>
            </thead>
        </table>`;

        const body = html`<tbody id="bomItemsBody"></tbody>`;

        for (const it of this.#bom_items) {
            body.appendChild(generateBomItemHtml(it));
        }

        table.appendChild(body);
        const headerCells = table.querySelectorAll("th");
        const bodyCells = table.querySelectorAll("td");

        headerCells.forEach((cell, index) => {
            const headerWidth = cell.getBoundingClientRect().width;
            const bodyWidth = bodyCells[index].getBoundingClientRect().width;
            const maxWidth = Math.max(headerWidth, bodyWidth);
            cell.style.width = maxWidth + "px";
        });
        return html`
            <kc-ui-panel>
                <!-- <kc-ui-panel-title title="Nets"></kc-ui-panel-title> -->
                <kc-ui-panel-body> ${table} </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("bom-viewer", BomViewer);
