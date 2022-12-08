/********************************************************************
*  SENA CENTRO DE INDUSTRIA Y DE LA CONSTRUCCION                    *
*  Codigo JavaScript para el juego SOKOBAN                          *
*  Autor: Marco Leon Mora                                           *
*  Version: 1.0                                                     *
*  Fecha: Marzo/2013                                                *
********************************************************************/

/*Al cargar la pagina lanza el metodo INICIAR asociado al evento LOAD*/
window.addEventListener('load', iniciar, false);
window.document.addEventListener("keydown", detectarTecla, false);
window.document.addEventListener('change', manejarArchivo, false);

/****************** PROPIEDADES GLOBALES ***************************/
//referencia al objeto Canvas del DOM y al contexto de dibujo (global)
var canvas=null, ctx=null, verPasosSoko=null, verPasosCaja=null; 
var audioPaso=null, audioCaja=null,  audioNoMueve=null,  audioAplausos=null;
var titulo=null, numMundo=null;

//Contendra enum de estados de la casilla y orientacion de Soko
var valorCasilla = null, miraSoko=null;
var mSoko=0;  

// Matriz con el contenido de las celdas del escenario
var mundo= [];

// objeto con la hoja de sprites
var img1 = new Image(); 

//Posición actual y siguiente de Soko y direccion deseada
//Se definen como estructuras de datos (tipo POINT en C#)
var posActualSoko = {X:0, Y:0};
var posSigueSoko = {X:0, Y:0};
var dirSoko = {X:0, Y:0};
//Pos. destino de la caja a mover
var posSigueCaja = {X:0, Y:0};

//Tamaño de la matriz del mundo, se asume cuadrada.
var tamMundo = 20;  
var maxMundos = 90;
//Guarda el valor de la ultima tecla pulsada
var valorTecla =0;

//Cuantas cajas hay y cuantas estan en posicion destino
var totalCajas = 0;
var totCajasDestino = 0;
var juegoTerminado = false;

//Contadores de movimiento
var pasosSoko = 0;
var movimCajas = 0;

//Para leer el archivo con varios mundos
var archivoMundos = new Array();	
var archivoCargado = false;
//Indica el numero del mundo actual
var nivelActivo = 1; 

/************************** METODOS ********************************/

/*********** CARGA IMAGENES, SPRITES, SONIDOS, ETC ****************/
function cargar(){
	//Elementos del DOM
	verPasosSoko = document.getElementById('pasosSoko'); 
	verPasosCaja = document.getElementById('pasosCaja');  

	audioPaso = document.getElementById("audioPaso");
	audioCaja = document.getElementById("audioCaja");
	audioNoMueve = document.getElementById("audioNoMueve");
	audioAplausos = document.getElementById("audioAplausos");	
	numMundo = document.getElementById("txtMundo");
	titulo = document.getElementById("titulo");

	//Cargar valores en la matriz del escenario
	mundo=[
		[0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,1,4,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,1,1,1,2,2,4,1,1,0,0,0,0,0,0,0,0,0,0],
		[0,0,1,2,2,4,2,4,2,1,0,0,0,0,0,0,0,0,0,0],
		[1,1,1,2,1,2,1,1,2,1,0,0,0,1,1,1,1,1,1,0],
		[1,2,2,2,1,2,1,1,2,1,1,1,1,1,2,2,3,3,1,0],
		[1,2,4,2,2,4,2,2,2,2,2,2,2,2,2,2,3,3,1,0],
		[1,1,1,1,1,2,1,1,1,2,1,6,1,1,2,2,3,3,1,0],
		[0,0,0,0,1,2,2,2,2,2,1,1,1,1,1,1,1,1,1,0],
		[0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	];

	//Posibles valores en la matriz del mundo
	valorCasilla = {
		"nada":     0,		//Casilla vacia, no usada
		"pared":    1,		//Pared
		"piso":     2,		//Piso libre
		"destino":  3,		//Piso con marca de destino
		"caja":     4,		//Caja en posicion libre
		"cajaDestino": 5,	//Caja en posicion destino
		"soko":     6,		//Soko sobre piso libre
		"sokoDestino": 7	//Soko sobre piso destino
	};
	Object.freeze(valorCasilla);


	//Frames a mostrar segun orientacion de Soko
	miraSoko = {"derecha": 0, "arriba": 6, "izquierda": 7, "abajo": 8};
	Object.freeze(miraSoko);

	//Carga el archivo con la hoja de sprites
	img1.src = "Recursos/soko.png"; 

	buscaPosSoko();  //coordenada inicial de Soko en el mundo

	//Cuenta las cajas con que inicia el juego
	totalCajas = cuentaCajas(valorCasilla.caja);
	totalCajas += cuentaCajas(valorCasilla.cajaDestino);

}

/************* ACTUALIZACION PERIODICA DEL JUEGO *******************/
function actualizar(){
	var cambiar = false;
	dirSoko.X = dirSoko.Y =0;
	posSigueSoko.X = posActualSoko.X; //la misma posicion
	posSigueSoko.Y = posActualSoko.Y;

	switch(valorTecla){				//Segun la tecla pulsada...
		case 37:				//Izquierda
			dirSoko.X--;
			cambiar = true;
			mSoko = miraSoko.izquierda;
			break;
		case 38: 					//Arriba
			dirSoko.Y--;
			cambiar = true;
			mSoko = miraSoko.arriba;
			break;
		case 39: 					//Derecha
			dirSoko.X++;
			cambiar = true;
			mSoko = miraSoko.derecha;
			break;
		case 40: 					//Abajo
			dirSoko.Y++;
			cambiar = true;
			mSoko = miraSoko.abajo;
			break;
		default:
			break; 					//Otra tecla o ninguna
	}
	valorTecla = 0;					//Borra para no usar de nuevo
	
	if(cambiar && !juegoTerminado){					//Si se ha pulsado una flecha	
		cambiaPosicionDeseada();	//modifica coordenada de posSigueSoko
	
		//Verificar si siguiente casilla esta libre
		if(casillaLibre(posSigueSoko)){
			mueveSoko();			//Si, mueve...
			//audioPaso.play();
		}							//Si no, verificar si hay una caja
		else if(casillaCaja(posSigueSoko)){ 
			//calcula sig. posicion de la caja
			posSigueCaja.X = posSigueSoko.X + dirSoko.X;
			posSigueCaja.Y = posSigueSoko.Y + dirSoko.Y;
			
			//verificar siguiente posicion de la caja
			if(casillaLibre(posSigueCaja)){
				mueveCaja();	//Si, mueve caja
				mueveSoko();	// y  a Soko
				//audioCaja.play();
			}
			else{
				audioNoMueve.play();
			}
		}
		else{
			audioNoMueve.play();
		}

		//Contar cajas en posicion final y verificar si ya termino
		totCajasDestino = cuentaCajas(valorCasilla.cajaDestino);
		if(totCajasDestino == totalCajas){ 
			juegoTerminado = true;
			audioAplausos.play();
		}
	}
}

/*************** DIBUJO PERIODICO DEL CANVAS ********* **************/
function dibujar(){
	//Propiedades privadas. Para dibujar la imagen   
	var dX = 20; 	//Tamaño de cada casilla
	var dY = 20;
	var wFrame = 20;	//tamaño del frame original
	var hFrame = 20;	

	var iniX = 25;		//Posicion inicial del dibujo del mundo
	var iniY = 25;
	var X = 0;			//Posicion inicial de cada figura en el canvas
	var Y = 0;			
//	var wCanvas =canvas.width;
//	var hCanvas =canvas.height;

	//Borrar el contenido del canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for(var j=0; j< tamMundo; j++){			//Recorre columnas del mundo
		for(var i=0; i< tamMundo; i++){		//Recorre filas
			var obj = mundo[j][i];			//Lee el valor de la casilla
			
			X = i*dX + iniX;				//Calcula la posicion en el canvas
			Y = j*dY + iniY;

			switch(obj){					//Segun el tipo de objeto...
				case valorCasilla.pared:
				case valorCasilla.piso:
				case valorCasilla.destino:
					//Dibuja la pared o el piso
					ctx.drawImage(img1, obj * wFrame, 0, wFrame, hFrame, X, Y, dX, dY);
			  		break;

				case valorCasilla.caja:
				case valorCasilla.cajaDestino:
					//Dibuja un piso y la caja
					ctx.drawImage(img1, (obj-2) * wFrame, 0, wFrame, hFrame, X, Y, dX, dY);
					ctx.drawImage(img1, obj * wFrame, 0, wFrame, hFrame, X, Y, dX, dY);
			  		break;	

				case valorCasilla.soko:
				case valorCasilla.sokoDestino:
					//Dibuja un piso y a Soko
					ctx.drawImage(img1, (obj-4) * wFrame, 0, wFrame, hFrame, X, Y, dX, dY);
					ctx.drawImage(img1, mSoko * wFrame, 0, wFrame, hFrame, X, Y, dX, dY); 
			  		break;	

				default:
				  break; 	//Caso de casilla vacia
			}
		}	
	}
	verPasosSoko.innerHTML="Pasos Soko: "+ pasosSoko;
	verPasosCaja.innerHTML="Pasos Cajas: "+ movimCajas;
	titulo.innerHTML="SOKOBAN No. "	+ nivelActivo;
}

/****************Controla el ciclo repetitivo***********************/
function run(){
	//setTimeout(run, 50);
	actualizar();
	dibujar();
	requestAnimationFrame(run); //Nuevo
}

/***************** INICIALIZACION EL PROGRAMA *******************/
function iniciar(){
	canvas=document.getElementById('canvas');
	ctx=canvas.getContext('2d');
	pasosCaja = document.getElementById('pasosCaja');  //PROV.
	//pasosCaja.innerHTML="Hola";
	cargar();
	run();
}

/****************** METODOS AUXILIARES *****************************/
//Busca la posicion de Soko en la matriz
function buscaPosSoko(){
	for(var j=0; j< tamMundo; j++){			//Recorre columnas del mundo
		for(var i=0; i< tamMundo; i++){		//Recorre filas
			if((mundo[j][i] == valorCasilla.soko) || 
				(mundo[j][i] == valorCasilla.sokoDestino)){
				//encontro al personaje, guarda la posicion
				posActualSoko.X = i;
				posActualSoko.Y = j;
				i=j= tamMundo; //Para salir de los ciclos...
			}
		}
	}
}

//Manejador del evento "keydown" ********************************/
function detectarTecla(e){
	e = e || window.event;
	valorTecla = e.keyCode || e.which;
}


//modifica coordenada de posSigueSoko y valida que no salga del mundo
function cambiaPosicionDeseada(){
	posSigueSoko.X = posActualSoko.X+ dirSoko.X;
	posSigueSoko.Y = posActualSoko.Y+ dirSoko.Y;
	//Revisa limites y reajusta
	if(posSigueSoko.X == tamMundo)	posSigueSoko.X--;
	if(posSigueSoko.X == -1)	posSigueSoko.X++;
	if(posSigueSoko.Y == tamMundo)	posSigueSoko.Y--;
	if(posSigueSoko.Y == -1)	posSigueSoko.Y++;
}

//revisa si la casilla en la posición “pos” está libre
function casillaLibre(pos){
	if((mundo[pos.Y][pos.X] == valorCasilla.piso)||
		(mundo[pos.Y][pos.X] == valorCasilla.destino))
		return true;
	else
		return false;
}

//revisa si la casilla en la posición “pos” tiene una caja
function casillaCaja(pos){
	if((mundo[pos.Y][pos.X] == valorCasilla.caja)||
		(mundo[pos.Y][pos.X] == valorCasilla.cajaDestino))
		return true;
	else
		return false;
}

//Cambia la posicion de Soko en la matriz del mundo
function mueveSoko(){
	//Lo quita de la posicion actual
	mundo[posActualSoko.Y][posActualSoko.X] = mundo[posActualSoko.Y][posActualSoko.X] -4;
	//Lo coloca en la siguiente posicion
	mundo[posSigueSoko.Y][posSigueSoko.X] = mundo[posSigueSoko.Y][posSigueSoko.X] + 4;
	//Registra la nueva posicion
	posActualSoko.X = posSigueSoko.X; 
	posActualSoko.Y = posSigueSoko.Y;

	//Cuenta pasos
	pasosSoko++;
}

//Cambia la posicion de la caja empujada
function mueveCaja(){
	//La quita de la posicion actual
	mundo[posSigueSoko.Y][posSigueSoko.X] = mundo[posSigueSoko.Y][posSigueSoko.X] -2;
	//La coloca en la siguiente posicion
	mundo[posSigueCaja.Y][posSigueCaja.X] = mundo[posSigueCaja.Y][posSigueCaja.X] + 2;

	//Cuenta el movimiento de la caja
	movimCajas++;
}

//Cuenta las cajas del tipo indicado****/
function cuentaCajas(tipoCaja){
	var total = 0;
	for(var j=0; j< tamMundo; j++){			//Recorre columnas del mundo
		for(var i=0; i< tamMundo; i++){		//Recorre filas	
			if(mundo[j][i] == tipoCaja){
				total++;
			}
		}
	}
	return total;
}

/************ metodos para cargar varios mundos ********************/
//Manejador del evento 'Change' del objeto 'Archivo' o del input Text
//Ejecuta cuando se selecciona un archivo
function manejarArchivo(evt){
	if(nivelActivo != numMundo.value){
		if(archivoCargado){
			nivelActivo = numMundo.value;
			leerNivel();
		}
	}
	else{
		var file = evt.target.files[0];
		if(file){
			var reader = new FileReader();
			//evento para cargar archivoMundos cuando se lea el archivo
			reader.onload = function(e) {
			    archivoMundos = e.target.result.split(/\n/);
			    archivoCargado= true;
			};
			reader.readAsText(file);
		}
		else{
			alert("No se pudo leer el archivo...");
		} 
	}
	numMundo.value = nivelActivo;
}

//Carga el mundo anterior al actual. Revisa si ya esta el No. 1
function mundoAnterior(){
	if(archivoCargado && (nivelActivo > 1)){
		nivelActivo--;
		leerNivel();
	}
	else{
		alert("No existe un nivel menor al #" + nivelActivo);
	}
}

//Carga el mundo siguiente al actual. Revisa si ya esta el ultimo
function mundoSiguiente(){
	if(archivoCargado && (nivelActivo < maxMundos)){   //Ojo modificar constante!!
		nivelActivo++;
		leerNivel();
	}
	else{
		alert("No existe un nivel mayor al #" + nivelActivo);
	}
}

//Carga el nuevo nivel en la matriz mundo
//Reinicia contadores de pasos y cajas
function leerNivel(){

	//Recorre el arreglo buscando el numero de nivel a cargar
	var i=0;						//va contando el numero de linea

	while(i < archivoMundos.length){  
		if(archivoMundos[i].substring(0,1) == "#"){	//Busca inicio de un mundo
			//Si lo encuentra...
			if(parseInt(archivoMundos[i].substring(1))== nivelActivo){
				cargaMatriz(++i);	//Avanza el contador de linea y carga la matriz
				break;  //Para salir del bucle
			}
		}
		i++;		//Siguiente linea y sigue buscando
	}
}

//Actualiza la variable maxMundos segun archivo cargado
function contarMundos(){
	//Recorre el arreglo buscando el numero de mundo mayor
	var i = archivoMundos.length - 1;			//inicia por el final
	var totMundos=0;
	while(archivoMundos[--i].substring(0,1) != "#");
	var cadenaNumero= archivoMundos[i].substring(1,2)
	totMundos = parseInt(cadenaNumero);

}
//Carga la matriz desde el arreglo archivoMundos iniciando en la fila f
//Parametro: fi = numero de la linea para empezar a cargar
function cargaMatriz(fi){
	//Limpia la matriz del mundo
	for(var j=0; j< tamMundo; j++){			
		for(var i=0; i< tamMundo; i++){		
			mundo[j][i]=0;
		}
	}
	var j=0;		//indice de columna de la matriz del mundo
	//Recorre hasta encontrar otro delimitador #
	while(archivoMundos[fi].substring(0,1) != "#") { 
		var filaDatos = new Array();
		filaDatos = archivoMundos[fi].split(",");	//Separa los numeros de una fila
		for(var i=0; i< filaDatos.length; i++){		//Recorre los numeros de una fila
			var res= parseInt(filaDatos[i]);		//Toma cada numero 
			mundo[j][i] = res;						//Lo guarda en la matriz del mundo
		}
		j++			//Siguiente fila del mundo
		fi++		//Siguiente fila de archivoMundos
	}

	//Reinicia valores del nuevo juego
	reiniciar();
}

//Reinicia las propiedades para el nuevo juego
function reiniciar(){
	buscaPosSoko();
	pasosSoko = 0;
	movimCajas = 0;
	juegoTerminado = false;
	totalCajas = cuentaCajas(valorCasilla.caja);
	totalCajas += cuentaCajas(valorCasilla.cajaDestino);
	cajaDestino = 0;
}

/******************** FIN DEL CODIGO *******************************/

function nohaceNada(){
	alert("prueba")
}