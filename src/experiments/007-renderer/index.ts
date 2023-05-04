import { vec3 } from "gl-matrix";
import Cube from "../../geometry/cube";
import Renderer from "../../graphics/renderer";
import { PhongMaterial } from "../../materials";
import Scene, { CameraNode, LightNode, MeshNode } from "../../scene";
import { PointLight } from "../../lights";
import Transform from "../../scene/transform";

const main = async () => {
    const canvas = document.querySelector('#mycanvas') as HTMLCanvasElement;
    if (navigator.gpu === undefined) {
        console.error("WebGPU not supported");
        return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        scene.camera?.setAspectRatio(canvas.width / canvas.height);
        renderer.resize(canvas.width, canvas.height);
    })

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

    const light = new LightNode(
        new PointLight(
            vec3.fromValues(0.0, 0.0, 1.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            1.0)
    )

    const scene = new Scene();
    scene.camera = camera;
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 5; j++) {
            const newMesh = new MeshNode(cube, material);
            const newTransform = Transform.translate(vec3.fromValues(i - 5, j - 2, 0.0));
            newTransform.scale = vec3.fromValues(0.5, 0.5, 0.5);
            newMesh.transform = newTransform;
            scene.addNode(newMesh);
        }
    }


    scene.addNode(light);


    const render = () => {
        renderer.render(scene);
        requestAnimationFrame(render);
    }

    render();
}


export default main;