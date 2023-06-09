import { mat4, vec3 } from "gl-matrix";
import Cube from "../../geometry/cube";
import { createBuffer } from "../../graphics/resource";
import shaderCode from "./shader.wgsl?raw";
import { PointLight } from "../../lights";
import { PhongMaterial } from "../../materials";
import { CameraNode, MeshNode } from "../../scene";
import Transform from "../../scene/transform";
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
    const phongMaterial = new PhongMaterial(
        [0.5, 0.5, 0.9],
        [0.4, 0.5, 0.2],
        8.0);

    const mesh = new MeshNode(
        cube,
        phongMaterial
    );


    const positionBuffer = createBuffer(device, cube.positions, GPUBufferUsage.VERTEX);
    const normalBuffer = createBuffer(device, cube.normals as Float32Array, GPUBufferUsage.VERTEX);
    const texCoordsBuffer = createBuffer(device, cube.texCoords as Float32Array, GPUBufferUsage.VERTEX);

    const indexBuffer = createBuffer(device, cube.indices, GPUBufferUsage.INDEX);

    const camera = new CameraNode(
        vec3.fromValues(0, 0, 5),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 1, 0),
        canvas.width / canvas.height,
        Math.PI / 4,
        0.1,
        100.0,
    );
    let view_matrix = camera.transform.localMatrix;
    let projection_matrix = camera.projectionMatrix;




    let model_view = mat4.multiply(mat4.create(), view_matrix, mesh.transform.worldMatrix);
    let normal_matrix = mat4.create();
    mat4.invert(normal_matrix, model_view);
    mat4.transpose(normal_matrix, normal_matrix);

    let light = new PointLight([0, 0, 5], [1, 1, 1], 1.0);

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

    const lightUniformBuffer = device.createBuffer({
        // one vec3 for position, one padding,  one vec3 for color, one padding,  one float for intensity
        size: 4 * 4 * 3,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const materialUniformBuffer = device.createBuffer({
        size: 4 * 4 * 3,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const cameraPositionUniformBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            }
        ]
    });
    const uniformBindGroup = device.createBindGroup({
        layout: uniformBindGroupLayout,
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
            },
            {
                binding: 3,
                resource: {
                    buffer: lightUniformBuffer
                }
            },
            {
                binding: 4,
                resource: {
                    buffer: materialUniformBuffer
                }
            },
            {
                binding: 5,
                resource: {
                    buffer: cameraPositionUniformBuffer
                }
            }
        ]
    });




    const shaderModule = device.createShaderModule({
        code: shaderCode
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [uniformBindGroupLayout]
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
        layout: pipelineLayout,
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

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.setAspectRatio(canvas.width / canvas.height);
        projection_matrix = camera.projectionMatrix;

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
            view_matrix = camera.transform.localMatrix;
            mat4.multiply(model_view, view_matrix, mesh.transform.worldMatrix);
            mat4.invert(normal_matrix, model_view);
            mat4.transpose(normal_matrix, normal_matrix);
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            mouseDeltaX = 0.0;
            mouseDeltaY = 0.0;
        }
    });



    const render = (dt: number) => {
        const viewProjUniformData = new Float32Array(projection_matrix);
        device.queue.writeBuffer(viewProjUniformBuffer, 0, viewProjUniformData);
        // const now = performance.now() / 1000;
        // model = mat4.rotate(
        //     model,
        //     model,
        //     1.0 * 0.05,
        //     vec3.fromValues(Math.sin(now), Math.cos(now), 0),
        // );

        const cameraPosData = new Float32Array(camera.transform.position);
        device.queue.writeBuffer(cameraPositionUniformBuffer, 0, cameraPosData);

        const modelUniformData = new Float32Array(model_view);
        device.queue.writeBuffer(modelUniformBuffer, 0, modelUniformData);


        device.queue.writeBuffer(normalUniformBuffer, 0, new Float32Array(normal_matrix));

        device.queue.writeBuffer(lightUniformBuffer, 0, light.toFloat32Array());

        device.queue.writeBuffer(materialUniformBuffer, 0, phongMaterial.toFloat32Array());

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