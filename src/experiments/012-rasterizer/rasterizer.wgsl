struct ColorData {
    data: array<u32>
};

struct Uniform {
    screenWidth: f32,
    screenHeight: f32
};

@group(0) @binding(0) var<uniform> uniforms: Uniform;
@group(0) @binding(1) var<storage> color_data: ColorData;

struct VertexOutput {
    @builtin(position) position: vec4<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>( 1.0,  1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0,  1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(-1.0,  1.0)
    );
    var output: VertexOutput;
    output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    return output;
}


@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let x = floor(pos.x);
    let y = floor(pos.y);
    let index = u32(x + y * uniforms.screenWidth) * 3u;

    let r = f32(color_data.data[index + 0u]) / 255.0;
    let g = f32(color_data.data[index + 1u]) / 255.0;
    let b = f32(color_data.data[index + 2u]) / 255.0;

    return vec4<f32>(r, g, b, 1.0);
}