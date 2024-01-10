/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import "./base/livereload";
import "./kicanvas/elements/kicanvas-shell";
import "./kicanvas/elements/kicanvas-embed";
import { init, animate } from "./ecad-viewer/3d_model/VRML_viewer";

init();
animate();
