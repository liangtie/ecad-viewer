/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { attribute, css, html } from "../base/web-components";
import { KCUIElement } from "../kc-ui/element";
import { TabMenuClickEvent, TabActivateEvent } from "../viewers/base/events";
import { Sections, TabKind } from "./constraint";
import type { InputContainer } from "./input_container";

export interface TabData {
    title: string;
    content: HTMLElement;
}

export class TabHeaderElement extends KCUIElement {
    #elements: Map<Sections, Map<TabKind, HTMLElement>>;
    #current_tab?: TabKind;
    #open_file_btn = html` <tab-button
        icon="svg:open_file"
        class="end"
        title="Open local file">
    </tab-button>` as HTMLElement;

    public set tabMenuChecked(activate: boolean) {
        this.#elements
            .get(Sections.beginning)!
            .get(this.#current_tab!)
            ?.classList.toggle("checked", activate);
    }

    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                height: 2em;
                width: 100%;
                flex: 1;
                display: flex;
                background-color: var(--panel-bg);
            }
            .horizontal-bar {
                display: flex;
                height: 100%;
                width: 100%;

                background-color: transparent;
                overflow: hidden;
            }

            .bar-section {
                height: 100%;
                flex: 1;
            }

            .beginning {
                background-color: var(--panel-bg);
                display: flex;
                align-items: left;
                justify-content: left;
            }

            .middle {
                background-color: var(--panel-bg);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .end {
                background-color: var(--panel-bg);
                display: flex;
                align-items: right;
                justify-content: right;
            }

            .menu {
                display: none;
            }

            .menu.active {
                display: block;
            }

            tab-button.tab {
                height: 100%;
                border: none;
                width: 48px;
            }

            tab-button.beginning {
                height: 100%;
                min-width: 120px;
                display: none;
            }

            tab-button.end {
                height: 100%;
                width: 32px;
            }

            tab-button.beginning.active {
                height: 100%;
                display: block;
            }
        `,
    ];

    @attribute({ type: Boolean })
    has_pcb: boolean = true;

    @attribute({ type: Boolean })
    has_sch: boolean = true;

    @attribute({ type: Boolean })
    has_step: boolean = true;

    @attribute({ type: Boolean })
    has_bom: boolean = true;

    public set input_container(input_container: InputContainer) {
        this.#open_file_btn.addEventListener("click", () => {
            input_container.input.click();
        });
        input_container.input.addEventListener("change", (e) => {
            const file = (e.target! as any).files[0];
            if (file) {
                const fn = file.name as string;
                if (!fn.endsWith(".kicad_pcb")) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target!.result;
                    const parent = input_container.target.parentElement;
                    if (parent) {
                        parent.removeChild(input_container.target);
                        parent.appendChild(
                            html`<ecad-viewer>
                                <ecad-blob
                                    filename="${fn}"
                                    content="${fileContent}"></ecad-blob>
                            </ecad-viewer>`,
                        );
                    }
                };

                reader.readAsText(file);
            }
        });
    }

    private createSection(sectionClass: Sections): HTMLDivElement {
        const section = document.createElement("div");
        section.classList.add("bar-section", sectionClass);

        const make_middle = (kind: TabKind) => {
            const btn = html` <tab-button>${kind}</tab-button> ` as HTMLElement;
            btn.classList.add("tab");
            this.#elements.get(sectionClass)?.set(kind, btn);
            return btn;
        };

        const make_beginning = (kind: TabKind) => {
            const icon_map = {
                [TabKind.pcb]: "svg:layers",
                [TabKind.sch]: "svg:page",
                [TabKind.step]: "svg:layers",
                [TabKind.bom]: "svg:layers",
            };

            const icon = html` <tab-button icon="${icon_map[kind]}">
                ${kind}
            </tab-button>` as HTMLElement;
            icon.classList.add("beginning");
            this.#elements.get(sectionClass)?.set(kind, icon);
            return icon;
        };

        switch (sectionClass) {
            case Sections.beginning:
                {
                    if (this.has_pcb)
                        section.appendChild(make_beginning(TabKind.pcb));
                    if (this.has_sch)
                        section.appendChild(make_beginning(TabKind.sch));
                    if (this.has_step)
                        section.appendChild(make_beginning(TabKind.step));
                    if (this.has_bom)
                        section.appendChild(make_beginning(TabKind.bom));
                }
                break;
            case Sections.middle:
                {
                    if (this.has_pcb)
                        section.appendChild(make_middle(TabKind.pcb));
                    if (this.has_sch)
                        section.appendChild(make_middle(TabKind.sch));
                    if (this.has_step)
                        section.appendChild(make_middle(TabKind.step));
                    if (this.has_bom)
                        section.appendChild(make_middle(TabKind.bom));
                }
                break;
            case Sections.end:
                {
                    const download = html` <tab-button
                        title="Download"
                        icon="svg:download"
                        class="end">
                    </tab-button>` as HTMLElement;

                    const full_screen = html` <tab-button
                        title="Switch full screen mode"
                        icon="svg:full_screen"
                        class="end">
                    </tab-button>` as HTMLElement;

                    section.appendChild(this.#open_file_btn);
                    section.appendChild(download);
                    section.appendChild(full_screen);
                }
                break;
        }

        return section;
    }

    override renderedCallback(): void | undefined {
        if (this.#elements.size) {
            if (this.has_pcb) {
                this.activateTab(TabKind.pcb);
            } else if (this.has_sch) {
                this.activateTab(TabKind.sch);
            } else if (this.has_step) {
                this.activateTab(TabKind.step);
            } else if (this.has_bom) {
                this.activateTab(TabKind.bom);
            }
        }
    }

    private activateTab(kind: TabKind) {
        if (this.#current_tab === kind) return;

        for (const [section, elements] of this.#elements) {
            switch (section) {
                case Sections.beginning:
                    {
                        for (const [k, v] of elements) {
                            if (k === kind) v.classList.add("active");
                            else v.classList.remove("active");
                        }
                    }
                    break;
                case Sections.middle:
                    {
                        for (const [k, v] of elements) {
                            if (k === kind) v.classList.add("checked");
                            else v.classList.remove("checked");
                        }
                    }
                    break;
            }
        }

        this.dispatchEvent(
            new TabActivateEvent({
                previous: this.#current_tab,
                current: kind,
            }),
        );
        this.#current_tab = kind;
    }

    on_menu_closed() {
        const mene = this.#elements.get(Sections.beginning);
        if (mene) {
            for (const [, v] of mene) {
                v.classList.remove("active");
            }
        }
    }

    override initialContentCallback(): void {
        super.initialContentCallback();
        this.#elements.forEach((section, sectionClass) => {
            section.forEach((element, kind) => {
                switch (sectionClass) {
                    case Sections.beginning:
                        {
                            element.addEventListener("click", () => {
                                for (const [, v] of section) {
                                    v.classList.remove("checked");
                                }
                                element.classList.add("checked");
                                this.dispatchEvent(new TabMenuClickEvent(kind));
                            });
                        }
                        break;
                    case Sections.middle: {
                        element.addEventListener("click", () => {
                            this.activateTab(kind);
                        });
                        break;
                    }
                }
            });
        });
    }

    override render() {
        this.#elements = new Map();
        // Create the container for the header
        const container = html`<div class="horizontal-bar"></div>`;
        for (const v of Object.values(Sections)) {
            this.#elements.set(v, new Map());
            container.appendChild(this.createSection(v));
        }

        return html` ${container} `;
    }
}

window.customElements.define("tab-header", TabHeaderElement);
