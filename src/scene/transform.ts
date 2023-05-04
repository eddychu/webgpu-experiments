import { mat3, mat4, quat, vec3 } from "gl-matrix";

export default class Transform {
    private _position: vec3;
    private _rotation: quat;
    private _scale: vec3;

    public worldMatrix: mat4;
    public localMatrix: mat4;


    public static identity(): Transform {
        return new Transform(vec3.fromValues(0.0, 0.0, 0.0),
            quat.fromValues(0.0, 0.0, 0.0, 1.0), vec3.fromValues(1.0, 1.0, 1.0));
    }

    public static translate(position: vec3): Transform {
        const transform = new Transform();
        transform.position = position;
        return transform;
    }


    public static lookAt(eye: vec3, target: vec3, up: vec3): Transform {
        const transform = new Transform();
        transform.position = eye;
        mat4.lookAt(transform.localMatrix, eye, target, up);
        mat4.invert(transform.worldMatrix, transform.localMatrix);
        transform._rotation = quat.fromMat3(quat.create(), mat3.fromMat4(mat3.create(), transform.worldMatrix));
        return transform;
    }

    constructor(position: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotation: quat = quat.fromValues(0.0, 0.0, 0.0, 1.0), scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0)) {
        this._position = position;
        this._rotation = rotation;
        this._scale = scale;
        this.worldMatrix = mat4.create();
        this.localMatrix = mat4.create();
        mat4.fromRotationTranslationScale(this.worldMatrix, this._rotation, this._position, this._scale);
        mat4.invert(this.localMatrix, this.worldMatrix);
    }

    public set position(value: vec3) {
        this._position = value;
        mat4.fromRotationTranslationScale(this.worldMatrix, this._rotation, this._position, this._scale);
        mat4.invert(this.localMatrix, this.worldMatrix);
    }

    public get position(): vec3 {
        return this._position;
    }

    public set rotation(value: quat) {
        this._rotation = value;
        mat4.fromRotationTranslationScale(this.worldMatrix, this._rotation, this._position, this._scale);
        mat4.invert(this.localMatrix, this.worldMatrix);
    }

    public get rotation(): quat {
        return this._rotation;
    }

    public set scale(value: vec3) {
        this._scale = value;
        mat4.fromRotationTranslationScale(this.worldMatrix, this._rotation, this._position, this._scale);
        mat4.invert(this.localMatrix, this.worldMatrix);
    }

    public get scale(): vec3 {
        return this._scale;
    }

    public get up(): vec3 {
        const upX = this.worldMatrix[4];
        const upY = this.worldMatrix[5];
        const upZ = this.worldMatrix[6];
        return vec3.fromValues(upX, upY, upZ);
    }

    public get right(): vec3 {
        const rightX = this.worldMatrix[0];
        const rightY = this.worldMatrix[1];
        const rightZ = this.worldMatrix[2];
        return vec3.fromValues(rightX, rightY, rightZ);
    }

    public get forward(): vec3 {
        const forwardX = this.worldMatrix[8];
        const forwardY = this.worldMatrix[9];
        const forwardZ = this.worldMatrix[10];
        return vec3.fromValues(forwardX, forwardY, forwardZ);
    }

}