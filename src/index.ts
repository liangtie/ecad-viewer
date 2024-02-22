/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { KCUIIconElement } from "./kc-ui";
import { sprites_url } from "./kicanvas/icons/sprites";

// // Setup KCUIIconElement to use icon sprites.
KCUIIconElement.sprites_url = sprites_url;

import "./base/livereload";
import "./kc-ui/select";
import "./ecad-viewer/tab_button";

import "./ecad-viewer/tab_header";
import "./ecad-viewer/ecad_viewer";
