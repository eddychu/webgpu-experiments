import { vec3 } from "gl-matrix";

export default class Light {

}

export class PointLight extends Light {
    public position: vec3;
    public color: vec3
    public intensity: number = 1.0;
    constructor(position: vec3, color: vec3, intensity: number) {
        super();
        this.position = position;
        this.color = color;
        this.intensity = intensity;
    }

    public toFloat32Array(): Float32Array {
        return new Float32Array([...this.position, 0.0, ...this.color, 0.0, this.intensity, 0.0, 0.0, 0.0]);
    }
}