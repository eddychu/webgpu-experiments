struct VSOut {
    @builtin(position) nds_position: vec4<f32>,
    @location(0) color: vec3<f32>,
};

@group(0) @binding(0) var<uniform> u_view_proj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_model: mat4x4<f32>;

@vertex
fn vs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>, @location(2) in_uv: vec2<f32>) -> VSOut {
    var vs_out: VSOut;
    vs_out.nds_position = u_view_proj * u_model * vec4<f32>(in_pos, 1.0);
    vs_out.color = in_normal * 0.5 + 0.5;
    return vs_out;
}

@fragment
fn fs_main(@location(0) in_color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(in_color, 1.0);
}