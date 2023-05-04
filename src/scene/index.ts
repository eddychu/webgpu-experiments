import { mat4, vec3 } from "gl-matrix";
import Geometry from "../geometry";
import Light from "../lights";
import Material from "../materials";
import Transform from "./transform";

export default class Scene {
}

enum SceneNodeType {
    Mesh,
    Light,
    Camera
}


export class SceneNode {
    public type: SceneNodeType;
    public children: SceneNode[] = [];
    public transform: Transform;
    constructor(type: SceneNodeType) {
        this.type = type;
        this.transform = Transform.identity();
    }
}

export class MeshNode extends SceneNode {
    public geometry: Geometry;
    public material: Material;
    constructor(geometry: Geometry, material: Material) {
        super(SceneNodeType.Mesh);
        this.geometry = geometry;
        this.material = material;
    }
}

export class LightNode extends SceneNode {
    public light: Light;
    constructor(light: Light) {
        super(SceneNodeType.Light);
        this.light = light;
    }
}

export class CameraNode extends SceneNode {
    public aspectRatio: number;
    public fov: number;
    public near: number;
    public far: number;
    constructor(aspectRatio: number, fov: number, near: number, far: number) {
        super(SceneNodeType.Camera);
        this.aspectRatio = aspectRatio;
        this.fov = fov;
        this.near = near;
        this.far = far;
    }

    public lookAt(center: vec3, out: mat4): mat4 {
        return mat4.lookAt(out, this.transform.position, center, this.transform.up);
    }

    public perspective(out: mat4): mat4 {
        return mat4.perspective(out, this.fov, this.aspectRatio, this.near, this.far);
    }
}