import Geometry from ".";

export default class BundleGeometry extends Geometry {
    constructor(geometries: Geometry[]) {
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        let offset = 0;
        for (const geometry of geometries) {
            positions.push(...geometry.positions);
            normals.push(...geometry.normals as Float32Array);
            uvs.push(...geometry.texCoords as Float32Array);
            indices.push(...geometry.indices.map((i) => i + offset));
            offset += geometry.positions.length / 3;
        }

        super(
            new Float32Array(positions),
            new Uint16Array(indices),
            new Float32Array(normals),
            new Float32Array(uvs),
        );
    }
}