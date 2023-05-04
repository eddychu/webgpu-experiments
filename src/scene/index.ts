import { mat4, vec3 } from "gl-matrix";
import Geometry from "../geometry";
import Light, { PointLight } from "../lights";
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

    public get lights(): Array<LightNode> {
        return this.nodes.filter((node) => node.type === SceneNodeType.Light) as Array<LightNode>;
    }

    public get drawables(): Array<MeshNode | InstancedMeshNode> {
        return this.nodes.filter((node) => node.type === SceneNodeType.Mesh || node.type === SceneNodeType.InstancedMesh) as Array<MeshNode | InstancedMeshNode>;
    }
}

enum SceneNodeType {
    InstancedMesh,
    Mesh,
    Light,
    Camera
}


export class SceneNode {
    public type: SceneNodeType;
    public children: SceneNode[] = [];
    public transform: Transform;
    public isDirty: boolean = true;
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

export class InstancedMeshNode extends SceneNode {
    public geometry: Geometry;
    public material: Material;
    public instanceCount: number;
    public instanceTransforms: Transform[] = [];
    constructor(geometry: Geometry, material: Material, instanceCount: number) {
        super(SceneNodeType.InstancedMesh);
        this.geometry = geometry;
        this.material = material;
        this.instanceCount = instanceCount;
    }
}

export class LightNode extends SceneNode {
    public light: Light;
    constructor(light: Light) {
        super(SceneNodeType.Light);
        this.light = light;
        this.transform = Transform.identity();
        this.transform.position = light as PointLight ? (light as PointLight).position : vec3.create();
    }
}

export class CameraNode extends SceneNode {
    public aspectRatio: number;
    public fov: number;
    public near: number;
    public far: number;
    public projectionMatrix: mat4 = mat4.create();
    constructor(eye: vec3, target: vec3, up: vec3, aspectRatio: number, fov: number, near: number, far: number) {
        super(SceneNodeType.Camera);
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
}