uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorOuter;

varying vec2 vUv;

#include ../includes/perlinNoise.glsl;
#include ../includes/rotate2D.glsl;

void main(){
    // twirl 
    float distanceFromCenter = length(vUv - vec2(0.5));
    distanceFromCenter = 1.0 - distanceFromCenter;
    vec2 twirl = rotate2D(vUv - 0.5, distanceFromCenter * 10.0);

    vec2 rotateUv = rotate2D(twirl, uTime * 0.9);    

    float strength = cnoise(vec3(rotateUv  * 10.0, uTime * 0.9));
    strength = smoothstep(-0.3, 1.0, strength);

    float centerSpot = length(vec2(vUv.x - 0.5, (vUv.y - 0.5) * 0.55 - 0.025));
    centerSpot = pow(centerSpot, 3.0);
    centerSpot = smoothstep(0.002, 0.025, centerSpot);

    // strength = mix(strength, 1.0, centerSpot);

    vec3 color = mix(uColorA, uColorB, strength);
    color = mix(color, uColorOuter, centerSpot);

    gl_FragColor = vec4(color, 1.0);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}