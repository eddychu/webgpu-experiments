import { mat4, vec3 } from "gl-matrix";
import Geometry from "../geometry";
import Light from "../lights";
import Material from "../materials";
import Transform from "./transform";

export default class Scene {
    public camera?: CameraNode;
    public nodes: SceneNode[] = [];
    constructor(camera?: CameraNode) {
        this.camera = camera;
    }

    public addNode(node: SceneNode): void {
        this.nodes.push(node);
    }

    public get lights(): LightNode[] {
        return this.getNodesOfType<LightNode>(SceneNodeType.Light);
    }

    public get meshes(): MeshNode[] {
        return this.getNodesOfType<MeshNode>(SceneNodeType.Mesh);
    }

    public getNodesOfType<T extends SceneNode>(type: SceneNodeType): T[] {
        const children = this.nodes;
        const res: T[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.type === type) {
                res.push(child as T);
            }
        }
        return res;
    }
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
    constructor(eye: vec3, target: vec3, up: vec3, aspectRatio: number, fov: number, near: number, far: number) {
        super(SceneNodeType.Camera);
        this.transform = Transform.lookAt(eye, target, up);
        this.aspectRatio = aspectRatio;
        this.fov = fov;
        this.near = near;
        this.far = far;
    }

    public perspective(out: mat4): mat4 {
        return mat4.perspective(out, this.fov, this.aspectRatio, this.near, this.far);
    }
}