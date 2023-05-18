import Geometry from "../geometry";
import Material from "../materials";

export default class Primitive {
    public geometry: Geometry;
    public material: Material;
    constructor(geometry: Geometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }
};