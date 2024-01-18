/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { attribute, css, html, query } from "../base/web-components";
import { KCUIElement } from "./element";

/**
 * kc-ui-button wraps the <button> element with common styles and behaviors
 */
export class KCUISelectElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                display: inline-flex;
                position: relative;
                width: auto;
                cursor: pointer;
                user-select: none;
                align-items: center;
                justify-content: center;
            }
        `,
    ];

    @query("select", true)
    public select!: HTMLSelectElement;

    @attribute({ type: String })
    name: string | null;

    @attribute({ type: String })
    icon: string | null;

    @attribute({ type: Boolean })
    disabled: boolean;

    @attribute({ type: Boolean })
    selected: boolean;

    static get observedAttributes() {
        return ["disabled", "icon"];
    }

    attributeChangedCallback(
        name: string,
        old: string | null,
        value: string | null,
    ) {
        if (!this.select) {
            return;
        }
        switch (name) {
            case "disabled":
                this.select.disabled = value == null ? false : true;
                break;
        }
    }

    override initialContentCallback() {}

    override render() {
        return html`<select class="alter_src_selections"></select>`;
    }

    public addSelections(ss: string[]) {
        for (const s of ss)
            this.select.appendChild(html`<option value=${s}>${s}</option>`);
    }
}

window.customElements.define("kc-ui-select", KCUISelectElement);
