import Transform from "./transform";


export default class SceneNode {
    public children: SceneNode[] = [];
    public parent: SceneNode | null = null;
    public transform: Transform;
    public isDirty: boolean = true;
    constructor() {
        this.transform = Transform.identity();
    }
};