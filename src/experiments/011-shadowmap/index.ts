import { mat3, mat4, vec3 } from "gl-matrix";
import Cube from "../../geometry/cube";
import { createBuffer } from "../../graphics/resource";
import shaderCode from "./shader.wgsl?raw";
import Plane from "../../geometry/plane";
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

    const cube = new Cube(1.0);
    const plane = new Plane(10.0);

    const positionBuffer = createBuffer(device, cube.positions, GPUBufferUsage.VERTEX);
    const normalBuffer = createBuffer(device, cube.normals as Float32Array, GPUBufferUsage.VERTEX);
    const texCoordsBuffer = createBuffer(device, cube.texCoords as Float32Array, GPUBufferUsage.VERTEX);

    const indexBuffer = createBuffer(device, cube.indices, GPUBufferUsage.INDEX);

    let view_matrix = mat4.lookAt(mat4.create(), [0, 0, 5], [0, 0, 0], [0, 1, 0]);
    let projection_matrix = mat4.perspective(mat4.create(), Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    let view_proj = mat4.multiply(mat4.create(), projection_matrix, view_matrix);
    let model = mat4.create();
    let normalMatrix = mat4.create();
    const viewProjUniformBuffer = device.createBuffer({
        size: 4 * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const modelUniformBuffer = device.createBuffer({
        size: 4 * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const normalUniformBuffer = device.createBuffer({
        size: 4 * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });


    const shaderModule = device.createShaderModule({
        code: shaderCode
    });


    let depthTexture = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
            depthOrArrayLayers: 1
        },
        format: "depth24plus-stencil8",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    let depthTextureView = depthTexture.createView();


    const pipeline = device.createRenderPipeline({
        layout: "auto",
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
                },
                {
                    stepMode: "vertex",
                    arrayStride: 2 * 4,
                    attributes: [
                        {
                            shaderLocation: 2,
                            offset: 0,
                            format: "float32x2"
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
            cullMode: "back",
            frontFace: "ccw"
        },
        depthStencil: {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less",
        },
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: viewProjUniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: modelUniformBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: normalUniformBuffer
                }
            }
        ]
    });


    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        projection_matrix = mat4.perspective(mat4.create(), Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
        view_proj = mat4.multiply(mat4.create(), projection_matrix, view_matrix);
        // ctx.configure({
        //     device: device,
        //     format: swapChainFormat,
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        // });
        depthTexture = device.createTexture({
            size: {
                width: canvas.width,
                height: canvas.height,
                depthOrArrayLayers: 1
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        depthTextureView = depthTexture.createView();
    });



    const render = (dt: number) => {
        const viewProjUniformData = new Float32Array(view_proj);
        device.queue.writeBuffer(viewProjUniformBuffer, 0, viewProjUniformData);
        const now = performance.now() / 1000;
        mat4.rotate(
            model,
            model,
            0.02,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
        );

        const modelUniformData = new Float32Array(model);
        device.queue.writeBuffer(modelUniformBuffer, 0, modelUniformData);

        normalMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), model));
        device.queue.writeBuffer(normalUniformBuffer, 0, new Float32Array(normalMatrix));


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
            depthStencilAttachment: {
                view: depthTextureView,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
                stencilClearValue: 0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store"
            }
        };
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, normalBuffer);
        passEncoder.setVertexBuffer(2, texCoordsBuffer);
        passEncoder.setIndexBuffer(indexBuffer, "uint16");
        passEncoder.drawIndexed(cube.indices.length, 1, 0, 0, 0);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame((t) => render(t));
    }

    requestAnimationFrame((t) => render(t));
}

export default main;