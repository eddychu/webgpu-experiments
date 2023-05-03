const main = async () => {
    const canvas = document.querySelector('#mycanvas') as HTMLCanvasElement;
    if (navigator.gpu === undefined) {
        console.error("WebGPU not supported");
        return;
    }
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;

    const ctx = canvas.getContext("webgpu") as GPUCanvasContext;

    const device = await adapter.requestDevice() as GPUDevice;

    const swapChainFormat = "bgra8unorm";

    ctx.configure({
        device: device,
        format: swapChainFormat,
    });

    const render = () => {
        const commandEncoder = device.createCommandEncoder();
        const textureView = ctx.getCurrentTexture().createView() as GPUTextureView;

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.2, g: 0.3, b: 0.5, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        };
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

export default main;