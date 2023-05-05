struct VSOut {
    @builtin(position) nds_position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> u_view_proj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_model: mat4x4<f32>;
@group(0) @binding(2) var<uniform> u_normal: mat4x4<f32>;

@vertex
fn vs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>, @location(2) in_uv: vec2<f32>) -> VSOut {
    var vs_out: VSOut;
    vs_out.nds_position = u_view_proj * u_model * vec4<f32>(in_pos, 1.0);
    let normal = normalize((u_normal * vec4<f32>(in_normal, 0.0)).xyz);
    vs_out.normal = normal;
    vs_out.uv = in_uv;
    return vs_out;
}

@group(0) @binding(3) var my_sampler: sampler;
@group(0) @binding(4) var my_texture: texture_2d<f32>;

@fragment
fn fs_main(@location(0) in_normal: vec3<f32>, @location(1) in_uv: vec2<f32>) -> @location(0) vec4<f32> {
    let tex_color = textureSample(my_texture, my_sampler, in_uv);
    return 0.5 * tex_color + 0.5 * vec4<f32>(in_uv, 0.0, 1.0);
}