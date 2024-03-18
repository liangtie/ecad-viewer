/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { KCUIElement } from "../../../kc-ui";
import { css, html } from "../../../base/web-components";
export class BomApp extends KCUIElement {
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
        `,
    ];

    override render() {
        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Help"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <p>
                        You're using
                        <a href="https://kicanvas.org/home">KiCanvas</a>, an
                        interactive, browser-based viewer for KiCAD schematics
                        and boards.
                    </p>
                    <p>
                        KiCanvas is very much in <strong>alpha</strong>, so
                        please
                        <a
                            href="https://github.com/theacodes/kicanvas/issues/new/choose"
                            target="_blank"
                            >file an issue on GitHub</a
                        >
                        if you run into any bugs.
                    </p>
                    <p>
                        KiCanvas is developed by
                        <a href="https://thea.codes" target="_blank"
                            >Thea Flowers</a
                        >
                        and supported by
                        <a
                            href="https://github.com/sponsors/theacodes"
                            target="_blank"
                            >community donations</a
                        >.
                    </p></kc-ui-panel-body
                >
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("bom-app", BomApp);
