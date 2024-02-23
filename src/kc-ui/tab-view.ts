/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../base/web-components";
import { TabMenuVisibleChangeEvent } from "../viewers/base/events";
import { KCUIElement } from "./element";

export interface TabData {
    title: string;
    content: HTMLElement;
}

export class TabView extends KCUIElement {
    #container: HTMLElement;
    #tabs: HTMLElement[] = [];
    #tabContents: HTMLElement[] = [];

    public setHidden(hide: boolean) {
        this.hidden = hide;
        this.dispatchEvent(new TabMenuVisibleChangeEvent(!this.hidden));
    }

    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                position: absolute;
                left: 0;
                height: 100%;
                width: calc(max(20%, 200px));
                top: 0;
                bottom: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                background-color: var(--panel-bg);
            }
            .tab-container {
                display: flex;
                background: var(--panel-title-bg);
                color: var(--panel-title-fg);
                border-top: var(--panel-line);
                width: 100%;
                margin-bottom: 5px;
                border-bottom: var(--panel-line);
            }

            .tab {
                padding: 10px;
                cursor: pointer;
                margin-right: 5px;
            }

            .tab.active {
                border-bottom: 1px solid var(--tab-border-selected);
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }
        `,
    ];

    public constructor(tabData: TabData[]) {
        super();
        this.#container = html` <div
            class="tab-container"></div>` as HTMLElement;

        // Create tabs and tab contents based on the provided data
        tabData.forEach((data, index) => {
            const tab = this.createTab(data.title, index);
            const tabContent = data.content;
            tabContent.classList.add("tab-content");

            this.#tabs.push(tab);
            this.#tabContents.push(tabContent);

            // Append tab and tab content to the container
            this.#container.appendChild(tab);
        });

        if (tabData.length) this.showTab(0);
    }

    private createTab(title: string, index: number): HTMLElement {
        const tab = document.createElement("div");
        tab.classList.add("tab");
        tab.textContent = title;

        // Attach a click event listener to switch tabs
        tab.addEventListener("click", () => {
            this.showTab(index);
        });

        return tab;
    }
    private showTab(index: number): void {
        for (const i of [this.#tabs, this.#tabContents])
            i.forEach((tab) => {
                tab.classList.remove("active");
            });

        if (this.#tabContents[index]) {
            this.#tabContents[index]!.classList.add("active");
            this.#tabs[index]!.classList.add("active");
        }
    }
    override initialContentCallback() {}

    override render() {
        return html` ${this.#container} ${this.#tabContents} `;
    }
}

window.customElements.define("tab-view", TabView);
