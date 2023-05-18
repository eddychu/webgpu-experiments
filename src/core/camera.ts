import { mat4, vec3 } from "gl-matrix";
import Transform from "./transform";

export default class Camera {
    public aspectRatio: number;
    public fov: number;
    public near: number;
    public far: number;
    public projectionMatrix: mat4 = mat4.create();
    public transform: Transform;
    constructor(eye: vec3, target: vec3, up: vec3, aspectRatio: number, fov: number, near: number, far: number) {
        this.transform = Transform.lookAt(eye, target, up);
        this.aspectRatio = aspectRatio;
        this.fov = fov;
        this.near = near;
        this.far = far;
        mat4.perspective(this.projectionMatrix, fov, aspectRatio, near, far);
    }

    public setAspectRatio(value: number) {
        this.aspectRatio = value;
        mat4.perspective(this.projectionMatrix, this.fov, this.aspectRatio, this.near, this.far);
    }

};