import Geometry from ".";

export default class Plane extends Geometry {
    constructor(size: number) {
        const positions = new Float32Array([
            -size, 0.0, -size,
            -size, 0.0, size,
            size, 0.0, size,
            size, 0.0, -size,
        ]);
        const normals = new Float32Array([
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
        ]);
        const uvs = new Float32Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ]);

        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        super(positions, indices, normals, uvs);
    }
}