import { vec3 } from "gl-matrix";

export default class Material {
}

export class PhongMaterial extends Material {
    public diffuse: vec3;
    public specular: vec3;
    public shininess: number;
    constructor(diffuse: vec3, specular: vec3, shininess: number) {
        super();
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
    }

    public toFloat32Array(): Float32Array {
        return new Float32Array([...this.diffuse, 0.0, ...this.specular, 0.0, this.shininess, 0.0, 0.0, 0.0]);
    }
}
