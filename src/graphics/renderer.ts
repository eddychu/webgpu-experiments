import { mat4 } from "gl-matrix";
import Geometry from "../geometry";
import Scene, { CameraNode, InstancedMeshNode, LightNode, MeshNode } from "../scene";
import { createBuffer } from "./resource";
import { PointLight } from "../lights";
import { PhongMaterial } from "../materials";
import phongShader from "../shaders/phong.wgsl?raw";
export default class Renderer {
    private _dom: HTMLCanvasElement;
    private _ctx: GPUCanvasContext;
    private _device: GPUDevice;
    private _swapchainFormat: GPUTextureFormat = "bgra8unorm";
    private _mainPipeline?: GPURenderPipeline;
    private _depthTexture?: GPUTexture;
    private _depthTextureView?: GPUTextureView;
    constructor(dom: HTMLCanvasElement, device: GPUDevice) {
        this._dom = dom;
        this._ctx = this._dom.getContext("webgpu") as GPUCanvasContext;

        this._device = device;
        this._ctx.configure({
            device: this._device,
            format: this._swapchainFormat
        });
        this._init();
    }

    private _init() {



        this._depthTexture = this._device.createTexture({
            size: {
                width: this._ctx.canvas.width,
                height: this._ctx.canvas.height,
                depthOrArrayLayers: 1
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        this._depthTextureView = this._depthTexture.createView();

        const shader = this._device.createShaderModule({
            code: phongShader
        });

        this._mainPipeline = this._device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [{
                    arrayStride: 4 * 3,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    }]
                }, {
                    arrayStride: 4 * 3,
                    attributes: [{
                        shaderLocation: 1,
                        offset: 0,
                        format: "float32x3"
                    }]
                }, {
                    arrayStride: 4 * 2,
                    attributes: [{
                        shaderLocation: 2,
                        offset: 0,
                        format: "float32x2"
                    }]
                }]
            },
            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [{
                    format: "bgra8unorm"
                }]
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


    }
    public render(scene: Scene) {
        const commandEncoder = this._device.createCommandEncoder();
        const textureView = this._ctx.getCurrentTexture().createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                storeOp: "store",
                loadOp: "clear"
            }],
            depthStencilAttachment: {
                view: this._depthTextureView as GPUTextureView,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
                stencilClearValue: 0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store"
            }
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this._mainPipeline as GPURenderPipeline);
        const light = scene.lights[0];
        const camera = scene.camera as CameraNode;

        // this._device.queue.writeBuffer(this._cameraPositionBuffer as GPUBuffer, 0, new Float32Array(camera.transform.position));





        for (const drawable of scene.drawables) {
            this.renderObject(drawable, camera, light, passEncoder);
        }

        passEncoder.end();
        this._device.queue.submit([commandEncoder.finish()]);
    }

    public resize(width: number, height: number) {
        this._depthTexture = this._device.createTexture({
            size: {
                width: width,
                height: height,
                depthOrArrayLayers: 1
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this._depthTextureView = this._depthTexture.createView();
    }

    public renderObject(drawable: MeshNode | InstancedMeshNode, camera: CameraNode, light: LightNode, passEncoder: GPURenderPassEncoder) {

        const viewUniformBuffer = this._device.createBuffer({
            size: 4 * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const transformUniformSize = drawable instanceof InstancedMeshNode ? 4 * 16 * 2 * drawable.instanceCount : 4 * 16 * 2;


        const transformUniformBuffer = this._device.createBuffer({
            size: transformUniformSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const lightUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });


        const materialUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });


        const uniformBindGroup = this._device.createBindGroup({
            layout: (this._mainPipeline as GPURenderPipeline).getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: viewUniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: transformUniformBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: lightUniformBuffer
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: materialUniformBuffer
                }
            },
            ]
        });
        const projectionMatrix = camera.projectionMatrix;
        this._device.queue.writeBuffer(viewUniformBuffer as GPUBuffer, 0, new Float32Array(projectionMatrix));
        const transformUniformData = new Float32Array(transformUniformSize / 4);
        if (drawable instanceof InstancedMeshNode) {
            for (let i = 0; i < drawable.instanceCount; i++) {
                const modelViewMatrix = mat4.multiply(mat4.create(), camera.transform.localMatrix, drawable.instanceTransforms[i].worldMatrix);
                const normalMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), modelViewMatrix));
                transformUniformData.set(modelViewMatrix, 0 + i * 32);
                transformUniformData.set(normalMatrix, 16 + i * 32);
            }
        } else {
            const modelViewMatrix = mat4.multiply(mat4.create(), camera.transform.localMatrix, drawable.transform.worldMatrix);
            const normalMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), modelViewMatrix));

            transformUniformData.set(modelViewMatrix, 0);
            transformUniformData.set(normalMatrix, 16);
        }

        this._device.queue.writeBuffer(transformUniformBuffer as GPUBuffer, 0, transformUniformData);

        const materialUniformData = new Float32Array(4 * 3);
        const phongMaterial = drawable.material as PhongMaterial;
        materialUniformData.set(phongMaterial.diffuse, 0);
        materialUniformData.set(phongMaterial.specular, 4);
        materialUniformData.set([phongMaterial.shininess], 4 * 2);
        this._device.queue.writeBuffer(materialUniformBuffer as GPUBuffer, 0, materialUniformData);

        const lightUniformData = new Float32Array(4 * 3);
        lightUniformData.set(light.transform.position, 0);
        lightUniformData.set((light.light as PointLight).color, 4);
        lightUniformData.set([(light.light as PointLight).intensity], 4 * 2);
        this._device.queue.writeBuffer(lightUniformBuffer as GPUBuffer, 0, lightUniformData);

        const positionBuffer = createBuffer(this._device, drawable.geometry.positions, GPUBufferUsage.VERTEX);
        const normalBuffer = createBuffer(this._device, drawable.geometry.normals as Float32Array, GPUBufferUsage.VERTEX);
        const uvBuffer = createBuffer(this._device, drawable.geometry.texCoords as Float32Array, GPUBufferUsage.VERTEX);
        const indexBuffer = createBuffer(this._device, drawable.geometry.indices, GPUBufferUsage.INDEX);

        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, normalBuffer);
        passEncoder.setVertexBuffer(2, uvBuffer);
        passEncoder.setIndexBuffer(indexBuffer, "uint16");
        const instanceCount = drawable instanceof InstancedMeshNode ? drawable.instanceCount : 1;
        passEncoder.drawIndexed(drawable.geometry.indices.length, instanceCount, 0, 0, 0);

    }
}