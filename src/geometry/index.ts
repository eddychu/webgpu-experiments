
export default class Geometry {
    public positions: Float32Array;
    public indices: Uint16Array;
    public normals?: Float32Array;
    public texCoords?: Float32Array;
    constructor(positions: Float32Array, indices: Uint16Array, normals?: Float32Array, texCoords?: Float32Array) {
        this.positions = positions;
        this.indices = indices;
        this.normals = normals;
        this.texCoords = texCoords;
    }
}