import { Vec2 } from "../../base/math";

// Bezier curve calculation function
function bezier(t: number, p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): Vec2 {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    return new Vec2(x, y);
}

// Calculate bounding box of Bezier curve
export function calculateBoundingBox(
    p0: Vec2,
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
): { minX: number; minY: number; maxX: number; maxY: number } {
    const numSamples = 100; // Adjust this based on your requirements

    let minX = Infinity,
        minY = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity;

    for (let i = 0; i <= numSamples; ++i) {
        const t = i / numSamples;
        const point = bezier(t, p0, p1, p2, p3);

        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return { minX, minY, maxX, maxY };
}
