import { createBuffer } from "../../graphics/resource";
import shaderCode from "./shader.wgsl?raw";
const main = async () => {
    const canvas = document.querySelector('#mycanvas') as HTMLCanvasElement;
    if (navigator.gpu === undefined) {
        console.error("WebGPU not supported");
        return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    const ctx = canvas.getContext("webgpu") as GPUCanvasContext;
    const device = await adapter.requestDevice() as GPUDevice;
    const swapChainFormat = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
        device: device,
        format: swapChainFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });


    const positions = new Float32Array([
        1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0
    ]);

    const colors = new Float32Array([1.0,
        0.0,
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        0.0,
        1.0
    ]);

    const indicies = new Uint16Array([0, 1, 2]);

    const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);
    const colorBuffer = createBuffer(device, colors, GPUBufferUsage.VERTEX);
    const indexBuffer = createBuffer(device, indicies, GPUBufferUsage.INDEX);

    const shaderModule = device.createShaderModule({
        code: shaderCode
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [] }),
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: [
                {
                    stepMode: "vertex",
                    arrayStride: 3 * 4,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x3"

                        },
                    ]
                },
                {

                    stepMode: "vertex",
                    arrayStride: 3 * 4,
                    attributes: [
                        {
                            shaderLocation: 1,
                            offset: 0,
                            format: "float32x3"
                        }
                    ]

                }
            ]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [
                {
                    format: swapChainFormat,
                    writeMask: GPUColorWrite.ALL
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
        }
    });

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // ctx.configure({
        //     device: device,
        //     format: swapChainFormat,
        // });
    });






    const render = () => {
        const commandEncoder = device.createCommandEncoder();
        const textureView = ctx.getCurrentTexture().createView() as GPUTextureView;

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        };
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, colorBuffer);
        passEncoder.setIndexBuffer(indexBuffer, "uint16");
        passEncoder.drawIndexed(indicies.length, 1, 0, 0, 0);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

export default main;