export const createBuffer = (device: GPUDevice, arr: Float32Array | Uint16Array, usage: number) => {
    let desc = {
        size: (arr.byteLength + 3) & ~3,
        usage,
        mappedAtCreation: true
    };

    console.log(desc);
    let buffer = device.createBuffer(desc);

    const writeArray =
        arr instanceof Uint16Array
            ? new Uint16Array(buffer.getMappedRange())
            : new Float32Array(buffer.getMappedRange());
    writeArray.set(arr);
    buffer.unmap();
    return buffer;
};

