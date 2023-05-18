import Geometry from "../geometry";

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

export const createGeometryBuffer = (device: GPUDevice, geometry: Geometry) : any => {
    const layout: Iterable<GPUVertexBufferLayout> = [{
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
    }];

    const positionBuffer = createBuffer(device, geometry.positions, GPUBufferUsage.VERTEX);
    const normalBuffer = createBuffer(device, geometry.normals as Float32Array, GPUBufferUsage.VERTEX);
    const texCoordsBuffer = createBuffer(device, geometry.texCoords as Float32Array, GPUBufferUsage.VERTEX);
    
    return {
        layout,
        vertexBuffers: [
            positionBuffer,
            normalBuffer,
            texCoordsBuffer
        ],
        indexBuffer: createBuffer(device, geometry.indices, GPUBufferUsage.INDEX)
    }
}