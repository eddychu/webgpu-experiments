struct VSOut {
    @builtin(position) nds_position: vec4<f32>,
    @location(0) view_space_pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
};


struct TransformUniform {
    model_view_matrix: mat4x4<f32>,
    normal_matrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> u_proj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_transform: TransformUniform;

@vertex
fn vs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>, @location(2) in_uv: vec2<f32>) -> VSOut {
    var vs_out: VSOut;
    let view_space_pos = u_transform.model_view_matrix * vec4<f32>(in_pos, 1.0);
    vs_out.view_space_pos = view_space_pos.xyz;
    vs_out.nds_position = u_proj * view_space_pos;
    let normal = normalize((u_transform.normal_matrix * vec4<f32>(in_normal, 0.0)).xyz);
    vs_out.normal = normal;
    return vs_out;
}

struct PointLight {
    position: vec4<f32>,
    color: vec4<f32>,
    intensity: f32,
};

struct PhongMaterial {
    diffuse: vec4<f32>,
    specular: vec4<f32>,
    shininess: f32,
};

@group(0) @binding(2) var<uniform> u_light: PointLight;
@group(0) @binding(3) var<uniform> u_material: PhongMaterial;
@group(0) @binding(4) var<uniform> u_camera_pos: vec4<f32>;

@fragment
fn fs_main(@location(0) in_pos: vec3<f32>, @location(1) in_normal: vec3<f32>) -> @location(0) vec4<f32> {
    let light_dir = normalize(u_light.position.xyz - in_pos);
    let view_dir = normalize(-in_pos);
    let half_dir = normalize(light_dir + view_dir);
    let diffuse = max(dot(in_normal, light_dir), 0.0);
    let specular = pow(max(dot(in_normal, half_dir), 0.0), u_material.shininess);
    let ambient = 0.1;
    let light_color = u_light.color.xyz * u_light.intensity;
    let diffuse_color = u_material.diffuse.xyz * light_color * diffuse;
    let specular_color = u_material.specular.xyz * light_color * specular;
    let ambient_color = light_color * ambient;
    return vec4<f32>(ambient_color + diffuse_color + specular_color, 1.0);
}