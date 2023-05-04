import Geometry from "../geometry";
import Scene, { CameraNode, LightNode, MeshNode } from "../scene";
import { createBuffer } from "./resource";

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
    private _cameraPositionBuffer?: GPUBuffer;
    private _viewUniformBuffer?: GPUBuffer;
    private _materialUniformBuffer?: GPUBuffer;
    private _transformUniformBuffer?: GPUBuffer;
    private _lightUniformBuffer?: GPUBuffer;
    private _initialized: boolean = false;
    private _cameraPositionBindGroup?: GPUBindGroup;
    private _viewUniformBindGroup?: GPUBindGroup;
    private _materialBindGroup?: GPUBindGroup;
    private _transformBindGroup?: GPUBindGroup;
    private _lightBindGroup?: GPUBindGroup;
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
        const viewUniformBindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }]
        });

        // a mat4 for view matrix
        // a mat4 for projection matrix
        this._viewUniformBuffer = this._device.createBuffer({
            size: 4 * 16 * 2,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._viewUniformBindGroup = this._device.createBindGroup({
            layout: viewUniformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._viewUniformBuffer
                }
            }]
        });

        const materialBindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            }]
        });

        this._materialUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._materialBindGroup = this._device.createBindGroup({
            layout: materialBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._materialUniformBuffer
                }
            }]
        });

        const transformBindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }]
        });

        // a mat4 for model matrix
        // a mat4 for normal matrix

        this._transformUniformBuffer = this._device.createBuffer({
            size: 4 * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._transformBindGroup = this._device.createBindGroup({
            layout: transformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._transformUniformBuffer
                }
            }]
        });


        this._lightUniformBuffer = this._device.createBuffer({
            size: 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const lightBindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            }]
        });

        this._lightBindGroup = this._device.createBindGroup({
            layout: lightBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._lightUniformBuffer
                }
            }]
        });




        this._cameraPositionBuffer = this._device.createBuffer({
            size: 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const cameraPostionBindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }]
        });

        this._cameraPositionBindGroup = this._device.createBindGroup({
            layout: cameraPostionBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._cameraPositionBuffer
                }
            }]
        });




        this._positionBuffer = createBuffer(this._device, geometry.positions, GPUBufferUsage.VERTEX);
        this._normalBuffer = createBuffer(this._device, geometry.normals as Float32Array, GPUBufferUsage.VERTEX);
        this._uvBuffer = createBuffer(this._device, geometry.texCoords as Float32Array, GPUBufferUsage.VERTEX);
        this._indexBuffer = createBuffer(this._device, geometry.indices as Uint16Array, GPUBufferUsage.INDEX);

        const pipelineLayout = this._device.createPipelineLayout({
            bindGroupLayouts: [
                viewUniformBindGroupLayout,
                transformBindGroupLayout,
                lightBindGroupLayout,
                materialBindGroupLayout,
                cameraPostionBindGroupLayout
            ]
        });

        const shader = this._device.createShaderModule({
            code: material.shader
        });

        this._mainPipeline = this._device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shader,
                entryPoint: "vertex_main",
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
                entryPoint: "fragment_main",
                targets: [{
                    format: "bgra8unorm"
                }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "back"
            }
        });
    }

    public render(mesh: MeshNode, light: LightNode, camera: CameraNode) {
        if (!this._initialized) {
            this._init(mesh, light, camera);
            this._initialized = true;
        }
        const commandEncoder = this._device.createCommandEncoder();
        const textureView = this._ctx.getCurrentTexture().createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
                storeOp: "store",
                loadOp: "clear"
            }]
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this._mainPipeline as GPURenderPipeline);
        passEncoder.setBindGroup(0, this._viewUniformBindGroup as GPUBindGroup);
        passEncoder.setBindGroup(1, this._transformBindGroup as GPUBindGroup);
        passEncoder.setBindGroup(2, this._lightBindGroup as GPUBindGroup);
        passEncoder.setBindGroup(3, this._materialBindGroup as GPUBindGroup);
        passEncoder.setBindGroup(4, this._cameraPositionBindGroup as GPUBindGroup);
        passEncoder.setVertexBuffer(0, this._positionBuffer as GPUBuffer);
        passEncoder.setVertexBuffer(1, this._normalBuffer as GPUBuffer);
        passEncoder.setVertexBuffer(2, this._uvBuffer as GPUBuffer);
        passEncoder.setIndexBuffer(this._indexBuffer as GPUBuffer, "uint16");
        passEncoder.drawIndexed(mesh.geometry.indices.length, 1, 0, 0, 0);

        passEncoder.end();
        this._device.queue.submit([commandEncoder.finish()]);
    }
}