import Geometry from ".";



export default class Cube extends Geometry {
    constructor(size: number) {
        const side2 = size / 2;
        const positions = new Float32Array([
            // Front
            -side2, -side2, side2, side2, -side2, side2, side2, side2, side2, -side2, side2, side2,
            // Right
            side2, -side2, side2, side2, -side2, -side2, side2, side2, -side2, side2, side2, side2,
            // Back
            -side2, -side2, -side2, -side2, side2, -side2, side2, side2, -side2, side2, -side2, -side2,
            // Left
            -side2, -side2, side2, -side2, side2, side2, -side2, side2, -side2, -side2, -side2, -side2,
            // Bottom
            -side2, -side2, side2, -side2, -side2, -side2, side2, -side2, -side2, side2, -side2, side2,
            // Top
            -side2, side2, side2, side2, side2, side2, side2, side2, -side2, -side2, side2, -side2
        ]);

        const normals = new Float32Array([
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0
        ]);
        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ]);

        const uvs = new Float32Array([
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Back
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ]);
        super(positions, indices, normals, uvs);
    }
}