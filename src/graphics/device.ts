
export default class Device {
    public dom: HTMLCanvasElement;
    public device: GPUDevice;
    public ctx: GPUCanvasContext;
    public format: GPUTextureFormat;

    constructor(dom: HTMLCanvasElement, device: GPUDevice, ctx: GPUCanvasContext, format: GPUTextureFormat) {
        this.dom = dom;
        this.device = device;
        this.ctx = ctx;
        this.format = format;
    }

    public createBuffer(device: GPUDevice, arr: Float32Array | Uint16Array, usage: number) {
        let desc = {
            size: (arr.byteLength + 3) & ~3,
            usage,
            mappedAtCreation: true
        };

        let buffer = device.createBuffer(desc);

        const writeArray =
            arr instanceof Uint16Array
                ? new Uint16Array(buffer.getMappedRange())
                : new Float32Array(buffer.getMappedRange());
        writeArray.set(arr);
        buffer.unmap();
        return buffer;
    };

    public

};



export const createDevice = async (dom: HTMLCanvasElement): Promise<Device> => {
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    const device = await adapter.requestDevice();
    const ctx = dom.getContext("webgpu") as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
        device,
        format,
    });
    return new Device(dom, device, ctx, format);
}