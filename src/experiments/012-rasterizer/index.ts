
import screenShader from "./rasterizer.wgsl?raw";
import rasterizerShader from "./compute.wgsl?raw";
import { mat4 } from "gl-matrix";
async function loadModel() {

}


export default async function init() {
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    const device = await adapter.requestDevice();
    const dom = document.querySelector("canvas") as HTMLCanvasElement;
    dom.width = 800;
    dom.height = 800;
    dom.style.width = "256px";
    dom.style.height = "256px";

    const ctx = dom.getContext("webgpu") as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
        device,
        format,
    });

    const { addComputePass, outputColorBuffer } = createComputePass(ctx, device);
    const { render } = createScreenRenderPass(ctx, device, outputColorBuffer);

    // read output color buffer
    const readback = device.createBuffer({
        size: outputColorBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });



    function draw() {
        const commandEncoder = device.createCommandEncoder();
        addComputePass(commandEncoder);
        commandEncoder.copyBufferToBuffer(outputColorBuffer, 0, readback, 0, outputColorBuffer.size);
        render(commandEncoder);
        device.queue.submit([commandEncoder.finish()]);


        readback.mapAsync(GPUMapMode.READ, 0, outputColorBuffer.size).then(() => {
            const arrayBuffer = readback.getMappedRange(0, outputColorBuffer.size);
            const data = arrayBuffer.slice(0);
            readback.unmap();
            console.log(new Uint32Array(data));
        })

        // requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}

function createComputePass(ctx: GPUCanvasContext, device: GPUDevice) {
    const size = [ctx.canvas.width, ctx.canvas.height];
    const WIDTH = size[0];
    const HEIGHT = size[1];
    const channels = 3;
    console.log(WIDTH, HEIGHT)
    const outputColorBufferSize = Uint32Array.BYTES_PER_ELEMENT * (WIDTH * HEIGHT) * channels;
    console.log(outputColorBufferSize)
    console.log(Uint32Array.BYTES_PER_ELEMENT)
    const outputColorBuffer = device.createBuffer({
        size: outputColorBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    // a mat4 and 2 f32 for width and height
    const UBOBufferSize = 4 * 4 * 4 + 4 * 4;
    const UBOBuffer = device.createBuffer({
        size: UBOBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const vertices = new Float32Array([
        200, 200, 10,
        300, 200, 50,
        200, 300, 50,
    ]);
    const vertexCount = vertices.length / 3;
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.STORAGE,
        mappedAtCreation: true,
    });

    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);

    vertexBuffer.unmap();

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "uniform",
                },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "read-only-storage"
                }
            }
        ]
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: outputColorBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: UBOBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: vertexBuffer
                }
            }
        ]
    });

    const computeRasterizerModule = device.createShaderModule({ code: rasterizerShader });
    const rasterizerPipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: computeRasterizerModule, entryPoint: "main" }
    });

    const addComputePass = (commandEncoder: GPUCommandEncoder) => {
        // Write values to uniform buffer object
        const projMatrix = mat4.create();
        mat4.perspective(projMatrix, 45 * Math.PI / 180, WIDTH / HEIGHT, 0.1, 100);
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
        const mvp = mat4.create();
        mat4.multiply(mvp, projMatrix, viewMatrix);

        const uniformData = [...mvp, WIDTH, HEIGHT];
        const uniformTypedArray = new Float32Array(uniformData);
        device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);

        const passEncoder = commandEncoder.beginComputePass();

        passEncoder.setPipeline(rasterizerPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(1);

        passEncoder.end();
    }

    return { addComputePass, outputColorBuffer };
}

function createScreenRenderPass(ctx: GPUCanvasContext, device: GPUDevice, colorBuffer: GPUBuffer) {
    const fullscreenQuadBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 1,// the color buffer
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "read-only-storage"
                }
            }
        ]
    });

    const shaderModule = device.createShaderModule({
        code: screenShader,
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [fullscreenQuadBindGroupLayout]
        }),
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [
                {
                    format: "bgra8unorm",
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
        },
    });

    const uniformBufferSize = 4 * 2;
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
        layout: fullscreenQuadBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: colorBuffer
                }
            }
        ],
    });

    const render = (commandEncoder: GPUCommandEncoder) => {
        const currentTexture = ctx.getCurrentTexture();

        device.queue.writeBuffer(
            uniformBuffer,
            0,
            new Float32Array([currentTexture.width, currentTexture.height]));

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: currentTexture.createView(),
                    clearValue: [1.0, 0, 0, 1],
                    loadOp: "clear",
                    storeOp: "store",
                }
            ]
        }

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(6, 1, 0, 0);
        passEncoder.end();
    }
    return { render }
}