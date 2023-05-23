struct ColorBuffer {
    values: array<u32>
};

struct UBO {
    mvp: mat4x4<f32>,
    screen_size: vec2<f32>,
};

struct Vertex {
    x: f32,
    y: f32,
    z: f32,
};

struct VertexBuffer {
    values: array<Vertex>,
};

@group(0) @binding(0) var<storage, read_write> color_buffer: ColorBuffer;

@group(0) @binding(1) var<uniform> ubo : UBO;

@group(0) @binding(2) var<storage, read> vertexBuffer: VertexBuffer;

fn color_pixel(x: u32, y: u32, r: u32, g: u32, b: u32) {
    let pixelId = u32(x + y * u32(ubo.screen_size.x))* 3u;

    color_buffer.values[pixelId] = r;
    color_buffer.values[pixelId + 1u] = g;
    color_buffer.values[pixelId + 2u] = b;
}

@compute @workgroup_size(256, 1, 1) 
fn main(@builtin(global_invocation_id) globalInvocationID: vec3<u32>) {
    let index = globalInvocationID.x * 3;

    let v1 = vertexBuffer.values[index];
    let v2 = vertexBuffer.values[index + 1u];
    let v3 = vertexBuffer.values[index + 2u];

    // color_buffer.values[index] = u32(v1.x);
    // color_buffer.values[index + 1u] = u32(v2.x);
    // color_buffer.values[index + 2u] = u32(v3.x);

    color_pixel(u32(v1.x), u32(v1.y), 255u, 0u, 0u);
    color_pixel(u32(v2.x), u32(v2.y), 255u, 0u, 0u);
    color_pixel(u32(v3.x), u32(v3.y), 255u, 0u, 0u);
}