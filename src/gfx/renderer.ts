/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { BBox } from "../math/bbox.js";
import { Matrix3 } from "../math/matrix3.js";
import { Vec2 } from "../math/vec2.js";
import { Color } from "./color.js";
import { TextShaper } from "./text.js";
import { Circle, Polyline, Polygon, Arc } from "./primitives.js";

/**
 * KiCanvas' abstraction over various graphics backends.
 *
 * In general, KiCanvas uses a retained-mode rendering system. That is,
 * drawing commands are issued to the renderer by a "painter" and the renderer
 * does not immediately draw the specified graphics. Instead, the renderer will
 * compile all of the drawing commands together into a "layer". These layers
 * can be actually rendered later.
 *
 * This approach gives us a hell of a lot of speed in exchange for some memory
 * usage. All of the complex logic to turn schematic or board objects into
 * graphics primitives is done just once before anything is actually rendered.
 * After that, KiCanvas can easily re-draw everything with different
 * transformations, visibilities, and orders without having to re-calculate
 * everything.
 *
 */
export abstract class Renderer {
    #object_points: Vec2[] = null;

    canvas: HTMLCanvasElement;
    state: RenderStateStack = new RenderStateStack();
    text_shaper: TextShaper;
    theme: Record<string, Color>;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async setup() {
        if (!this.text_shaper) {
            this.text_shaper = await TextShaper.default();
        }
    }

    get background_color(): Color {
        return this.theme?.background ?? new Color(0, 0, 0, 1);
    }

    /**
     * Update the canvas and context with the new size. Should be called whenever the size
     * of the underlying canvas element changes.
     */
    abstract set_viewport(x: number, y: number, w: number, h: number): void;

    /**
     * Clear the canvas. Typically called at the start of a frame.
     */
    abstract clear_canvas(): void;

    /**
     * Mark the start of a new object.
     *
     * This is used to track bounding boxes of drawn objects.
     */
    start_object(): void {
        this.#object_points = [];
    }

    /**
     * Add points to the current object.
     */
    add_object_points(pts: Iterable<Vec2>) {
        this.#object_points?.push(...pts);
    }

    /**
     * Mark the end of an object.
     * @returns the drawn object's bounding box
     */
    end_object(): BBox {
        if (this.#object_points == null) {
            throw new Error("No current object");
        }

        const bbox = BBox.from_points(this.#object_points);
        this.#object_points = null;
        return bbox;
    }

    /**
     * Start a new layer of graphics.
     *
     * Each layer represents a set of primitives
     * that are all drawn at the same time and at the same depth. end_layer()
     * must be called for the graphics to actually show up.
     */
    abstract start_layer(name: string, depth: number): void;

    /**
     * Finish a layer of graphics.
     *
     * Performs any additional work needed such as tesselation and buffer
     * management.
     */
    abstract end_layer(): RenderLayer;

    /**
     * Iterate through layers.
     */
    abstract get layers(): Iterable<RenderLayer>;

    /**
     * Draw a filled circle
     */
    circle(circle: Circle) {
        if (circle.color == null || (circle.color as Color)?.is_transparent) {
            circle.color = this.state.fill;
        }

        if (!circle.color) {
            return;
        }

        circle.center = this.state.matrix.transform(circle.center);

        const radial = new Vec2(circle.radius, circle.radius);
        this.add_object_points([
            circle.center.add(radial),
            circle.center.sub(radial),
        ]);
    }

    /**
     * Draw a stroked arc
     */
    arc(arc: Arc) {
        if (arc.color == null || (arc.color as Color)?.is_transparent) {
            arc.color = this.state.stroke;
        }

        if (!arc.color) {
            return;
        }

        arc.center = this.state.matrix.transform(arc.center);

        // TODO: Use arc start/mid/end instead of just the whole circle
        const radial = new Vec2(arc.radius, arc.radius);
        this.add_object_points([
            arc.center.add(radial),
            arc.center.sub(radial),
        ]);
    }

    /**
     * Draw a stroked polyline
     */
    line(line: Polyline) {
        if (line.color == null || (line.color as Color)?.is_transparent) {
            line.color = this.state.stroke;
        }

        if (!line.color) {
            return;
        }

        line.points = Array.from(this.state.matrix.transform_all(line.points));

        // TODO: take width into account?
        this.add_object_points(line.points);
    }

    /**
     * Draw a filled polygon
     */
    polygon(polygon: Polygon) {
        if (polygon.color == null || (polygon.color as Color)?.is_transparent) {
            polygon.color = this.state.fill;
        }

        if (!polygon.color) {
            return;
        }

        polygon.points = Array.from(
            this.state.matrix.transform_all(polygon.points)
        );

        this.add_object_points(polygon.points);
    }
}

export abstract class RenderLayer {
    constructor(
        public readonly renderer: Renderer,
        public readonly name: string,
        public readonly depth: number = 0
    ) {
        if (depth < 0 || depth > 1) {
            throw new Error(
                `Invalid depth value ${depth}, depth should be between 0 and 1.`
            );
        }
    }

    abstract clear(): void;

    abstract draw(camera: Matrix3): void;
}

export class RenderState {
    constructor(
        public matrix: Matrix3 = Matrix3.identity(),
        public fill: Color = Color.black,
        public stroke: Color = Color.black,
        public stroke_width: number = 0
    ) {}

    copy() {
        return new RenderState(
            this.matrix.copy(),
            this.fill?.copy(),
            this.stroke?.copy(),
            this.stroke_width
        );
    }
}

export class RenderStateStack {
    #stack: RenderState[];

    constructor() {
        this.#stack = [new RenderState()];
    }

    get top() {
        return this.#stack.at(-1);
    }

    /**
     * @returns the current transformation matrix
     */
    get matrix(): Matrix3 {
        return this.top.matrix;
    }

    /**
     * Set the transformation matrix stack.
     */
    set matrix(mat: Matrix3) {
        this.top.matrix = mat;
    }

    get stroke(): Color {
        return this.top.stroke;
    }

    set stroke(c: Color) {
        this.top.stroke = c;
    }

    get fill(): Color {
        return this.top.fill;
    }

    set fill(c: Color) {
        this.top.fill = c;
    }

    get stroke_width(): number {
        return this.top.stroke_width;
    }

    set stroke_width(n: number) {
        this.top.stroke_width = n;
    }

    /**
     * Multiply the current matrix with the given one
     */
    multiply(mat: Matrix3) {
        this.top.matrix.multiply_self(mat);
    }

    /**
     * Save the current state to the stack.
     */
    push() {
        this.#stack.push(this.top.copy());
    }

    /**
     * Pop the current transformation matrix off the stack and restore the
     * previous one.
     */
    pop() {
        this.#stack.pop();
    }
}