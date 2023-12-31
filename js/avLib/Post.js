import * as Tone from 'tone'; 

class Post {

    // ajuste de ganancia    
    // compresor dinámico
    // filtros
    // Reverb
    // ¿Módulo dentro de web audio api? Podría ir directamente aquí
    // salida a destination 

    constructor(aCtx){ //
	// aCtx.resume(); 

	this.audioCtx = aCtx;
	//Tone.context.close(); 
	Tone.setContext(this.audioCtx);
	this.reverb = new Tone.Reverb({decay: 1, predecay: 0.5}); 
	// this.input = input;
	//this.channels = numChannels;
	//INICIOS
	// entrada, ajuste de ganancia 
	// grain.connect(Post.input);

	this.input = this.audioCtx.createGain();

	// la ganancia de cada canal tiene que ser ajustada desde antes
	// creo que hay una mezcladora que podría funcionar
	this.compressor = this.audioCtx.createDynamicsCompressor();
	this.filter = this.audioCtx.createBiquadFilter();
	// reverb, podría usar módulos de tone
	//console.log(Tone.context); 
	// this.freeverb.dampening.value = 1000;

	this.output = this.audioCtx.createGain();
	
	// CONEXIONES
	// lo que sea que se produzca se conecta aquí 
	//this.input.connect(this.compressor);
	//this.compressor.connect(this.filter);

	//Tone.connect(this.input, this.compressor);
	Tone.connect(this.input, this.reverb);
	Tone.connect(this.reverb, this.output);
	//this.filter.connect(this.output);
	
	this.output.connect(this.audioCtx.destination); 
		
    }

    gain = function(gain){
	this.output.gain.setValueAtTime(gain, this.audioCtx.currentTime)
    }
    
}

export { Post } 
