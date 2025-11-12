varying vec3 vPosition;
uniform float uTime;
void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
}