import { vec3 } from "gl-matrix";
import Cube from "../../geometry/cube";
import Renderer from "../../graphics/renderer";
import { PhongMaterial } from "../../materials";
import { CameraNode, LightNode, MeshNode } from "../../scene";
import { PointLight } from "../../lights";

const main = async () => {
    const canvas = document.querySelector('#mycanvas') as HTMLCanvasElement;
    if (navigator.gpu === undefined) {
        console.error("WebGPU not supported");
        return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    const device = await adapter.requestDevice() as GPUDevice;

    const renderer = new Renderer(canvas, device);
    const camera = new CameraNode(
        vec3.fromValues(0.0, 0.0, 5.0),
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(0.0, 1.0, 0.0),
        canvas.width / canvas.height,
        Math.PI / 4,
        0.1,
        100.0,
    );
    const cube = new Cube(1.0);
    const material = new PhongMaterial(
        vec3.fromValues(1.0, 0.0, 0.0),
        vec3.fromValues(0.0, 1.0, 0.0),
        32.0
    )
    const mesh = new MeshNode(cube, material);
    const light = new LightNode(
        new PointLight(
            vec3.fromValues(0.0, 0.0, 1.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            1.0)
    )

    const render = () => {
        renderer.render(mesh, light, camera);
        requestAnimationFrame(render);
    }

    render();
}


export default main;