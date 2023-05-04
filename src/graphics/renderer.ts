import { mat4 } from "gl-matrix";
import Geometry from "../geometry";
import Scene, { CameraNode, LightNode, MeshNode } from "../scene";
import { createBuffer } from "./resource";
import { PointLight } from "../lights";
import { PhongMaterial } from "../materials";

export default class Renderer {
    private _dom: HTMLCanvasElement;
    private _ctx: GPUCanvasContext;
    private _device: GPUDevice;
    private _swapchainFormat: GPUTextureFormat = "bgra8unorm";
    // private _mainPipeline: GPURenderPipeline;
    // private _materialBindGroupLayout: GPUBindGroupLayout;
    // private _materialBindGroup: GPUBindGroup;
    // private _transformBindGroupLayout: GPUBindGroupLayout;
    // private _transformBindGroup: GPUBindGroup;
    // private _cameraBindGroupLayout: GPUBindGroupLayout;
    // private _cameraBindGroup: GPUBindGroup;
    private _mainPipeline?: GPURenderPipeline;
    private _positionBuffer?: GPUBuffer;
    private _normalBuffer?: GPUBuffer;
    private _uvBuffer?: GPUBuffer;
    private _indexBuffer?: GPUBuffer;
    private _viewUniformBuffer?: GPUBuffer;
    private _materialUniformBuffer?: GPUBuffer;
    private _transformUniformBuffer?: GPUBuffer;
    private _lightUniformBuffer?: GPUBuffer;
    private _initialized: boolean = false;
    private _uniformBindGroup?: GPUBindGroup;
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
    }

    private _init(mesh: MeshNode, light: LightNode, camera: CameraNode) {
        const geometry = mesh.geometry;
        const material = mesh.material;
        // view_proj matrix
        this._viewUniformBuffer = this._device.createBuffer({
            size: 4 * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._transformUniformBuffer = this._device.createBuffer({
            size: 4 * 16 * 2,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._lightUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });


        this._materialUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._positionBuffer = createBuffer(this._device, geometry.positions, GPUBufferUsage.VERTEX);
        this._normalBuffer = createBuffer(this._device, geometry.normals as Float32Array, GPUBufferUsage.VERTEX);
        this._uvBuffer = createBuffer(this._device, geometry.texCoords as Float32Array, GPUBufferUsage.VERTEX);
        this._indexBuffer = createBuffer(this._device, geometry.indices as Uint16Array, GPUBufferUsage.INDEX);

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
            code: material.shader
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

        this._uniformBindGroup = this._device.createBindGroup({
            layout: this._mainPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._viewUniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: this._transformUniformBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: this._lightUniformBuffer
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: this._materialUniformBuffer
                }
            },
            ]
        });
    }


    public render(mesh: MeshNode, light: LightNode, camera: CameraNode) {
        if (!this._initialized) {
            this._init(mesh, light, camera);
            this._initialized = true;
        }

        if (camera.isDirty) {
            const projectionMatrix = camera.projectionMatrix;
            this._device.queue.writeBuffer(this._viewUniformBuffer as GPUBuffer, 0, new Float32Array(projectionMatrix));
            // this._device.queue.writeBuffer(this._cameraPositionBuffer as GPUBuffer, 0, new Float32Array(camera.transform.position));
            const modelViewMatrix = mat4.multiply(mat4.create(), camera.transform.localMatrix, mesh.transform.worldMatrix);
            const normalMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), modelViewMatrix));
            const transformUniformData = new Float32Array(16 * 2);
            transformUniformData.set(modelViewMatrix, 0);
            transformUniformData.set(normalMatrix, 16);
            this._device.queue.writeBuffer(this._transformUniformBuffer as GPUBuffer, 0, transformUniformData);
            camera.isDirty = false;

        }

        if (mesh.isDirty) {
            // const modelViewMatrix = mat4.multiply(mat4.create(), camera.transform.localMatrix, camera.transform.worldMatrix);
            // const normalMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), modelViewMatrix));
            // const transformUniformData = new Float32Array(16 * 2);
            // transformUniformData.set(modelViewMatrix, 0);
            // transformUniformData.set(normalMatrix, 16);
            // this._device.queue.writeBuffer(this._transformUniformBuffer as GPUBuffer, 0, transformUniformData);
            const materialUniformData = new Float32Array(4 * 3);
            const phongMaterial = mesh.material as PhongMaterial;
            materialUniformData.set(phongMaterial.diffuse, 0);
            materialUniformData.set(phongMaterial.specular, 4);
            materialUniformData.set([phongMaterial.shininess], 4 * 2);
            this._device.queue.writeBuffer(this._materialUniformBuffer as GPUBuffer, 0, materialUniformData);
            mesh.isDirty = false;
        }

        if (light.isDirty) {
            const lightUniformData = new Float32Array(4 * 3);
            lightUniformData.set(light.transform.position, 0);
            lightUniformData.set((light.light as PointLight).color, 4);
            lightUniformData.set([(light.light as PointLight).intensity], 4 * 2);

            this._device.queue.writeBuffer(this._lightUniformBuffer as GPUBuffer, 0, lightUniformData);
            light.isDirty = false;
        }


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
        passEncoder.setBindGroup(0, this._uniformBindGroup as GPUBindGroup);
        passEncoder.setVertexBuffer(0, this._positionBuffer as GPUBuffer);
        passEncoder.setVertexBuffer(1, this._normalBuffer as GPUBuffer);
        passEncoder.setVertexBuffer(2, this._uvBuffer as GPUBuffer);
        passEncoder.setIndexBuffer(this._indexBuffer as GPUBuffer, "uint16");
        passEncoder.drawIndexed(mesh.geometry.indices.length, 1, 0, 0, 0);
        passEncoder.end();
        this._device.queue.submit([commandEncoder.finish()]);
    }
}