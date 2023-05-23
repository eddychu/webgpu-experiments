struct ColorBuffer {
    values: array<u32>
};

struct UBO {
    screen_size: vec2<f32>,
};

@group(0) @binding(0) var<storage, read_write> color_buffer: ColorBuffer;

@group(0) @binding(1) var<uniform> ubo : UBO;

@compute @workgroup_size(256, 1, 1) 
fn main(@builtin(global_invocation_id) globalInvocationID: vec3<u32>) {
    let index = globalInvocationID.x * 3;

    let row = globalInvocationID.x / u32(ubo.screen_size.x);
    let col = globalInvocationID.x % u32(ubo.screen_size.x);

    let x = f32(col) / ubo.screen_size.x;
    let y = f32(row) / ubo.screen_size.y;

    color_buffer.values[index] = u32(y * 256.0);
    color_buffer.values[index + 1u] = u32(x * 256.0);
    color_buffer.values[index + 2u] = 0;
}