import * as THREE from 'three';
import { VideoSetup, GLTFLd, Feedback, UnrealBloom } from "../js/avLib/videoSetup"
import { HydraTex } from '../js/avLib/hydraSetup' // en deep se perdió esta referencia. HydraTex podría ser sustituído en el futuro por un generador de shaders
import { AudioSetup, Analyser, Grain, UploadFile, Load } from '../js/avLib/audioSetup'
import { ImprovedNoise } from '../static/jsm/math/ImprovedNoise.js';
import { EditorParser } from '../js/avLib/editorParser'
import * as TWEEN from 'tween'; 
import { FontLoader } from '../static/jsm/loaders/FontLoader.js';
import { Player } from '../js/avLib/Player.js'; 
import { map_range } from '../js/avLib/utils.js';
import { Post } from '../js/avLib/Post.js';
// import { RTarget } from '../js/avLib/rtSetup.js'; 
// import { FontLoader } from './static/jsm/loaders/FontLoader.js';


let a = new AudioSetup(); 
let th = new VideoSetup(); 
const hy = new HydraTex();

// Provisionalmente pendiente 

//import data from "bundle-text:./inicio.txt" // works!
//let arrlines = data.split("\n"); 

///////////////////////////////////////////////////
// render target

const rtWidth = 1920;
const rtHeight = 1080;
const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, { format: THREE.RGBAFormat } );
const rtFov = 75;
const rtAspect = rtWidth / rtHeight;
const rtNear = 0.1;
const rtFar = 5;
const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
rtCamera.position.z = 4;
const rtScene = new THREE.Scene();
//rtScene.background = 0x000000; 
//rtScene.background = new THREE.Color( 0x000000 );
rtScene.background = hy.vit; 

let cubort; 
let fuente;
let lineasSelectas = []; 
 
let text = new THREE.Mesh();

const materialrt = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: renderTarget.texture,
    transparent: true,
    //roughness: 0.4,
    //metalness: 0.2
});

const loadertext = new THREE.FileLoader();
lineasInicio = [];

///////////////////////////////////////////////////

const group = new THREE.Group();
let lcbool = false; 

const mouse = [.5, .5]
const audioFile1 = document.getElementById('audio_file1') // onload que lo decodifique 

// const rTarget = new RTarget(); 
// rTarget.setText(); 

//const db = new DbReader();
// db.read("./sql/document.db");

let cosa, cosa2;
let boolCosa; 

// let twC; 
let tween;
let tweenBool = false; 
//const avButton = avButton.addEventListener('click', renderAV);
let cubos2 = []; 

let interStr = ''; 

function renderAV(){
    // la versión render av no debería desplegar code Mirror 
    console.log("render AV"); 
}

document.getElementById("container").onclick = change;

//const pdfButton = document.getElementById('pdf');
//pdfButton.addEventListener('click', printPDF );

// extras intervención oci

const meshes = [],materials = [],xgrid = 14, ygrid = 14;
let material, mesh;
let an;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let materialslc = []; 

let mouseX = 0, mouseY = 0; 
document.addEventListener( 'mousemove', onDocumentMouseMove );

function printPDF(){

      window.open(
          "https://ocelotl.cc/tres", "_blank");
   
    // Hay un problema al seleccionar el texto a imprimir y la impresión. Tal vez es necesario relacionar el análisis del texto con la lectura y no tanto con el método de impresión. 
    // Parece ser que aquí necesitaremos expresiones regulares para hacer cosas como limpiar la base o separar cada cierto número de caracteres y agregar nuevas hojas.
    // También hace falta diseñar la base de datos desde trilium y subir esto para que pueda trabajar directamente con la base del servidor. 

}

const clock = new THREE.Clock();

//const fixButton = document.getElementById('edit');
//fixButton.addEventListener('click', init);

let cubos = [];
let geometry; 
// const geometry = new THREE.SphereGeometry(2, 3, 4 );
//const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: hy.vit } );
let pX = [], pY = [], pZ = []; 

let sphere; 
let raycaster;
let INTERSECTED;
const pointer = new THREE.Vector2();
 
let menuC1str = ['regresar', '+ info', 'auto', 'live-codeame', 'imprimir']; 
// const group = new THREE.Group();

var cursorX;
var cursorY;

init(); // los elementos particulares de este init podrían ir en otro lado. En todo caso podría delimitar la escena que antes se detonaba con esta función.     
function init(){

    a.initAudio();

    /*
    audioFile1.addEventListener("change", (event) => {
	const archivo = new LoadFile(a.audioCtx, audioFile1);
	});
    */

    // console.log(a.audioCtx); 
    raycaster = new THREE.Raycaster();
    document.addEventListener( 'mousemove', onPointerMove );
    
    // documentinde.body.style.cursor = 'none';
    th.initVideo();
    th.camera.position.z = 200;
    //th.scene.background = renderTarget.texture; 
    // th.scene.background = hy.vit; 
    
    const light = new THREE.PointLight(  0xffffff, 1 );
    light.position.set( 0, 0, 500 );
    th.scene.add( light );

    const light2 = new THREE.PointLight(  0xffffff, 1 );
    light2.position.set( 0, 0, 20 );
    th.scene.add( light2 );
    
    th.renderer2.outputColorSpace = THREE.LinearSRGBColorSpace;
    // th.renderer2.toneMapping = THREE.ReinhardToneMapping;
    // th.renderer2.toneMappingExposure = Math.pow( 0.6, 1.5 )
    
    // un = new UnrealBloom(th.scene, th.camera, th.renderer2); 
    // retro = new Feedback(th.scene, th.renderer2, 1080);
    const geometry44 = new THREE.BoxGeometry( 100, 100, 100 ); 
    const material44 = new THREE.MeshStandardMaterial( { color: 0xffffff, map: renderTarget.texture, roughness: 0.6 } ); 
    sphere44 = new THREE.Mesh( geometry44, material44 );

    // rTarget.setText(); 
    sphere44.userdata = {id:'iniciar'};
    console.log(sphere44.userdata.id); const group = new THREE.Group();

    th.scene.add( sphere44 );
    // sphere44.position.z = -20; 

    document.onmousemove = function(e){
	cursorX = e.pageX;
	cursorY = e.pageY;
    }

    osc(4, ()=>cursorX*0.001, 2 ).color(1, 0, 0.6).rotate([1, 0.01, 0.5, 0.25].smooth(), 0.1, 0.5).mult(osc(1, 2)).modulateScrollX(o0, 0.999).out(o0);

    /*
    osc(6, 0, 0.8)  .color(1, 0.1,.90)
	.rotate(0.92, 0.3)  .mult(osc(4, 0.03).thresh(0.4).rotate(0, -0.02))
	.modulateRotate(osc(20, 0).thresh(0.3, 0.6), [1,2,3,4].smooth())  .out(o0)
    */
    
    container = document.getElementById( 'container' );
    container.appendChild(th.renderer2.domElement);
 
    cubeCount = 0;

    let ox, oy, geometryTex;

    const ux = 1 / xgrid;
    const uy = 1 / ygrid;

    const xsize = 200 / xgrid;
    const ysize = 200 / ygrid;
    
    for(let i = 0; i < menuC1str.length; i++){
	
	const geometry = new THREE.BoxGeometry( 8, 1.25, 1.25); 
	change_uvs( geometry, ux, uy, 0, i);
	materials[i] = new THREE.MeshStandardMaterial({color:0xffffff,map:hy.vit, roughness:0.4});
	//const material = new THREE.MeshStandardMaterial( {color: 0x00ff00} );
	material2 = materials[i]; 
	cubos[i] = new THREE.Mesh( geometry, material2 );    

	/*
	var posX, posY, posZ;
	var theta1 = Math.random() * (Math.PI*2);
	var theta2 = Math.random() * (Math.PI*2); 
	posX = Math.cos(theta1) * Math.cos(theta2)*1;
	posY = Math.sin(theta1)*1;
	posZ = Math.cos(theta1) * Math.sin(theta2)*1;
	pX[i] = posX;
	pY[i] = posY;
	pZ[i] = posZ;
	*/
	
	const desfase = Math.random()*8; 
	cubos[i].position.y = ((i+1) *2)-5; 
	cubos[i].position.x = desfase -4;
	cubos[i].lookAt(0, 0, -10); 
	//cubos[i].position.z = pZ[i] * 2;
	//th.scene.add(cubos[i]);
	cubos[i].userdata = {id: menuC1str[i]}; 
	// group.add(cubos[i]);
	th.scene.add(cubos[i]); 
	
    }

    texto(); 
    // realmente no es necesario, la textura pasa a otro lado 
    
    //const geometryrt = new THREE.BoxGeometry( 8, 8, 8 );
    //cubort = new THREE.Mesh( geometryrt, materialrt );
    //th.scene.add( cubort ); 

    // texto(); 
    // twC = new twCamera(th.camera); 
    animate(); 
    
}

function onPointerMove( event ) {
    
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
}

function animate(){ 
 
    var time2 = Date.now() * 0.00001;

    th.camera.updateMatrixWorld();

    // si esta activado el modo lc 

    text.position.x = Math.sin(time2*20) * 2; 

    text.position.y = Math.cos(time2*10) * 1; 
	
    if(lcbool == true){

	let cC = 0;
	
	for(let i = 0; i < xgrid; i++){
	    for (let j = 0; j < ygrid; j++){
		cubos2[cC].position.x = 1+(pX[cC]* (Math.sin(time2+i)* 2));
		cubos2[cC].position.y = 1+(pY[cC]* (Math.sin(time2+j)* 1));
		cubos2[cC].position.z = 1+(pZ[cC]* (Math.sin(time2+i+j)* 3));

		cubos2[cC].rotation.x += Math.sin(time2+i)*0.002; 
		cubos2[cC].scale.x = Math.sin(time2+i+j)*1;
		
		//cubos2[cC].lookAt(0, 0, -10); 
		cC++; 
	    }
    }
	
	//group.rotation.x += 0.001;
	//group.rotation.y -= 0.001; 
    }

    
    th.camera.position.x += ( mouseX - th.camera.position.x *0.5) * .5;
    th.camera.position.y += ( - mouseY - th.camera.position.y ) * .5;
    th.camera.lookAt( th.scene.position );


    if(boolCosa){
	// la función map aquí no funciona jaja
	// parece que no funciona dinámicamente, solo una vez, al inicio. 
	cosa.pointer = cursorX / 20;
	cosa2.pointer = cursorY /20; 
	//cosa.pointer = map_range(cursorX, 0, 1920, 0, 1);
	//cosa2.pointer = map_range(cursorY, 0, 1920, 0, 1); 
	cosa.freqScale =  (cursorY/100)-2.2;
	cosa2.freqScale = (cursorY/100)-2.2*2;
	// cosa.freqScale = map_range(cursorY, 0, 1080, 0.5, 4);
	// console.log((cursorY/200)-2.2); 
    }    

    //let interStr = ''; 
    // find intersections

    /*
    for(let i = 0; i < menuC1str.length; i++){
	cubos[i].scale.x = Math.sin(((time2*0.1)+i*2))*0.5; 
	}
    */
    
    raycaster.setFromCamera( pointer, th.camera );
    const intersects = raycaster.intersectObjects( th.scene.children, true );

    if ( intersects.length > 0 ) {
	if ( INTERSECTED != intersects[ 0 ].object ) { // si INTERSECTED es tal objeto entonces realiza tal cosa

	    // console.log(intersects[ 0 ].object.userdata); 

	    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
	    
	    INTERSECTED = intersects[ 0 ].object;
	    INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
	    INTERSECTED.material.emissive.setHex( 0xb967ff );
	    /// primer nivel 
	    document.getElementById("container").style.cursor = "pointer";
	    interStr = INTERSECTED.userdata.id;
	    // console.log(interStr);
	    document.getElementById("instrucciones").innerHTML = interStr;
	     
	}
	
    } else {
	
	if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
	
	INTERSECTED = null;
	document.getElementById("container").style.cursor = "default";
	interStr = '';
	document.getElementById("instrucciones").innerHTML = "";
    }

    
    
    TWEEN.update();
   
    hy.vit.needsUpdate = true; 
    const delta = clock.getDelta();

    renderTarget.flipY = true; renderTarget.needsUpdate = true;

    th.renderer2.setRenderTarget(renderTarget);
    
    th.renderer2.setClearColor(0x000000, 0);
    th.renderer2.render(rtScene, rtCamera);
    th.renderer2.setRenderTarget(null);
    
    th.renderer2.render( th.scene, th.camera );
    // un.render2(delta);
    requestAnimationFrame( animate );

}
    
// ¿Esto también podría ir a otra parte?

function change(){
    
    if(interStr == 'imprimir'){
	printPDF(); 
    }
 
    if(interStr == 'iniciar'){

	// cargar un archivo, poner un loader o algo así
	// pasar el reloj al smpl sin que se pierda la secuencia y el audioctx 
	//const smpl = new Player(a.audioCtx, audioFile1); // tercer parámetro de reloj y que internamente decida o de plano enviar todo al control	
	// smpl.sequence([1, 0, 0, 1, 0]); // es el reloj
	// let algo = new UploadFile(a.audioCtx, audioFile1);

	//let otro = new Load(a.audioCtx, 'snd/cello.mp3');
	//console.log(otro.buffer); 
	// let pl2 = new Player2(a.audioCtx);
	
	//pl2.play();
	
	const coords = {x: th.camera.position.x,
			y: th.camera.position.y,
			z: th.camera.position.z} // Start at (0, 0)
	
	tween = new TWEEN.Tween(coords, false) // Create a new tween that modifies 'coords'.
	    .to({x: 0, y: 0, z: 10}, 2000) // Move to (300, 200) in 1 second.
	    .easing(TWEEN.Easing.Quadratic.InOut) // Use an easing function to make the animation smooth.
	    .onUpdate(() => {
		th.camera.position.z=coords.z;
		// console.log(coords); 
	    })  
	    .onStart(() => {
	// 	th.camera.remove(sphere44); 
		// Pienso que onComplete está bien para eliminar objetos no utilizados
		// Podría reproducir algún sonido 
		document.getElementById("info").innerHTML = ""; // cuando tween termine 
	    })
	    .onComplete(() => {

/*
		// parece que solamente puede funcionar un Player por vez
		let buffer = 0; 
		let reader = new FileReader();    
		reader.onload = function (ev) {
inde		    a.audioCtx.decodeAudioData(ev.target.result).then(function (buffer2) {
			buffer = buffer2;
			boolCosa = true; 
			cosa = new Player2(a.audioCtx);
			//buffer, pointer, freqScale, windowSize, overlaps, windowratio/
			cosa.set(buffer, Math.random(), 2, 1.5, 0.1, 0.6);
			cosa.start();
		    })
		}
		reader.readAsArrayBuffer(audioFile1.files[0]);
		})
*/
		const request = new XMLHttpRequest();
		request.open('GET', 'snd/ani.mp3', true);
		request.responseType = 'arraybuffer';
		self.buffer = 0; 
		// console.log(this.request.response); 
		
		request.onload = function() {
		    let audioData = request.response;
		    // console.log(audioData); 
		    a.audioCtx.decodeAudioData(audioData, function(buffer) {
			// buffer = buffer2;
			boolCosa = true; 

			const post = new Post(a.audioCtx); 
			cosa = new Grain(a.audioCtx);
			cosa2 = new Grain(a.audioCtx);
			post.gain(4);
		 
		
			//buffer, pointer, freqScale, windowSize, overlaps, windowratio/
			cosa.set(buffer, Math.random(), 2, 0.5, 0.05, 0);
			cosa.start();
			cosa.gainNode.connect(post.input); 
			//buffer, pointer, freqScale, windowSize, overlaps, windowratio/
			cosa2.set(buffer, Math.random(), 1, 0.15, 0.05, 0);
			cosa2.start()
			cosa.gainNode.connect(post.input); 
	 
	 		//cosa.gain(0.25); 
		    },
					       function(e){"Error with decoding audio data" + e.error});
	
    }
    
	    	request.send();
	    })

	
	//trambién hay onComplete
	    .start() // Start the tween immediately. No poner alguna propiedad, supongo que sustituye el tiempo de inicio y llegada. 
    }

    if(interStr == 'live-codeame'){
	livecodeame(); 
    }
        
    if(interStr == 'regresar'){
	
	const coords = {x: th.camera.position.x,
			y: th.camera.position.y,
			z: th.camera.position.z} // Start at (0, 0) 

	tween = new TWEEN.Tween(coords, false) // Create a new tween that modifies 'coords'.
	    .to({x: 0, y: 0, z: 200}, 2000) // Move to (300, 200) in 1 second.
	    .easing(TWEEN.Easing.Quadratic.InOut) // Use an easing function to make the animation smooth.
	    .onUpdate(() => {
		th.camera.position.z=coords.z;
	    })  
	    .onStart(() => {
	// 	th.camera.remove(sphere44); 
		// Pienso que onComplete está bien para eliminar objetos no utilizados
		// Podría reproducir algún sonido 
		document.getElementById("info").innerHTML = 'portada'; // cuando tween termine 
	    })
	//trambién hay onComplete
	    .start() // Start the tween immediately.
    }
}

function change_uvs( geometry, unitx, unity, offsetx, offsety ) {
    const uvs = geometry.attributes.uv.array;
    for ( let i = 0; i < uvs.length; i += 2 ) {
	uvs[ i ] = ( uvs[ i ] + offsetx ) * unitx;
	uvs[ i + 1 ] = ( uvs[ i + 1 ] + offsety ) * unity;
    }
}

function onDocumentMouseMove( event ) {
    mouseX = ( event.clientX - windowHalfX ) / 100;
    mouseY = ( event.clientY - windowHalfY ) / 100;
}

function livecodeame(){

    lcbool = true; 
    console.log("lc");

const par = new EditorParser();     
    
    // remover
    // esto podría tener una rampa
    // falta el dispose
    
    for(let i = 0; i < menuC1str.length; i++){
	th.scene.remove(cubos[i]); 
    }

    th.scene.remove(sphere44);

    // agregar

    const ux = 1 / xgrid;
    const uy = 1 / ygrid;

    const xsize = 1000 / xgrid;
    const ysize = 1000 / ygrid;

    let cCount = 0;
    
    // podrían tener un orden inicial y luego descomponerse 

    // malla de 2x2 ¿Podría ser de otra manera?
    
    for(let i = 0; i < xgrid; i++){
	for (let j = 0; j < ygrid; j++){

	    //const geometry22 = new THREE.SphereGeometry(1, 3, 4 );
	    const geometry22 = new THREE.BoxGeometry(4, 2, 2); 
	    change_uvs( geometry22, ux, uy, i, j );
	    // podría no hacer referencia a hydra sino a otra cosa, por ejemplo podrían tener formas, colores y materiales distintos dependiendo del capítulo o del tipo de nota. 
	    // materialslc = new THREE.MeshStandardMaterial( { color: 0x6a6a6a, roughness: 0.5, metalness:0.1 } );
	    materialslc[ cCount ] = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0.5, metalness:0.1, map: renderTarget.texture } );
	    // materials[ cubeCount ] = new THREE.MeshLambertMaterial( parameters );
	    let material2lc = materialslc[ cCount ];
	    
	    cubos2[cCount] = new THREE.Mesh( geometry22, material2lc );
	    
	    var posX, posY, posZ;
	    var theta1 = Math.random() * (Math.PI*2);
	    var theta2 = Math.random() * (Math.PI*2); 
	    posX = Math.cos(theta1) * Math.cos(theta2)*1;
	    posY = Math.sin(theta1)*1;
	    posZ = Math.cos(theta1) * Math.sin(theta2)*1;
	    pX[cCount] = posX*15;
	    pY[cCount] = posY*15;
	    pZ[cCount] = posZ*15; 
	    cubos2[cCount].position.x = pX[cCount]  ; 
	    cubos2[cCount].position.y = pY[cCount] ;
	    cubos2[cCount].position.z = pZ[cCount]  ;
	    cubos2[cCount].rotation.x = Math.random() * 360; 
	    cubos2[cCount].rotation.y = Math.random() * 360; 
	    cubos2[cCount].rotation.z = Math.random() * 360;
	    cubos2[cCount].userdata = {id:'cubo'+cCount};
	    // console.log(cubos2[cCount].userdata.id); 
	    group.add(cubos2[cCount]); 
	    // th.scene.add( cubos2[cCount] );
	    cCount++;
	    
	}
    }

    th.scene.add(group); 
    
}

function texto( mensaje= "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." ){
    //const materialT = new THREE.MeshStandardMaterial({color: 0xffffff, metalnenss: 0.8, roughness: 0.2, flatShading: true});

    const loader = new FontLoader();
    const font = loader.load(
	// resource URL
	'fonts/Dela_Gothic_One_Regular.json',
	
	// onLoad callback
	function ( font ) {
	    fuente = font; 
	    // do something with the font
	    console.log( font );
    
	    const materialT = new THREE.MeshBasicMaterial({color: 0xffffff});
	    text.material = materialT; 
	    const shapes = fuente.generateShapes( mensaje, 0.075 );
	    const geometry = new THREE.ShapeGeometry( shapes );
	    // textGeoClon = geometry.clone(); // para modificar
	    text.geometry.dispose(); 
	    text.geometry= geometry;
	    geometry.computeBoundingBox();
	    geometry.computeVertexNormals(); 
	    const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
	    geometry.translate( xMid, 0, 0 );
	    //geometry.rotation.x = Math.PI*2;
	    text.geometry= geometry;
	    rtScene.add(text);
	    text.rotation.y = Math.PI * 2
	    //text.rotation.z = Math.PI *2
	    
	    text.position.y = 0;
	    //text.position.x = -4; 
	    //let lineasSelectas = [];
	}
    )
}
