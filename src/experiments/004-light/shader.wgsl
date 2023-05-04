struct VSOut {
    @builtin(position) nds_position: vec4<f32>,
    @location(0) world_pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
};

@group(0) @binding(0) var<uniform> u_view_proj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_model: mat4x4<f32>;
@group(0) @binding(2) var<uniform> u_normal: mat4x4<f32>;

@vertex
fn vs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>, @location(2) in_uv: vec2<f32>) -> VSOut {
    var vs_out: VSOut;
    vs_out.world_pos = (u_model * vec4<f32>(in_pos, 1.0)).xyz;
    vs_out.nds_position = u_view_proj * u_model * vec4<f32>(in_pos, 1.0);
    let normal = normalize((u_normal * vec4<f32>(in_normal, 0.0)).xyz);
    vs_out.normal = normal * 0.5 + 0.5;
    return vs_out;
}

struct Light {
    position: vec4<f32>,
    color: vec4<f32>,
    intensity: f32,
};

@group(0) @binding(3) var<uniform> u_light: Light;

@fragment
fn fs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>) -> @location(0) vec4<f32> {
    let light_dir = normalize(u_light.position.xyz - in_pos);
    let light_intensity = max(dot(in_normal, light_dir), 0.0) * u_light.intensity;
    let in_color = u_light.color.xyz * light_intensity;
    return vec4<f32>(in_color, 1.0);
}