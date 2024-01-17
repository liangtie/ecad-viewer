/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

// import { later } from "../../base/async";
// import { DropTarget } from "../../base/dom/drag-drop";
// import { CSS, attribute, html, query } from "../../base/web-components";
import { KCUIElement, KCUIIconElement } from "../../kc-ui";
import { sprites_url } from "../icons/sprites";
// import { Project } from "../project";
// import { GitHub } from "../services/github";
// import { GitHubFileSystem } from "../services/github-vfs";
// import { FetchFileSystem, type VirtualFileSystem } from "../services/vfs";
import { KCBoardAppElement } from "./kc-board/app";
import { KCSchematicAppElement } from "./kc-schematic/app";

// import kc_ui_styles from "../../kc-ui/kc-ui.css";
// import shell_styles from "./kicanvas-shell.css";

// import "../icons/sprites";
// import "./common/project-panel";

// // Setup KCUIIconElement to use icon sprites.
KCUIIconElement.sprites_url = sprites_url;
