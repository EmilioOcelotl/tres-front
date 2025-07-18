import * as THREE from 'three';
import { VideoSetup, GLTFLd, Feedback, UnrealBloom } from "../js/avLib/videoSetup"
import { HydraTex } from '../js/avLib/hydraSetup'
import { AudioSetup, Analyser, UploadFile, Load } from '../js/avLib/audioSetup'
//import { ImprovedNoise } from '../static/jsm/math/ImprovedNoise.js'; // esto podría funcionar para el futuro 
import { EditorParser } from '../js/avLib/editorParser'
import * as TWEEN from 'tween';
import { FontLoader } from '../static/jsm/loaders/FontLoader.js';
// import { Sequencer } from '../js/avLib/Sequencer.js';
import { buscarEnFreeSound } from '../js/Search.js';
//import { Post } from '../js/avLib/Post.js';
import { DbReader, dbParser, createDoc } from '../js/avLib/dbSetup2';
import { OrbitControls } from '../static/jsm/controls/OrbitControls.js';
//import { TransformControls } from '../static/jsm/controls/TransformControls.js'; 
const keyword_extractor = require("keyword-extractor");
// const { map_range } = require('../js/avLib/utils.js');
import { url, apiKey } from './config.js';
import { Grain } from '../js/Grain'; 
import { GLoop } from '../js/GLoop';
import { map_range } from '../js/utils.js';
import { Player } from '../js/Player.js'; 
const data = require('./../static/json/imgs.js');
// console.log(data.default.imgs[0].img)
import {track0} from '../static/data/tracks.js';
import { CSS2DRenderer, CSS2DObject } from '../js/CSS2DRenderer.js';

let labelRenderer; 
// para el futuro
// const trackKeys = Object.keys(tracks);

/*
trackKeys.forEach(key => {
    const track = tracks[key];
    console.log(`Track ${key}:`, track);
});
*/

//console.log(Object.keys(track0).length)


let scCount = 0; 
let primeraAnimacion = false; 
// bd, sn, hi, gr, vc, bs, sm; 
// let pistas = []; 

// Realiza la solicitud GET a la API de Freesound
// audioRequest("texto");
//const apiUrl = 'https://freesound.org/apiv2';

let freeURL;

let mainPointer = [0, 0.5, 1];
let mainDurss = [0.5];
let sentiment = []; // Pendiente hacer que esto sea un arreglo por oraciones 

// quitar 
// import Text from 'markov-chains-text';

//let salir = false;

// addEventListener("click", (event) => { click = !click });
// document.getElementById("instrucciones").innerHTML = interStr;
const imageContainer = document.querySelector('.image-container');

const print = document.getElementById('print');
print.addEventListener('click', printPDF);

// editorP.style.display = 'none';

const ed = document.getElementById('editor');
ed.style.display = 'none';

const volume = document.getElementById('volume');
volume.addEventListener('click', volFunc)

let volBool = false; 

function volFunc(){
	volBool = !volBool; 
	console.log("volumen");
	if(volBool){
		a.audioCtx.resume(); // Para detener la reproducción de audio 
		volume.classList.remove('fa-volume-xmark');
		volume.classList.add('fa-volume-up');
	}else {
		a.audioCtx.suspend();
		volume.classList.remove('fa-volume-up');
		volume.classList.add('fa-volume-xmark');
	}
}

let codeBool = false;

const backHy = document.getElementById('backgroundHy');
backHy.addEventListener('click', backgroundFunc);

let backBool = false; // para activar o desactivar el fondo

const infoButton = document.getElementById('information');
infoButton.addEventListener('click', informationFunc);

let infoBool = false;

const disposeButton = document.getElementById("delete");
disposeButton.addEventListener('click', disposeLines);

let notas = [];
let sphCap = [];
//let noteBool = false; 
let mensajes = []; 
//const par = new EditorParser();     
const a = new AudioSetup();


const th = new VideoSetup();
const hy = new HydraTex();
const db = new DbReader()

a.initAudio();
//let player = new Player(a.audioCtx);

let players = []; 

for(let i = 0; i < 2; i++){ // cantidad total de players, diferenciar entre grains y players
	players.push(new Player(a.audioCtx))
}

let cosa = new Grain(a.audioCtx);
players.push(new GLoop( {grain: cosa}))

console.log(players)
// const gloop = new GLoop({ grain: cosa });

let boolCosa;

db.read("./sql/document.db");

let markdown = [];
let controls;

const colors = [
    0x993366, // Dusty Rose
    0x3399CC, // Steel Blue
    0x996633, // Mocha
    0x3399CC, // Steel Blue
    0x996633, // Mocha
    0x669966  // Sage Green
];

///////////////////////////////////////////////////
// splines 

// Parece que todo lo que está abajo hace referencia a las trayectorias. Esto se podría retomar después para las versiones remixeadas entre rolas. 

let positions = [];
//const ARC_SEGMENTS = 200;
// const splines = {};
let geometryCurve = new THREE.LineBasicMaterial();
let materialCurve = new THREE.LineBasicMaterial();
let curveObject = new THREE.Line();
let curve1 = new THREE.CatmullRomCurve3();

const geometryP1 = new THREE.SphereGeometry(0.5, 32, 16);
const materialP1 = new THREE.MeshBasicMaterial({ color: 0x05ffa1 });
const sphereP1 = new THREE.Mesh(geometryP1, materialP1);

///////////////////////////////////////////////////
// render target
// demasiado costoso de mantener. Podría servir para impermanent otros proyectos pero mientras tanto se puede deshechar 

const rtWidth = 1920 * 2;true
const rtHeight = 1080 * 2;
const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, { format: THREE.RGBAFormat });
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
let fuente;
let text = new THREE.Mesh();

// Render target. Esto puede funcionar después. Queda comentado

/*
  const materialrt = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  map: renderTarget.texture,
  transparent: true,
  //roughness: 0.4,
  //metalness: 0.2
  });
*/

///////////////////////////////////////////////////

//const group = new THREE.Group();
let lcbool = false;

//const mouse = [.5, .5]
//const audioFile1 = document.getElementById('audio_file1') // onload que lo decodifique 

// const rTarget = new RTarget(); 
// rTarget.setText(); 



// let twC; 
//let tween;
//let tweenBool = false; 
//const avButton = avButton.addEventListener('click', renderAV);
//let cubos2 = []; 
let interStr = '';

document.getElementById("container").onclick = change;

//const pdfButton = document.getElementById('pdf');
//pdfButton.addEventListener('click', printPDF );

// Importante: resolver el problema de la iteración doble y la cantidad total de notas
//const meshes = [],materials = [];

const xgrid = 11, ygrid = 11; // según es el contexto de render target. Puede funcionar para otras cosas 
//let material, mesh;
//let an;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

//let materialslc = []; 

//let mouseX = 0, mouseY = 0; 
document.addEventListener('mousemove', onDocumentMouseMove);

function printPDF() {
    window.open("https://print.ocelotl.cc", "_blank");
}

const clock = new THREE.Clock();

// preguntarse si puede estar de otra manera que como variable global 

let raycaster;
let INTERSECTED
const pointer = new THREE.Vector2();


// let menuC1str = ['regresar', '+ info', 'auto', 'live-codeame', 'imprimir']; // ahora usamos userid asignado directamente a los objetos. Este menú ya no existe 
// const group = new THREE.Group();

var cursorX;
var cursorY;
let fBool = false;

init(); // los elementos particulares de este init podrían ir en otro lado. En todo caso podría delimitar la escena que antes se detonaba con esta función.     
function init() {

    console.log(a.audioCtx); 
    a.audioCtx.suspend(); // Para detener la reproducción de audio 

    loadFont();

    raycaster = new THREE.Raycaster();
    document.addEventListener('mousemove', onPointerMove);

    // documentinde.body.style.cursor = 'none';
    th.initVideo();
    th.camera.position.z = 200;
    //th.scene.background = renderTarget.texture; 
    //th.scene.background = hy.vit; 
    th.scene.background = new THREE.Color(0x010101);

    th.scene.add(new THREE.AmbientLight(0xcccccc));

    //th.renderer2.outputColorSpace = THREE.LinearSRGBColorSpace;
    // th.renderer2.toneMapping = THREE.ReinhardToneMapping;
    th.renderer2.toneMappingExposure = Math.pow(1, 4)

    un = new UnrealBloom(th.scene, th.camera, th.renderer2);
    // retro = new Feedback(th.scene, th.renderer2, 1080);
    const geometry44 = new THREE.SphereGeometry(80, 64, 64);
    const material44 = new THREE.MeshStandardMaterial({ color: 0xffffff, map: renderTarget.texture, roughness: 0.6 });
    sphere44 = new THREE.Mesh(geometry44, material44);



    // rTarget.setText(); 
    sphere44.userdata = { id: 'Tres Estudios Abiertos</br></br>Escritura de código en Javascript para el performance audiovisual y la investigación artística </br></br>ESC para cerrar esta ventana y recuperar el control del punto de vista'};


    th.scene.add(sphere44);
    // sphere44.position.z = -20;

    const geoTres = new THREE.SphereGeometry(2, 32, 32);
    const matTres = new THREE.MeshStandardMaterial({ color: colors[2], emissive: colors[2] });
    sphTres = new THREE.Mesh(geoTres, matTres);

    // rTarget.setText(); 
    sphTres.userdata = { id: 'Tres Estudios Abiertos</br></br>Escritura de código en Javascript para el performance audiovisual y la investigación artística </br></br>ESC para cerrar esta ventana y recuperar el control del punto de vista'};

    th.scene.add(sphTres);

    document.onmousemove = function (e) {
	cursorX = e.pageX;
	cursorY = e.pageY;
    }
    
    // osc(() => cursorY * 0.01, () => cursorX * 0.001, 0).color(0.4, 0.4, 0.4).rotate(0.1, 0.1, 0.5).mult(osc(0.1, 1)).modulateScrollX(o0, 0.99).out(o0);

    /*
      osc(6, 0, 0.8)  .color(1, 0.1,.90)
      .rotate(0.92, 0.3)  .mult(osc(4, 0.03).thresh(0.4).rotate(0, -0.02))
      .modulateRotate(osc(20, 0).thresh(0.3, 0.6), [1,2,3,4].smooth())  .out(o0)
    */

    container = document.getElementById('container');
    container.appendChild(th.renderer2.domElement);

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	labelRenderer.domElement.style.pointerEvents = 'none';
	document.getElementById( 'container' ).appendChild( labelRenderer.domElement );


    cubeCount = 0;
    // las siguientes variables se usaban en el contexto de la fragmentación 
    //let ox, oy, geometryTex;
    //const ux = 1 / xgrid;
    //const uy = 1 / ygrid;
    //const xsize = 200 / xgrid;
    //const ysize = 200 / ygrid;
    controls = new OrbitControls(th.camera, th.renderer2.domElement);
    controls.listenToKeyEvents(window); // optional

    const onKeyDown = function (event) {
	if (event.keyCode == 27) {
	    controls.enabled = true;
	    document.getElementById("instrucciones").innerHTML = "";
	    // document.getElementById("instrucciones").pointer-events = none;
	    document.getElementById("instrucciones").style.pointerEvents = "none";
	    document.getElementById("instrucciones").style.display = "none";
		document.getElementById("mensajes").style.display = "none";
		imageContainer.style.display = 'none';

	}
    }

    document.addEventListener('keydown', onKeyDown);

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.enabled = false;
    //controls.minDistance = 100;
    //controls.maxDistance = 500;
    //curve()
    animate();

    //txtToSeq(); 

}

function onPointerMove(event) {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

function animate() {

    th.camera.lookAt(sphereP1);

    var time1 = Date.now() * 0.00002;
    var time2 = Date.now() * 0.00001;

    controls.update();

    if (positions.length > 3) {

	curveObject.geometry.attributes.position.needsUpdate = true;
	let path = (time1 * 10) % 1;
	let pos = curve1.getPointAt(path);
	sphereP1.position.x = pos.x;
	sphereP1.position.y = pos.y;
	sphereP1.position.z = pos.z;
	cosa.pointer = (pos.x + 40) - 20 / 20;
	cosa.freqScale = (pos.y + 40) - 20 / 10 * 0.25;

    }

    th.camera.updateMatrixWorld();

    // si esta activado el modo lc 

    text.position.x = Math.sin(time2 * 20) * 4;
    text.position.y = Math.cos(time2 * 15) * 2;

    if (!lcbool) {
	sphere44.rotation.x += 0.001;
	sphere44.rotation.y -= 0.002;
    }

    /*
      if(lcbool == true){

      // console.log(sphCap[0]); 
      let cC = 0; // se usaba en iteraciones de cubos

      }
    */

    // Esto se tiene que convertir en otra cosa
    //if (boolCosa) {
	//cosa.pointer = cursorX / 20;
	//cosa.freqScale =  (cursorY/100)-2.2;
	// gloop.update();
	players[2].update(); // esto es esclusivo de los loops. Hay que revisar esto en el futuro 
    //}

    raycaster.setFromCamera(pointer, th.camera);
    const intersects = raycaster.intersectObjects(th.scene.children, true);

    if (intersects.length > 0) {
	if (INTERSECTED != intersects[0].object && intersects[0].object.material.emissive != undefined) { // si INTERSECTED es tal objeto entonces realiza tal cosa

	    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

	    INTERSECTED = intersects[0].object;
	    INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
	    INTERSECTED.material.emissive.setHex(0xb967ff);
	    /// primer nivel 
	    document.getElementById("container").style.cursor = "pointer";
	    infoBool = false;
	    //controls.autoRotate = false; 
	    interStr = INTERSECTED.userdata.id;
		// console.log(INTERSECTED.userdata)
	    
	    if (fBool) {
		onclick = function () {
		    globalCh(INTERSECTED.userdata.track);

		    const TurndownService = require('turndown').default;
		    var turndownService = new TurndownService()

		    // Procesamiento antes de imprimir
		    // INTERSECTED.material.color = 0x05ffa1 ;
		    var markd = markdown[parseInt(INTERSECTED.userdata.id.slice(0, 4))];
		    let markNote = turndownService.turndown(interStr);

		    controls.enabled = false;
		    document.getElementById("instrucciones").style.pointerEvents = "auto";
		    document.getElementById("instrucciones").style.display = "block";
			imageContainer.style.display = 'block';
			
			var numAleatorio = Math.floor(Math.random() * data.imgs.length)
			var imagenSeleccionada = data.imgs[numAleatorio].img; 
			var rutaImagenCompleta = './' + imagenSeleccionada;
			var descripcionImagen = data.imgs[numAleatorio].nota; 
			// console.log(data)

			var imagenElemento = imageContainer.querySelector('img');
			imagenElemento.src = rutaImagenCompleta;

			document.getElementById("mensajes").style.display = "block";
			//document.getElementById("mensajes").innerHTML += "---------------</br>";
			document.getElementById("mensajes").innerHTML += "Sentimiento de la nota: "+INTERSECTED.userdata.sentiment+"</br>";
			document.getElementById("mensajes").innerHTML += "Bloque: "+INTERSECTED.userdata.track+"</br>";
			// document.getElementById("mensajes").innerHTML += "Duraciones: "+INTERSECTED.userdata.dur+"</br>";
		    document.getElementById("mensajes").innerHTML += "Imagen seleccionada: "+rutaImagenCompleta+"</br>";
		    document.getElementById("mensajes").innerHTML += "Descripción: "+descripcionImagen+"</br>";

			document.getElementById("mensajes").innerHTML += "---------------</br>";
			document.getElementById("mensajes").innerHTML += "ESC para recuperar el puntero</br>";

			document.getElementById("mensajes").scrollTop = document.getElementById("mensajes").scrollHeight;
		    document.getElementById("mensajes").style.pointerEvents = "auto";

			//var imagenSeleccionada = data.default.imgs[Math.floor(Math.random() * data.default.imgs.length)];
			//console.log(rutaImagenCompleta)

		    salir = true;
		    // console.log(markNote);
		    txtToSeq(markNote);
		    // Hay una contradicción de bool cosa encontrar algún audio que sea placeholder 
		    if (boolCosa) {
			//llamadas al cambio de audio
			//audioRequest("texto");
			// Esto tiene que filtrarse para cuando son gloops 
				players[2].seqtime = mainDurss;
				players[2].seqpointer = mainPointer.flat();
			//console.log(mainPointer.flat()); 
			// console.log(INTERSECTED.userdata['dur']); // dur funciona, el asunto es que arroja dos elementos menos que el otro arreglo
			//console.log(mainDurss); // otro arreglo  
			//gloop.seqpointer = INTERSECTED.userdata.pos.flat;
			// gloop.seqwindowRandRatio = INTERSECTED.userdata.sentiment; 
			// console.log(sentiment); 
			// console.log(mainPointer.flat());
			//console.log(mainDurss);
	
		    }

		    // console.log(interStr); 
		    controls.target = INTERSECTED.position;
		    document.getElementById("instrucciones").innerHTML = interStr;

			//var imageContainer = document.getElementById('image-container');
			//imageContainer.style.display = 'block';

		    //if(lcbool){
		    //positions.push(INTERSECTED.position);
		    //curve(positions); 
		    //}
		};
	    }
	}

    } else {

	if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

	//controls.autoRotate = true; 
	//controls.autoRotateSpeed = 0.5; 

	INTERSECTED = null;
	document.getElementById("container").style.cursor = "default";
	interStr = '';
	// Lo siguiente parece redundante
	if (!infoBool) {
	    //document.getElementById("instrucciones").innerHTML = "";
	}
    }

    TWEEN.update();

    hy.vit.needsUpdate = true;
    const delta = clock.getDelta();

    renderTarget.flipY = true;
    renderTarget.needsUpdate = true;
    th.renderer2.setRenderTarget(renderTarget);

    th.renderer2.setClearColor(0x000000, 0);
    th.renderer2.render(rtScene, rtCamera);
    th.renderer2.setRenderTarget(null);

    th.renderer2.render(th.scene, th.camera);
	labelRenderer.render( th.scene, th.camera );

    un.render2(delta);

    requestAnimationFrame(animate);

}

// ¿Esto también podría ir a otra parte?
function change() {

    if (interStr == 'imprimir') {
	printPDF();
    }

    if (!primeraAnimacion) {
	saveNotes();
	const coords = {
	    x: th.camera.position.x,
	    y: th.camera.position.y,
	    z: th.camera.position.z
	} // Start at (0, 0)

	tween = new TWEEN.Tween(coords, false) // Create a new tween that modifies 'coords'.
	    .to({ x: 0, y: 0, z: 20 }, 4000) // Move to (300, 200) in 1 second.
	    .easing(TWEEN.Easing.Quadratic.InOut)
	    .onUpdate(() => {
		th.camera.position.z = coords.z;
	    })
	    .onStart(() => {
		document.getElementById("info").innerHTML = ""; // cuando tween termine 
		document.getElementById("info").style.display = "none"; // quitarlo completamente

	    })
	    .onComplete(() => {
		// Pasar los datos de txtToSeq 
		livecodeame();
		primeraAnimacion = true; 
		// audioRequest("texto"); 
	    })
	    .start()
    }
}

function change_uvs(geometry, unitx, unity, offsetx, offsety) {
    const uvs = geometry.attributes.uv.array;
    for (let i = 0; i < uvs.length; i += 2) {
	uvs[i] = (uvs[i] + offsetx) * unitx;
	uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
    }
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
}

function livecodeame() {

    th.scene.remove(sphere44);
    th.scene.add(sphereP1);

    lcbool = true;
    console.log("lc");
    controls.enabled = true;
    const ux = 1 / xgrid;
    const uy = 1 / ygrid;
    const xsize = 1000 / xgrid;
    const ysize = 1000 / ygrid;

    let cCount = 0;

}

function loadFont() {
    const loader = new FontLoader();
    const font = loader.load(
	// resource URL
	'fonts/Dela_Gothic_One_Regular.json',
	// onLoad callback
	function (font) {
	    fuente = font;
	    // console.log(font);
	    fBool = true;
	})
}

function texto(mensaje) {
    //const materialT = new THREE.MeshStandardMaterial({color: 0xffffff, metalnenss: 0.8, roughness: 0.2, flatShading: true});

    const materialT = new THREE.MeshBasicMaterial({ color: 0xffffff });
    text.material = materialT;
    const shapes = fuente.generateShapes(mensaje, 0.5);
    const geometry = new THREE.ShapeGeometry(shapes);
    // textGeoClon = geometry.clone(); // para modificar
    text.geometry.dispose();
    text.geometry = geometry;
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yMid = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    geometry.translate(xMid, yMid, 0);
    //geometry.rotation.x = Math.PI*2;
    text.geometry = geometry;
    text.rotation = Math.PI * time;
    rtScene.add(text);
    text.rotation.y = Math.PI * 2
    //text.rotation.z = Math.PI *2

    //text.position.y = 0;
    //text.position.x = -4; 
    //let lineasSelectas = [];

}

function saveNotes() {

    /*
      const TurndownService = require('turndown').default;	
      var turndownService = new TurndownService()
      
      let markdown = []; 
      
      for(let i = 0; i < db.postdb.length; i++){
      markdown[i] = turndownService.turndown(db.postdb[i].toString());
      }
      
      marksort = markdown.sort();

    */

    for (let i = 0; i < db.postdb.length; i++) {
	markdown[i] = db.postdb[i].toString();
	//const myKeywords = rake(markdown[i])
	//console.log(myKeywords); 
    }

    marksort = markdown.sort();

    var natural = require('natural');
    var tokenizer = new natural.WordTokenizer();
    //console.log(tokenizer.tokenize("your dog has fleas."));
    var Analyzer = require('natural').SentimentAnalyzer;
    var stemmer = require('natural').PorterStemmer;
    var analyzer = new Analyzer("Spanish", stemmer, "afinn");
    // getSentiment expects an array of stringsw

    // aquí ya se leen las notas por fecha de modificación 
    // tendría que organizar las notas por capítulos
    // let aclaraciones = [], introduccion, cap1=[],cap2=[],cap3=[], cap4=[], conclusiones=[],referencias=[];

    let notesCoords = [];

    let sphNotes = [];
    let contCol = 0;
    // let contTotal = 0; 

    const points = [];
    let linecap;
    //points.push( new THREE.Vector3(  0, 0, 0 ) );
    //points.push( new THREE.Vector3( posX/norm*10, posY/norm*10, posZ/norm*10 ) );

    points.push(new THREE.Vector3(0, 0, 0));
    // Filtrar capítulos 
	let labels =[];
	let labelstext = []

    for (let i = 0; i < marksort.length; i++) {
	// Solamente se imprimen notas con más de dos caracteres
	if (marksort[i].length > 2 && marksort[i].slice(6, 7) == "0") {

	    var posX, posY, posZ;
	    var theta1 = Math.random() * (Math.PI * 2);
	    var theta2 = Math.random() * (Math.PI * 2);

	    // guardar estas posiciones en algún lado, serán el eje de rotación de otras esferas

	    /*
	      posX = Math.cos(theta1) * Math.cos(theta2)*15;
	      posY = Math.sin(theta1)*15;Tres Estudios Abiertos
	      posZ = Math.cos(theta1) * Math.sin(theta2)*15;
	    */

	    const phi = Math.acos(-1 + (2 * contCol) / 8);
	    const theta = Math.sqrt(8 * Math.PI) * phi;

	    const posX = Math.cos(theta) * Math.sin(phi);
	    const posY = Math.sin(theta) * Math.sin(phi);
	    const posZ = Math.cos(phi);

	    let norm = Math.sqrt(posX * posX + posY * posY + posZ * posZ);

	    let vec = new THREE.Vector3((posX / norm) * 10, (posY / norm) * 10, (posZ / norm) * 10);
	    notesCoords.push(vec);

	    let nwVec1 = new THREE.Vector3();
	    let nwVec2 = new THREE.Vector3(0, 0, 0);

	    //console.log(nwVec1.subVectors(vec, nwVec2)); 
	    //console.log(vec);
	    const geoCap = new THREE.SphereGeometry(1, 32, 32);
	    const matCap = new THREE.MeshStandardMaterial({ color: colors[0], emissive: colors[0], roughness: 0.4 });
	    sphCap[i] = new THREE.Mesh(geoCap, matCap);
	    // rTarget.setText(); 
	    //sphCap[i].userdata = {id: marksort[i].slice(4)};
	    var test = tokenizer.tokenize(marksort[i].slice(4));
	    sentiment.push(analyzer.getSentiment(test));
	    // console.log(analyzer.getSentiment(test));

	    var localdur = dur(marksort[i].slice(4));
	    var localpos = pos(marksort[i].slice(4));
	    // sphCap[i].userdata = {sentiment: analyzer.getSentiment(test)};
	    sphCap[i].userdata = { track: contCol, id: marksort[i].slice(4), sentiment: analyzer.getSentiment(test), dur: localdur, pos: localpos };


	    // sphCap[i].userdata = {num: contTotal};
	    // console.log(sphCap[i].userdata.pos); 
	    sphCap[i].position.x = vec.x;
	    sphCap[i].position.y = vec.y;
	    sphCap[i].position.z = vec.z;

	    th.scene.add(sphCap[i]);

		labelstext[i] = document.createElement( 'div' );
		labelstext[i].className = 'label';
		labelstext[i].style.color = 'rgb( 255, 255, 255 )';
		labelstext[i].style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
		var titulo = marksort[i].slice(8, marksort[i].indexOf('</h2>'));
		labelstext[i].style.padding = '10px'; 
		labelstext[i].style.borderRadius = '10px';
		
		labelstext[i].textContent = titulo;
	
		labels[i] = new CSS2DObject( labelstext[i] );
		labels[i].position.copy( sphCap[i].position );
		th.scene.add( labels[i] );

	    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
	    points.push(new THREE.Vector3(posX / norm * 10, posY / norm * 10, posZ / norm * 10));

	    // console.log(points); 
	    const curve = new THREE.CatmullRomCurve3(points);
	    const curvePoints = curve.getPoints(500);

	    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
	    linecap = new THREE.Line(geometry, material);
	    contCol++;
	}
    }

    th.scene.add(linecap);

    // Asignar notas en relación a capítulos. Primero tendríamos que saber la cantidad de notas por capítulo
    let notesPerChapter = [];
    let npCh = 0;

    for (let i = 0; i < marksort.length; i++) {
	for (let j = 0; j < notesCoords.length; j++) {
	    // Solamente se imprimen notas con más de dos caracteres
	    if (marksort[i].length > 2 && marksort[i].slice(6, 7) != "0" && marksort[i].slice(4, 5) == (j + 1).toString()) { // y si es distinto al índice de notas
		notesPerChapter[j] = npCh;
		npCh++;
	    }
	}
    }

    //console.log(notesPerChapter); 
    let finalNotesPerChapter = [];

    for (let i = 0; i < notesPerChapter.length; i++) {
	if (i > 0) {
	    finalNotesPerChapter[i] = notesPerChapter[i] - notesPerChapter[i - 1];
	} else {
	    finalNotesPerChapter[i] = notesPerChapter[i];
	}
    }
    // console.log(finalNotesPerChapter);

    contCol = 0
    let contCapituloNota = 0; 
	labels = [];
	labelstext = []; 

    for (let j = 0; j < notesCoords.length; j++) {

	const points2 = [];
	let linenote = 0;
	points2.push(notesCoords[j]);

	for (let i = 0; i < marksort.length; i++) {
	    // Solamente se imprimen notas con más de dos caracteres
	    if (marksort[i].length > 2 && marksort[i].slice(6, 7) != "0" && marksort[i].slice(4, 5) == (j + 1).toString() && j < 5) { // y si es distinto al índice de notas

		var posX, posY, posZ;

		const phi = Math.acos(-1 + (2 * contCol) / finalNotesPerChapter[j]);
		const theta = Math.sqrt(finalNotesPerChapter[j] * Math.PI) * phi;

		const posX = Math.cos(theta) * Math.sin(phi);
		const posY = Math.sin(theta) * Math.sin(phi);
		const posZ = Math.cos(phi);

		let norm = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
		let vec = new THREE.Vector3((posX / norm) * 6, (posY / norm) * 6, (posZ / norm) * 6);

		//console.log(marksort[i].length /1000);
		const geoNotes = new THREE.SphereGeometry(marksort[i].length / 6000, 32, 32);
		const matNotes = new THREE.MeshStandardMaterial({ color: colors[1], emissive: colors[1], roughness: 0.6 });
		sphNotes[i] = new THREE.Mesh(geoNotes, matNotes);
		// rTarget.setText();
		// sphNotes[i].userdata = {id:marksort[i].slice(4)};
		// sphNotes[i].userdata = {num:contTotal};
		var test = tokenizer.tokenize(marksort[i].slice(4));
		sentiment.push(analyzer.getSentiment(test));
		// console.log(analyzer.getSentiment(test));
		//sphNotes[i].userdata = {id: marksort[i].slice(4), sentiment: analyzer.getSentiment(test)};

		var localdur = dur(marksort[i].slice(4));
		var localpos = pos(marksort[i].slice(4));
		// sphCap[i].userdata = {sentiment: analyzer.getSentiment(test)};
		sphNotes[i].userdata = { track: contCapituloNota, id: marksort[i].slice(4), sentiment: analyzer.getSentiment(test), dur: localdur, pos: localpos };
		// console.log(sphNotes[i].userdata);
		// console.log(sphNotes[i].userdata.sentiment); 
		let nPosX = vec.x + notesCoords[j].x;
		let nPosY = vec.y + notesCoords[j].y;
		let nPosZ = vec.z + notesCoords[j].z;

		sphNotes[i].position.x = nPosX;
		sphNotes[i].position.y = nPosY;
		sphNotes[i].position.z = nPosZ;

		th.scene.add(sphNotes[i]);

		labelstext[i] = document.createElement( 'div' );
		labelstext[i].className = 'label';
		labelstext[i].style.color = 'rgb( 255, 255, 255 )';
		labelstext[i].style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
		var titulo = marksort[i].slice(8, marksort[i].indexOf('</h2>'));
		labelstext[i].style.padding = '10px'; 
		labelstext[i].style.borderRadius = '10px';

		labelstext[i].textContent = titulo;
	
		labels[i] = new CSS2DObject( labelstext[i] );
		labels[i].position.copy( sphNotes[i].position );
		th.scene.add( labels[i] );

		const material = new THREE.LineBasicMaterial({ color: 0xffffff });
		points2.push(new THREE.Vector3(nPosX, nPosY, nPosZ));

		// console.log(points2);
		const curve = new THREE.CatmullRomCurve3(points2);
		curve.closed = true;
		const curvePoints = curve.getPoints(250);
		const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
		linenote = new THREE.Line(geometry, material);
		contCol++;
		// contTotal++; 
		// falta guardar la posición de notas y a partir de ahi construir el otro arbol

		if (contCol == finalNotesPerChapter[j]) {
		    contCol = 0;
		    // console.log("si"); 
		}
	    }

	    if (marksort[i].length > 2 && marksort[i].slice(6, 7) != "0" && marksort[i].slice(4, 5) == (j + 2).toString() && j > 4) { // y si es distinto al índice de notas

		var posX, posY, posZ;
		const phi = Math.acos(-1 + (2 * contCol) / finalNotesPerChapter[j + 1]);
		const theta = Math.sqrt(finalNotesPerChapter[j + 1] * Math.PI) * phi;
		const posX = Math.cos(theta) * Math.sin(phi);
		const posY = Math.sin(theta) * Math.sin(phi);
		const posZ = Math.cos(phi);

		let norm = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
		let vec = new THREE.Vector3((posX / norm) * 6, (posY / norm) * 6, (posZ / norm) * 6);
		//console.log(marksort[i].length /1000);
		const geoNotes = new THREE.SphereGeometry(marksort[i].length / 6000, 32, 32);
		const matNotes = new THREE.MeshStandardMaterial({ color: colors[1], emissive: colors[1], roughness: 0.6 });
		sphNotes[i] = new THREE.Mesh(geoNotes, matNotes);
		// rTarget.setText();
		//sphNotes[i].userdata = { track: noteCapituloNota, id: marksort[i].slice(4) };
		sphNotes[i].userdata = { track: contCapituloNota, id: marksort[i].slice(4), sentiment: analyzer.getSentiment(test), dur: localdur, pos: localpos };
		//console.log(marksort[i].slice(4)); 
		let nPosX = vec.x + notesCoords[j].x;
		let nPosY = vec.y + notesCoords[j].y;
		let nPosZ = vec.z + notesCoords[j].z;

		sphNotes[i].position.x = nPosX;
		sphNotes[i].position.y = nPosY;
		sphNotes[i].position.z = nPosZ;

		th.scene.add(sphNotes[i]);

		labelstext[i] = document.createElement( 'div' );
		labelstext[i].className = 'label';
		labelstext[i].style.color = 'rgb( 255, 255, 255 )';
		labelstext[i].style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
		labelstext[i].style.padding = '10px'; 
		labelstext[i].style.borderRadius = '10px';

		var titulo = marksort[i].slice(8, marksort[i].indexOf('</h2>'));

		labelstext[i].textContent = titulo;
	
		labels[i] = new CSS2DObject( labelstext[i] );
		labels[i].position.copy( sphNotes[i].position );
		th.scene.add( labels[i] );

		const material = new THREE.LineBasicMaterial({ color: 0xffffff });
		//const points = [];
		//points.push( notesCoords[j] );
		points2.push(new THREE.Vector3(nPosX, nPosY, nPosZ));

		const curve = new THREE.CatmullRomCurve3(points2);
		curve.closed = true;

		const curvePoints = curve.getPoints(250);

		const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
		linenote = new THREE.Line(geometry, material);

		//th.scene.add(line);

		contCol++;
		// falta guardar la posición de notas y a partir de ahi construir el otro arbol

		if (contCol == finalNotesPerChapter[j + 1]) {
		    contCol = 0;
		    //console.log(finalNotesPerChapter[j+1]);
		}
	    }

	}

	th.scene.add(linenote);
	contCapituloNota++; 
	
    }

    //my_string="hello python world , i'm a beginner"
    // console.log(db.postdb[4].split("root",1)[1])

    /*
    // Esto tiene que ver con la asociación de notas. 
    //console.log(db.postdb[93].split("data-note-path=\"root").pop());
    let unosss = db.postdb[4].split('data-note-path=\"root').pop().split('\"')[0];
    let dossss = db.postdb[93].split('data-note-path=\"root').pop().split('\"')[1]; 
    console.log(unosss); // returns 'two'
    console.log(dossss); 
    */
    
    //let nwregex = /root(.*)\n/g
    //console.log(index); 
    //console.log(regexText.test(db.postdb[4])); 
    // si dos notas coniciden en lo que está entre root y un espacio entonces hay una conexión entre dos puntos 

    let contNota = 0;

    // Sustituir esto 

    for (let i = 0; i < db.postdb.length; i++) {
	if (db.postdb[i].length > 2) {
	    notas[contNota] = db.postdb[i];
	    contNota++;
	}
    }

    /*
    // console.log(notas.join(" "));
    const fakeText = new Text(notas.join(" "));
    //console.log(fakeText); 
    const sentence = fakeText.makeSentence();
    console.log(sentence);
    */

    /*
      for(let i = 0; i < notas.length; i++){
      markdown[i] = turndownService.turndown(notas[i].toString());
      markdown[i] = markdown[i].split(".").join("\n"); 
      }
      
      // queda pendiente eliminar indices 
      console.log(markdown.length);
    */
    // console.log(sphCap[0]); 
    noteBool = true;
    // console.log(sentiment); 
}

// Conexión entre nodos en una especie de secuencia. Ya no se usa pero podría funcionar para el futuro. 

/*
function curve(positions) {
    
    th.scene.remove(curveObject);
    geometryCurve.dispose();
    materialCurve.dispose();
    //Create a closed wavey loop
    curve1 = new THREE.CatmullRomCurve3(positions);
    curve1.closed = true;
    const points = curve1.getPoints(50);
    geometryCurve = new THREE.BufferGeometry().setFromPoints(points);
    // console.log(geometryCurve); 
    materialCurve = new THREE.LineBasicMaterial({ color: 0x05ffa1, linewidth: 5 });
    // Create the final object to add to the scene
    curveObject = new THREE.Line(geometryCurve, materialCurve);
    curveObject.geometry.attributes.position.needsUpdate = true;
    // console.log(geometryCurve);
    th.scene.add(curveObject);
}
*/

function codeEditorFunc() {

    codeBool = !codeBool;
    console.log(codeBool);
    if (codeBool) {
	ed.style.display = 'block';
    } else {
	ed.style.display = 'none';
    }

}

function backgroundFunc() {

    backBool = !backBool;
    console.log(backBool);
    if (backBool) {
	//th.scene.background = renderTarget.texture; 
	th.scene.background = hy.vit;
	// th.scene.background = new THREE.Color( 0x000000 );
    } else {
	th.scene.background = new THREE.Color(0x000000);
    }

}

function informationFunc() {
    infoBool = !infoBool;
    console.log(infoBool);
    document.getElementById("instrucciones").innerHTML = "Clic en la esfera para iniciar.</br>El icono de impresora arroja la versión PDF de este documento.</br>También es posible activar una versión livecodeable y activar y desactivar la textura al fondo. </br>Clic para seleccionar una nota y leerla, ESC para recuperar el control del ratón. </br>Jgs font by Adel Faure. Distributed by velvetyne.fr.";
    document.getElementById("info").innerHTML = "";
}

function disposeLines() {
    // falta detener el movimiento de la esfera 
    th.scene.remove(curveObject);
    geometryCurve.dispose();
    materialCurve.dispose();
    positions = [];
}

// todo esto se puede ir a una función que exista dentro del bloque que agrega las notas con todo e información en userdata


function dur(txt) {

    let ab = "abcdefghijklmnñopqrstuvwxyz";
    //  Extract the keywords
    const extraction_result =
	  keyword_extractor.extract(txt, {
	      language: "spanish",
	      remove_digits: true,
	      return_changed_case: true,
	      remove_duplicates: false
	  });

    var result = [];

    for (let i = 0; i < extraction_result.length; i++) {
	result.push(1 / extraction_result[i].length) * 2000;
    }

    return result;

}

function pos(txt) {

    let ab = "abcdefghijklmnñopqrstuvwxyz";

    //  Extract the keywords
    const extraction_result =
	  keyword_extractor.extract(txt, {
	      language: "spanish",
	      remove_digits: true,
	      return_changed_case: true,
	      remove_duplicates: false

	  });

    var result = [];

    for (let i = 0; i < extraction_result.length; i++) {
	// result.push(1/extraction_result[i].length) * 2000;
	result[i] = [];
	for (let j = 0; j < extraction_result[i].length; j++) {
	    let prov = extraction_result[i];
	    for (k = 0; k < ab.length; k++) {
		if (ab[k] == prov[j]) {
		    var index = ab.indexOf(ab[k]);
		    //console.log(index);
		    var mapR = map_range(ab.indexOf(ab[k]), 0, ab.length, 0, 1);
		    result[i].push(mapR);
		}
	    }
	}
    }

    return result;

}

function txtToSeq(txt) {

    let ab = "abcdefghijklmnñopqrstuvwxyz";

    //  Extract the keywords
    const extraction_result =
	  keyword_extractor.extract(txt, {
	      language: "spanish",
	      remove_digits: true,
	      return_changed_case: true,
	      remove_duplicates: false

	  });

    //console.log(extraction_result);

    let durs = [];
    let poss = [];

    for (let i = 0; i < extraction_result.length; i++) {
	durs.push((1 / extraction_result[i].length) * 32000); // Este número puede estar relacionado con el tamaño 
	poss[i] = [];
	for (let j = 0; j < extraction_result[i].length; j++) {
	    let prov = extraction_result[i];
	    for (k = 0; k < ab.length; k++) {
		if (ab[k] == prov[j]) {
		    var index = ab.indexOf(ab[k]);
		    //console.log(index);
		    var mapR = map_range(ab.indexOf(ab[k]), 0, ab.length, 0, 1);
		    poss[i].push(mapR);
		}
	    }
	}
    }

    mainPointer = poss;
    mainDurss = durs;
    // console.log(durs);
    //console.log(poss.flat()); 

}

// esto funciona para obtener todas las muestras que tengo en mi perfil. 


function audioRequest(string) { // Aquí tengo que agregar algún tipo de información proveniente de la nota.
    // console.log(string);
    fetch(url)
	.then(response => response.json())
	.then(data => {
	    let randata = Math.floor(Math.random() * data.results.length);
	    // console.log(randata + " hola");
	    // Maneja la respuesta de la API aquí
	    //console.log(algo.previews);
	    //freeURL = 'https://freesound.org/apiv2/sounds/'+data.results[0].id+'/similar'; // la opción de obtener similares está muy buena!!!!
	    freeURL = 'https://freesound.org/apiv2/sounds/' + data.results[randata].id; // la opción de obtener similares está muy buena!!!!	  
	    //console.log(freeURL);
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', freeURL + '?format=json&token=' + apiKey, true);
	    xhr.onload = function () {
		//console.log('Status:', xhr.status);
		//console.log('Response headers:', xhr.getAllResponseHeaders());
		if (xhr.status >= 200 && xhr.status < 300) {
		    var jsonResponse = JSON.parse(xhr.responseText);
		    var audioPath = jsonResponse.previews['preview-lq-ogg'];
		    //console.log(jsonResponse.previews['preview-lq-ogg']);
		    // cargar el audio
		    const request = new XMLHttpRequest();
		    request.open('GET', audioPath, true);
		    request.responseType = 'arraybuffer';
		    // self.buffer = 0; 
		    request.onload = function () {
			let audioData = request.response;
			a.audioCtx.decodeAudioData(audioData, function (buffer) {
			    console.log(buffer);
			    // buffer = buffer2;
			    // boolCosa = true;
			    //let seqbd = new Sequencer(a.audioCtx, buffer);
			    // console.log(seqbd);
			    cosa.set(buffer, Math.random(), 1, 1, 0.05, 0.6);
			    //cosa.start();
			    //gloop.seqtime = [1000];
			    //gloop.seqpointer = [0];
			    // console.log(mainPointer.flat()); 
			    // gloop.seqpointer = [0, 0.5];
			    //gloop.seqfreqScale = [0.5];
			    //gloop.seqwindowSize = [0.5];
			   // gloop.seqoverlaps = [0.1];
			    //gloop.seqwindowRandRatio = [0];
			   // gloop.start();
			    boolCosa = true;
			},
						   function (e) { "Error with decoding audio data" + e.error });
		    }
		    request.send();
		} else {
		    console.error('Error en la solicitud:', xhr.statusText);
		}
	    };
	    xhr.onerror = function () {
		console.error('Error de red o CORS');
	    };
	    xhr.send();
	})
	.catch(error => {
	    // Maneja los errores aquí
	    console.error('Error en la solicitud:', error);
	});
}


function globalCh(track){

	console.log(track); 
	let trackIndex = track; // Cambia este valor según tu lógica de selección

    // Obtener el índice de la escena actual
    let sceneIndex = "sc" + scCount ; // Esto supone que solo hay sc0 y sc1

    //let bdQueryValue = track0[sceneIndex].instruments.bd.query;
	//let bdSeqsValue = track0[sceneIndex].instruments.bd.seqs;
    // let scIndex = track0[sceneIndex];
	//console.log(bdSeqsValue, bdQueryValue)

	eval(track0[sceneIndex].hydra)

	document.getElementById("mensajes").innerHTML += "---------------</br>";

	let instrumentIndices = Object.keys(track0[sceneIndex].instruments);

		instrumentIndices.forEach((instrumentIndex) => {

		let numericIndex = instrumentIndices.indexOf(instrumentIndex);
        let queryValue = track0[sceneIndex].instruments[instrumentIndex].query;
		let seqsValue = track0[sceneIndex].instruments[instrumentIndex].seqs.flat();
		let grainValue = track0[sceneIndex].instruments[instrumentIndex].grain; 
		// console.log(queryValue)

		document.getElementById("mensajes").innerHTML += "Búsqueda en freesound.org: "+queryValue+"</br>";
		//document.getElementById("mensajes").scrollTop = document.getElementById("mensajes").scrollHeight;

		buscarEnFreeSound(queryValue, 1, 40, apiKey)
		.then(resultados => {

			// console.log(resultados); 
			let res = resultados.resultados[Math.floor(Math.random() * resultados.resultados.length)];
			let srchURL = 'https://freesound.org/apiv2/sounds/' + res.id; 
			console.log("liga:" + srchURL);
			//console.log(freeURL);

			// document.getElementById("mensajes").innerHTML += "Liga del archivo en Freesound: "+srchURL+"</br>";

			var xhr = new XMLHttpRequest();
			xhr.open('GET', srchURL + '?format=json&token=' + apiKey, true);
			xhr.onload = function () {
			if (xhr.status >= 200 && xhr.status < 300) {
				var jsonResponse = JSON.parse(xhr.responseText);
				var audioPath = jsonResponse.previews['preview-lq-ogg'];
				const request = new XMLHttpRequest();
				request.open('GET', audioPath, true);
				request.responseType = 'arraybuffer';
				request.onload = function () {
				let audioData = request.response;
				a.audioCtx.decodeAudioData(audioData, function (buffer) {
					// player.tempo = 'track0.sc'+0+'.tempo'
					// players[numericIndex].stop();
					console.log(grainValue);
					// console.log(buffer)
					// Todo funciona el problema es que si aumentamos la cantidad de players todo se vuelve loco
					// Hay que filtrar, el otro problema es que si no hay un player con los métodos de un player no lo logra 
					// Diferenciar entre lo que modifica grain y lo que modifica gloop 
					players[numericIndex].load(buffer); // Esto solo compete a grain. Se podría determinar desde gloop 
					players[numericIndex].sequence(seqsValue); // gloop 
					players[numericIndex].start(); // // gloop y grains podría ir desde gloop    
					//cosa.buffer = buffer; 
					//console.log("hola")
					boolCosa = true;
					// document.getElementById("mensajes").innerHTML += "---------------</br>";
					//document.getElementById("mensajes").scrollTop = document.getElementById("mensajes").scrollHeight;

				},
							   function (e) { "Error with decoding audio data" + e.error });
				}
				request.send();
			}
			}
			xhr.onerror = function () {
			console.error('Error de red o CORS');
			};
			xhr.send();
			
		})
		.catch(error => {
			console.error('Error al buscar en FreeSound:', error);
		});   

    });
	
	scCount++; 

	//--------------------------------------------------------------------------------------
	if(scCount == Object.keys(track0).length){ // este cambio no es sobre escenas sino sobre instrumentos
		scCount = 0; 
	}


}

	// Es necesario al menos dos instrumentos percusivos
	// Las notas pueden estar divididas temáticamente y cada tema puede corresponder aproximadamente a un capítulo.
	// Pienso que cada capítulo podría tener un motivo general y ese motivo podría inscribirse en algo así como un prompt con palabras clave que pudieran usarse más adelante para profundizar una selección de samples, una modificación de parámetros independientes del valor de sentiment o de la sonificación y una secuencia o secuencia de sequencias que pudiera dar lugar a una rola. Entonces, de manera general los capítulos podrían reproducirse como piezas completas e integradas y las selecciones fuera de de estos grupos podrían ser versiones mezcladas de las rolas.
	// Una muy buena idea que mencionó Rossana fue grabar extractos de mi voz para poderlas subir y utilizarlas como recursos. Podrían ser las voces de alguien más (parecido a lo que sucedía en anti) lecturas de extractos selectos que pudieran intervenir en la rola.
	// return resultados[Math.floor(Math.random()*resultados.length)].name;
	
// audio request lo hace es sustituir el sinte granular principal
// Necesito otro bloque de código para un bd, snare y hi 
/* la pregunta es si deberé generar tracks para cada uno de los grupos de notas (capítulos) de forma tal que estos puedan ser "audioReactivos). En total son 7 sin referencias.

   1. bd 
   2. sn
   3. hi
   4. gr
   5. vc
   6. bs
   7. sm

   Esto quiere decir además que tal vez voy a tener 7 rolas abiertas

*/
