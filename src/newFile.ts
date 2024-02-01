import * as OV from "online-3d-viewer";

export function initOV() {
    window.addEventListener("load", () => {
        // set the location of the external libraries
        OV.SetExternalLibLocation("../libs");

        // get the parent element of the viewer
        const parentDiv = document.getElementById("viewer")!;

        // initialize the viewer with the parent element and some parameters
        const viewer = new OV.EmbeddedViewer(parentDiv, {
            camera: new OV.Camera(
                new OV.Coord3D(-1.5, 2, 3),
                new OV.Coord3D(0, 0, 0),
                new OV.Coord3D(0, 1, 0),
                45,
            ),
            backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
            defaultColor: new OV.RGBColor(200, 200, 200),
            edgeSettings: new OV.EdgeSettings(
                false,
                new OV.RGBColor(0, 0, 0),
                1,
            ),
        });

        // load a model providing model urls
        viewer.LoadModelFromUrlList(["vrml/DIP-8_W8.89mm_SMDSocket.wrl"]);
    });
}
initOV();
