export const createBuffer = (device: GPUDevice, arr: Float32Array | Uint16Array, usage: number) => {
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

export const createBindGroupLayout = (device: GPUDevice, entries: GPUBindGroupLayoutEntry[]) => {
    return device.createBindGroupLayout({
        entries
    });
}

export const createBindGroup = (device: GPUDevice, layout: GPUBindGroupLayout, entries: GPUBindGroupEntry[]) => {
    return device.createBindGroup({
        layout,
        entries
    });
}


export const createPipelineLayout = (device: GPUDevice, bindGroupLayouts: GPUBindGroupLayout[]) => {
    return device.createPipelineLayout({
        bindGroupLayouts
    });
}

// export const createTexture = (device: GPUDevice, size: GPUExtent3DStrict, format: GPUTextureFormat, usage: number) => {
//     return device.createTexture({
//         size,
//         format,
//         usage
//     });
// }