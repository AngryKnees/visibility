/**
 * @author HypnosNova / https://www.threejs.org.cn/gallery/
 * @author angryknees / https://github.com/angryknees
 * 
 * Adapted from the shader used in https://threejs.org/examples/?q=after#webgl_postprocessing_afterimage
 */



export const AfterimageShader = {

	uniforms: {
        "cutoff": { value: 0.1 },
        "damp": { value: 0.96 },
		"tOld": { value: null },
		"tNew": { value: null }

	},

	vertexShader: `\
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

`,

	fragmentShader: `\
uniform float cutoff;
uniform float damp;

uniform sampler2D tOld;
uniform sampler2D tNew;

varying vec2 vUv;

void main() {
	vec4 texelOld = texture2D( tOld, vUv );
    vec4 texelNew = texture2D( tNew, vUv );


    float newLength = length(texelNew);
    float oldLength = length(texelOld);
    float dampening = damp * (step(newLength, oldLength) * -1.0 + 1.0);

    if (abs(oldLength - newLength) < cutoff) {
        dampening = dampening * -1.0 + 1.0;
    }
    
	gl_FragColor = mix(texelNew, texelOld, dampening);
}
`

};