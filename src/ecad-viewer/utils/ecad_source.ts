import { CustomElement } from "../../base/web-components/custom-element";
import { attribute } from "../../base/web-components/decorators";

export class ECadSource extends CustomElement {
    constructor() {
        super();
        this.ariaHidden = "true";
        this.hidden = true;
        this.style.display = "none";
    }

    @attribute({ type: String })
    src: string | null;
}

window.customElements.define("ecad-source", ECadSource);
