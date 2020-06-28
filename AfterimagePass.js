/**
 * @author HypnosNova / https://www.threejs.org.cn/gallery/
 * @author angryknees / https://github.com/angryknees
 * 
 * A post processing pass for an afterimage effect used in https://threejs.org/examples/?q=after#webgl_postprocessing_afterimage
 */

import {
	LinearFilter,
	MeshBasicMaterial,
	NearestFilter,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
    WebGLRenderTarget,
    DataTexture
} from "https://cdn.jsdelivr.net/npm/three@0.117/build/three.module.js";
import { Pass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/Pass.js";
import { AfterimageShader } from "./AfterimageShader.js";

var AfterimagePass = function ( damp, cutoff ) {

	Pass.call( this );

	if ( AfterimageShader === undefined )
		console.error( "AfterimagePass relies on AfterimageShader" );

	this.shader = AfterimageShader;

    this.uniforms = UniformsUtils.clone( this.shader.uniforms );
    
    if (damp !== undefined) {
        this.uniforms["damp"].value = damp;
    }

    if (cutoff !== undefined) {
        this.uniforms["cutoff"].value = cutoff;
    }
    
    const { innerWidth: width, innerHeight: height } = window;

	this.textureComp = new WebGLRenderTarget( width, height, {

		minFilter: LinearFilter,
		magFilter: NearestFilter,
		format: RGBAFormat

	} );

	this.textureOld = new WebGLRenderTarget( width, height, {

		minFilter: LinearFilter,
		magFilter: NearestFilter,
		format: RGBAFormat

    } );
    

    this.textureOld.texture = new DataTexture(
        new Uint8Array(width * height * 4).fill(0xFF),
        width,
        height,
        RGBAFormat);

	this.shaderMaterial = new ShaderMaterial( {
		uniforms: this.uniforms,
		vertexShader: this.shader.vertexShader,
		fragmentShader: this.shader.fragmentShader

	} );

	this.compFsQuad = new Pass.FullScreenQuad( this.shaderMaterial );

	var material = new MeshBasicMaterial();
	this.copyFsQuad = new Pass.FullScreenQuad( material );

};

AfterimagePass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: AfterimagePass,

	render: function ( renderer, writeBuffer, readBuffer ) {

		this.uniforms[ "tOld" ].value = this.textureOld.texture;
		this.uniforms[ "tNew" ].value = readBuffer.texture;

		renderer.setRenderTarget( this.textureComp );
		this.compFsQuad.render( renderer );

		this.copyFsQuad.material.map = this.textureComp.texture;

		if ( this.renderToScreen ) {

			renderer.setRenderTarget( null );
			this.copyFsQuad.render( renderer );

		} else {

			renderer.setRenderTarget( writeBuffer );

			if ( this.clear ) renderer.clear();

			this.copyFsQuad.render( renderer );

		}

		// Swap buffers.
		var temp = this.textureOld;
		this.textureOld = this.textureComp;
		this.textureComp = temp;
		// Now textureOld contains the latest image, ready for the next frame.

	},

	setSize: function ( width, height ) {

		this.textureComp.setSize( width, height );
		this.textureOld.setSize( width, height );

	}

} );

export { AfterimagePass };