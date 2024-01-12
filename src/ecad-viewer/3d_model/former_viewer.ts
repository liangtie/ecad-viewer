import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLLoader } from "./kicad_vrml_loader";

class VRMLViewer {
    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loader: VRMLLoader;

    public constructor() {}


    public make_view(){
        
    }
}
