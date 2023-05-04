struct VSOut {
    @builtin(position) nds_position: vec4<f32>,
    @location(0) color: vec3<f32>,
};

@group(0) @binding(0) var<uniform> u_view_proj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_model: array<mat4x4<f32>, 2>;
@group(0) @binding(2) var<uniform> u_normal: array<mat4x4<f32>,2>;

@vertex
fn vs_main(@builtin(instance_index) instanceIdx : u32, @location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>, @location(2) in_uv: vec2<f32>) -> VSOut {
    var vs_out: VSOut;
    vs_out.nds_position = u_view_proj * u_model[instanceIdx] * vec4<f32>(in_pos, 1.0);
    let normal = normalize((u_normal[instanceIdx] * vec4<f32>(in_normal, 0.0)).xyz);
    vs_out.color = normal * 0.5 + 0.5;
    return vs_out;
}

@fragment
fn fs_main(@location(0) in_color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(in_color, 1.0);
}