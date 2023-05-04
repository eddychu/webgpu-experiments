import { vec3 } from "gl-matrix";
import Cube from "../../geometry/cube";
import Renderer from "../../graphics/renderer";
import { PhongMaterial } from "../../materials";
import { CameraNode, LightNode, MeshNode } from "../../scene";
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


    let mouseHeld = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseDeltaX = 0;
    let mouseDeltaY = 0;

    canvas.addEventListener("mousedown", (event) => {
        event.button == 0 && (mouseHeld = true);
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    })

    canvas.addEventListener("mouseup", (event) => {
        event.button == 0 && (mouseHeld = false);
    })

    canvas.addEventListener("mousemove", (event) => {
        if (mouseHeld) {
            let dist_vec = vec3.sub(vec3.create(), camera.transform.position, vec3.fromValues(0.0, 0.0, 0.0));
            let radius = vec3.length(dist_vec);
            let theta = 0.0;
            let phi = 0.0;
            if (Math.abs(radius) > 0.001) {
                theta = Math.atan2(dist_vec[0], dist_vec[2]);
                let v = Math.min(Math.max(dist_vec[1] / radius, -1.0), 1.0);
                phi = Math.acos(v);
            }

            mouseDeltaX -= (event.clientX - lastMouseX) * Math.PI * 2.0 / canvas.height;
            mouseDeltaY -= (event.clientY - lastMouseY) * Math.PI * 2.0 / canvas.height;

            theta += mouseDeltaX;
            phi += mouseDeltaY;

            if (phi > Math.PI - 0.001) {
                phi = Math.PI - 0.001;
            }
            if (phi < 0.001) {
                phi = 0.001;
            }
            let sinPhiRadius = Math.sin(phi) * radius;
            let new_x = sinPhiRadius * Math.sin(theta);
            let new_y = Math.cos(phi) * radius;
            let new_z = sinPhiRadius * Math.cos(theta);

            const newPosition = vec3.fromValues(new_x, new_y, new_z);
            const newTransform = Transform.lookAt(newPosition, vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
            camera.transform = newTransform;
            camera.isDirty = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            mouseDeltaX = 0.0;
            mouseDeltaY = 0.0;
        }
    });



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