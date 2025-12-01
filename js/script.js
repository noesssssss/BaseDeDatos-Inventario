const {ipcRenderer} = require('electron');
let username;
let rol;

function volver(){
  ipcRenderer.send('ob-dpe-producto', null);
  ipcRenderer.send('change-view', 'tablas.html');
}

function cerrarSesion(){
  ipcRenderer.send('cerrar-sesion')
  ipcRenderer.send('change-view', 'index.html');

}

/**
 * FUNCIONES DE USUARIOS
 */

ipcRenderer.send('obtener-rolusuario');

function login() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username && password) {
    ipcRenderer.send('login', {username, password});
  } else {
    ipcRenderer.invoke('mostrar-error', {
      titulo: 'No hay acceso',
      mensaje: `Debes llenar todos los campos`
    });
  }
};

ipcRenderer.on('asignar-rol', (event, rol) => {
  this.rol = rol;
  console.log("Rol actual: " + this.rol)
});

//Llama a la funcion para crear usuario y encriptar contraseña en el main
function nuevoUsuario() {
  console.log("Funcion llamada")

  let nombre = document.getElementById('username').value;
  let pw = document.getElementById('password').value;

  ipcRenderer.send('agregar-usuario', {nombre, pw});
}

/**
 * FUNCIONES DE TABLAS: ALMACENES
 */
function setAlmacenes(){
  ipcRenderer.send('cantidad-almacenes');
}

ipcRenderer.on('retorno-almacenes', (event, cantidad) =>{
  document.getElementById('modAlmacen').max = cantidad;
});

function cargarAlmacenesV() {
  filaSeleccionada = null;
  ipcRenderer.send('obtener-almacenes');
  document.getElementById('contEscudo').style.display = 'none';
  document.getElementById('tablaAlmacenes').style.display = 'block';
  document.getElementById('tablaProductos').style.display = 'none';
  document.getElementById('filtros').style.display = 'block';
  document.getElementById('textoTablas').style.display = 'none';
  document.getElementById('botonesTablas').style.display = 'none';
  document.getElementById('regresarTablas').style.display = 'block';
  guardarTabla();

}

function cargarAlmacenes(campo, orden, columna) {
  ipcRenderer.send('obtener-almacenes-sorted', {campo,orden});
  document.getElementById('contEscudo').style.display = 'none';
  if (columna.onclick.toString().includes('DESC')) {
    console.log("Cargando en orden ascendiente")
    columna.onclick = function () {
      cargarAlmacenes(`${columna.id}`, 'ASC', this)
    }
  } else if (columna.onclick.toString().includes('ASC')) {
    console.log("Cargando en orden descendiente")
    columna.onclick = function () {
      cargarAlmacenes(`${columna.id}`, 'DESC', this)
    };
  }
}

function cargarAlmacenesF(){
  let id = parseInt(document.getElementById('modIDa').value.toString());
  let nombre = document.getElementById('modNombreA').value;
  let date = document.getElementById('modDateA').value;
  let user = document.getElementById('modUserA').value;
  let creation = document.getElementById('modCreationA').value;

  let filter = "";

  if(date) {
    let [year, month, day] = date.split("-");
    date = `${day}/${month}/${year}`;
    filter = filter + ` AND lastmoddate LIKE '${date}%' AND lastmoddate IS NOT NULL`
  }

  if(user){
    filter = filter + ` AND lastmoduser LIKE '%${user}%'`;
  }

  if(creation) {
    [year, month, day] = creation.split("-");
    creation = `${day}/${month}/${year}`;
    filter = filter + ` AND creationdate LIKE '${creation}%' AND lastmoddate IS NOT NULL`
  }

  if(!id){
    id = 0;
  }else{
    filter = filter + ` AND id = ${id}`
  }
  if(!nombre){
    nombre = `''`;
  }else{
    filter = filter + ` AND nombre LIKE '%${nombre}%'`;
  }

  ipcRenderer.send('almacenes-filtros', filter);
}

ipcRenderer.on('almacenes-cargados', (event, almacenes) => {
  const tbody = document.querySelector('#tablaAlmacenes tbody');
  document.getElementById('tablaAlmacenes').style.display = 'block';
  document.getElementById('tablaProductos').style.display = 'none';
  document.getElementById('botonesCRUD').style.display = 'block';
  tbody.innerHTML = ''; // Limpiar tabla

  almacenes.forEach(almacenes => {
    const tr = document.createElement('tr');
    tr.onclick = () => seleccionarFila(tr);
    tr.innerHTML = `
            <td>${almacenes.id}</td>
            <td>${almacenes.nombre}</td>
            <td>${almacenes.lastmoddate}</td>
            <td>${almacenes.lastmoduser}</td>
            <td>${almacenes.creationdate}</td>
        `;
    tr.classList.add('bd')
    tbody.appendChild(tr);
  });
});

/**
 * FUNCIONES DE TABLAS: PRODUCTOS
 */

function cargarProductosV() {
  filaSeleccionada = null;
  ipcRenderer.send('obtener-productos');
  document.getElementById('contEscudo').style.display = 'none';
  document.getElementById('tablaAlmacenes').style.display = 'none';
  document.getElementById('tablaProductos').style.display = 'block';
  document.getElementById('filtros').style.display = 'block';
  document.getElementById('textoTablas').style.display = 'none';
  document.getElementById('botonesTablas').style.display = 'none';
  document.getElementById('regresarTablas').style.display = 'block';
  guardarTabla();
}

function cargarProductos(tabla, nombre, orden, columna) {
  let campo = tabla + "." + nombre
  console.log("Orden de columna: " + columna.id + " - " + campo + " " + orden);
  ipcRenderer.send('obtener-productos-sorted', {campo, orden});
  document.getElementById('contEscudo').style.display = 'none';

  console.log(columna.onclick.toString())

  if (columna.onclick.toString().includes('DESC')) {
    console.log("Orden ascendiente")
    if (columna.id === 'nombrealmacen') {
      columna.onclick = function () {
        cargarProductos('a', 'nombre', 'ASC', this)
      };
    } else {
      columna.onclick = function () {
        cargarProductos('p', `${columna.id}`, 'ASC', this)
      };
    }
  } else if (columna.onclick.toString().includes('ASC')) {
    console.log("Orden descendiente")
    if (columna.id === 'nombrealmacen') {
      columna.onclick = function () {
        cargarProductos('a', 'nombre', 'DESC', this)
      };
    } else {
      columna.onclick = function () {
        cargarProductos('p', `${columna.id}`, 'DESC', this)
      };
    }
  }
}

function cargarProductosF(){
  let id = parseInt(document.getElementById('modID').value.toString());
  let nombre = document.getElementById('modNombre').value;
  let preciomin = parseFloat(document.getElementById('modPrecioMin').value);
  let preciomax = parseFloat(document.getElementById('modPrecioMax').value);
  let cantidadmin = parseInt(document.getElementById('modCantidadMin').value);
  let cantidadmax = parseInt(document.getElementById('modCantidadMax').value);
  let almacen = parseInt(document.getElementById('modAlmacen').value);
  let departamento = document.getElementById('modDepartamento').value;
  let date = document.getElementById('modDate').value;
  let user = document.getElementById('modUser').value;
  let creation = document.getElementById('modCreation').value;
  let filter = "";

  if(date) {
    let [year, month, day] = date.split("-");
    date = `${day}/${month}/${year}`;
    filter = filter + ` AND p.lastmoddate LIKE '${date}%' AND p.lastmoddate IS NOT NULL`
  }

  if(user){
    filter = filter + ` AND p.lastmoduser LIKE '%${user}%'`;
  }

  if(creation) {
    [year, month, day] = creation.split("-");
    creation = `${day}/${month}/${year}`;
    filter = filter + ` AND p.creationdate LIKE '${creation}%' AND p.lastmoddate IS NOT NULL`
  }

  if(!id){
    id = 0;
  }else{
    filter = filter + ` AND p.id = ${id}`
  }

  if(!preciomin){
    preciomin = 0;
  }else{
    filter = filter + ` AND p.precio < ${preciomax}`
  }

  if(!preciomax){
    preciomax = 0;
  }else{
    filter = filter + ` AND p.precio > ${preciomin}`
  }

  if(!almacen){
    almacen = 0;
  }else{
    filter = filter + ` AND p.almacen = ${almacen}`
  }

  if(cantidadmin){
    filter = filter + ` AND p.cantidad > ${cantidadmin}`
  }

  if(cantidadmax){
    filter = filter + ` AND p.cantidad < ${cantidadmax}`
  }

  if(!nombre){
    nombre = `''`;
  }else{
    filter = filter + ` AND p.nombre LIKE '%${nombre}%'`;
  }
  if(!departamento){
    departamento = `''`
  }else{
    filter = filter + ` AND p.departamento LIKE '%${departamento}%'`;
  }



  if(preciomin && !preciomax){
    preciomax = 999999999999;
  }

  console.log('Filtros: ' + id + nombre + preciomax + preciomin + almacen + departamento + date + user + creation)

  ipcRenderer.send('productos-filtros', filter);
}

ipcRenderer.on('productos-cargados', (event, productos) => {
  const tbody = document.querySelector('#tablaProductos tbody');
  document.getElementById('tablaAlmacenes').style.display = 'none';
  document.getElementById('tablaProductos').style.display = 'block';
  document.getElementById('botonesCRUD').style.display = 'block';
  tbody.innerHTML = ''; // Limpiar tabla

  productos.forEach(productos => {
    const tr = document.createElement('tr');
    tr.onclick = () => seleccionarFila(tr);
    tr.innerHTML = `
            <td>${productos.id}</td>
            <td>${productos.nombre}</td>
            <td>${productos.precio}</td>
            <td>${productos.cantidad}</td>
            <td>${productos.departamento}</td>
            <td>${productos.almacen}</td>
            <td>${productos.lastmoddate}</td>
            <td>${productos.lastmoduser}</td>
            <td>${productos.creationdate}</td>
        `;
    tr.classList.add('bd')
    tbody.appendChild(tr);
  });
});

function limpiarCamposProductos(){
  document.getElementById('modID').value = '';
  document.getElementById('modNombre').value = '';
  document.getElementById('modPrecioMin').value = '';
  document.getElementById('modCantidad').value = '';
  document.getElementById('modAlmacen').value = '';
  document.getElementById('modDepartamento').value = '';
  ipcRenderer.send('ob-dpe-producto', null);
}

function limpiarCamposAlmacenes(){
  document.getElementById('modID').value = '';
  document.getElementById('modNombre').value = '';
  ipcRenderer.send('ob-dpe-producto', null);
}

/**
 * SELECCION DE FILAS EN TABLAS
 */

let filaSeleccionada = null;
let elementoSelec = null

function seleccionarFila(fila) {
  let id
  // Remover selección anterior
  if (filaSeleccionada) {
    filaSeleccionada.classList.remove('selected');
  }

  // Seleccionar nueva fila
  fila.classList.add('selected');
  filaSeleccionada = fila;

  let selection = fila.getElementsByTagName('td');
  console.log("Seleccionado: " + selection[0].textContent + " de la tabla " + fila.closest('table').id);

  elementoSelec = [selection[0].textContent, fila.closest('table').id];
}



/**
 * ============ CRUD PRODUCTOS ============
 */
// Dependiendo de la tabla que se este mostrando en el momento, si hay un elemento seleccionado, lo elimina
async function eliminar() {
  if(document.getElementById('contEscudo').style.display != 'none'){
    errorSeleccion();
    return;
  }

  if (elementoSelec[1] === 'tablaProductos') {
    if(this.rol === 'almacen') {
      await errorRol();
      return;
    }
  }
  if (elementoSelec[1] === 'tablaAlmacenes') {
    if(this.rol === 'productos') {
      await errorRol();
      return;
    }
  }

  if(elementoSelec != null && await confirmarAccion('eliminar') == true) {
    console.log('Confirmo accion')
    if (elementoSelec[1] === 'tablaProductos') {
      if(this.rol === 'admin' || this.rol === 'productos') {
        console.log('Eliminado producto ' + elementoSelec[0])
        ipcRenderer.send('eliminar-producto', elementoSelec[0]);
        cargarProductosV();
      }else{
        errorRol();
      }
    } else if (elementoSelec[1] === 'tablaAlmacenes') {
      if(this.rol === 'admin' || this.rol === 'almacen') {
        console.log('Eliminado almacen ' + elementoSelec[0])
        ipcRenderer.send('eliminar-almacen', elementoSelec[0])
        cargarAlmacenesV();
      }else{
        errorRol();
      }
    }
  }
}

async function editarProducto(){
  ipcRenderer.send('ob-dpe-producto', null);
  let id = parseInt(document.getElementById('modID').value.toString());
  let nombre = document.getElementById('modNombre').value;
  let precio = parseFloat(document.getElementById('modPrecio').value);
  let cantidad = parseInt(document.getElementById('modCantidad').value);
  let almacen = parseInt(document.getElementById('modAlmacen').value);
  let departamento = document.getElementById('modDepartamento').value;


  if (!nombre || !precio || !cantidad || !almacen || !id || !departamento || id<=0) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('editar') == true){
    ipcRenderer.send('actualizar-producto', {nombre, precio, cantidad, almacen, departamento, id})
  }
}

//Si existe un producto con el id que introducjo el usuario se modifica el producto, si no, se agrega
ipcRenderer.on('obtener-existencia-productos', (event, existe) =>{
  if (existe !== true) {
    console.log('El producto no existe, se agregara')
    agregarProductoID();
  } else {
    console.log('El producto existe, se editara')
    editarProducto();
  }
});

// Agrega un producto con un ID nuevo (cuando el usuario no introduce ID)
async function agregarProducto(){
  let nombre = document.getElementById('modNombre').value;
  let precio = parseFloat(document.getElementById('modPrecio').value);
  let cantidad = parseInt(document.getElementById('modCantidad').value);
  let almacen = parseInt(document.getElementById('modAlmacen').value);
  let departamento = document.getElementById('modDepartamento').value;


  if (!nombre || !precio || !cantidad || !almacen || !departamento) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('agregar')){
    ipcRenderer.send('agregar-producto', {nombre, precio, cantidad, departamento, almacen});
  }
}

// Agrega un producto con ID introducido por el usuario
async function agregarProductoID(){
  let id = parseInt(document.getElementById('modID').value);
  let nombre = document.getElementById('modNombre').value;
  let precio = parseFloat(document.getElementById('modPrecio').value);
  let cantidad = parseInt(document.getElementById('modCantidad').value);
  let almacen = parseInt(document.getElementById('modAlmacen').value);
  let departamento = document.getElementById('modDepartamento').value;


  if (!nombre || !precio || !cantidad || !almacen || !departamento || id<=0) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('agregar') == true){
    ipcRenderer.send('agregar-producto-id', {nombre, precio, cantidad, almacen, departamento, id})
  }
}
// Si el id esta vacio, agrega un producto nuevo. Si no, revisa la existencia y dependiendo de esta agrega o edita
function aggEditProducto(){
  if(parseInt(document.getElementById('modID').value) === 0) {
    agregarProducto();
  }else{
    ipcRenderer.send('verificar-existencia-productos', document.getElementById('modID').value);
  }
}

/**
 * ============ CRUD ALMACENES ============
 */

async function editarAlmacen(){
  let id = parseInt(document.getElementById('modID').value.toString());
  let nombre = document.getElementById('modNombre').value;
  ipcRenderer.send('ob-dpe-producto', null);

  if (!nombre || !id || id<=0) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('editar') == true){
    ipcRenderer.send('actualizar-almacen', {nombre, id})
  }
}

async function agregarAlmacen(){
  let nombre = document.getElementById('modNombre').value;

  if (!nombre) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('agregar') == true){
    ipcRenderer.send('agregar-almacen', nombre)
  }
}

async function agregarAlmacenID(){
  let id = parseInt(document.getElementById('modID').value);
  let nombre = document.getElementById('modNombre').value;

  if (!nombre || id<=0) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }

  if(await confirmarAccion('agregar') == true){
    ipcRenderer.send('agregar-almacen-id', {nombre, id})
  }
}

function aggEditAlmacen(){
  if(document.getElementById('modID').value == 0) {
    console.log('Se agrega elemento sin id')
    agregarAlmacen();
  }else{
    ipcRenderer.send('verificar-existencia-almacenes', document.getElementById('modID').value);
  }
}

async function cargarEditarAlmacenes(){
  ipcRenderer.send('r-dpe-almacen')
}

ipcRenderer.on('editar-almacen', (event, rows) =>{
  if(rows == null){
    return;
  }

  document.getElementById('modID').value = rows.id;
  document.getElementById('modNombre').value = rows.nombre;
})

ipcRenderer.on('obtener-existencia-almacenes', (event, existe) =>{
  if (existe !== true) {
    console.log('El almacen no existe, se agregara')
    agregarAlmacenID();
  } else {
    console.log('El almacen existe, se editara')
    editarAlmacen();
  }
});

function botonEditar(){
  if(document.getElementById('contEscudo').style.display != 'none'){
    errorSeleccion();
    return;
  }

  if((this.rol === 'productos' || this.rol === 'admin') && document.getElementById('tablaProductos').style.display === 'block'){
    if(filaSeleccionada){

      ipcRenderer.send('ob-dpe-producto', elementoSelec[0]);
    }
    ipcRenderer.send('change-view', 'editarProductos.html');
  }else if((this.rol === 'almacen' || this.rol === 'admin') && document.getElementById('tablaAlmacenes').style.display === 'block'){
    if(filaSeleccionada){
      ipcRenderer.send('ob-dpe-producto', elementoSelec[0]);
    }
    ipcRenderer.send('change-view', 'editarAlmacenes.html');
  }else{
    errorRol();
  }
}

async function cargarEditarProductos(){
  ipcRenderer.send('r-dpe-producto')
  setAlmacenes();
}

ipcRenderer.on('editar-producto', (event, rows) =>{
  if(rows == null){
    return;
  }


  document.getElementById('modID').value = rows.id;
  document.getElementById('modNombre').value = rows.nombre;
  document.getElementById('modPrecio').value = rows.precio;
  document.getElementById('modCantidad').value = rows.cantidad;
  document.getElementById('modAlmacen').value = rows.almacen;
  document.getElementById('modDepartamento').value = rows.departamento;
})

/**
 * ============ CUADROS DE ERROR / MANEJO DE OPCIONES ============
 */
async function errorRol() {
  await ipcRenderer.invoke('mostrar-error', {
    titulo: 'No hay acceso',
    mensaje: `Tu rol actual de ${this.rol} no te permite modificar este elemento/tabla`
  });
}

async function errorSeleccion() {
  await ipcRenderer.invoke('mostrar-error', {
    titulo: 'No hay seleccion',
    mensaje: 'Para realizar esta accion necesitas seleccionar una tabla o un elemento'
  });
}

async function errorInput(){
  await ipcRenderer.invoke('mostrar-error', {
    titulo: 'Campos vacios',
    mensaje: 'Tienes que llenar todos los campos'
  });
}

async function confirmarAccion(accion) {
  const resultado = await ipcRenderer.invoke('mostrar-confirmacion', {
    titulo: 'Confirmar',
    mensaje: `¿Seguro de ${accion} este elemento?`
  });

  if (resultado == 0) {
    console.log('Usuario confirmó: SÍ');
    return true;
    // Proceder con la eliminación
  } else {
    console.log('Usuario dijo: NO');
    return false;
  }
}

function formTest(){
  let id = parseInt(document.getElementById('modID').value.toString());
  let nombre = document.getElementById('modNombre').value;
  let precio = parseFloat(document.getElementById('modPrecio').value);
  let cantidad = parseInt(document.getElementById('modCantidad').value);
  let almacen = parseInt(document.getElementById('modAlmacen').value);


  if (!nombre || !precio || !cantidad || !almacen || !id) {
    console.error('Uno o más elementos no fueron encontrados o estan vacios');
    errorInput();
    return;
  }
  console.log('Producto a enviar: ' + nombre + ", " + precio + ", " + cantidad + ", " + almacen + ", " + id)
}

function goBack(){
  document.getElementById('contEscudo').style.display = 'block';
  document.getElementById('tablaAlmacenes').style.display = 'none';
  document.getElementById('tablaProductos').style.display = 'none';
  document.getElementById('botonesCRUD').style.display = 'none';
  document.getElementById('filtros').style.display = 'none';
  document.getElementById('textoTablas').style.display = 'block';
  document.getElementById('botonesTablas').style.display = 'flex';
  document.getElementById('regresarTablas').style.display = 'none';
}

// Ventana de filtros
function abrirModal() {
  if(document.getElementById('contEscudo').style.display != 'none'){
    errorSeleccion();
    return;
  }

  if(document.getElementById('tablaProductos').style.display === 'block'){
    document.getElementById('buscarProductos').style.display = 'block';
    document.getElementById('buscarAlmacenes').style.display = 'none';
  }else if(document.getElementById('tablaAlmacenes').style.display === 'block'){
    document.getElementById('buscarProductos').style.display = 'none';
    document.getElementById('buscarAlmacenes').style.display = 'block';
  }else{
    errorSeleccion();
    return;
  }
  const modal = document.getElementById('modalFiltros');
  modal.classList.add('active');

  // Opcional: Prevenir scroll del body cuando el modal está abierto
  document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModal() {
  const modal = document.getElementById('modalFiltros');
  modal.classList.remove('active');

  // Restaurar scroll del body
  document.body.style.overflow = 'auto';
}

function limpiarFiltros(){
  document.getElementById('modID').value = '';
  document.getElementById('modIDa').value = '';
  document.getElementById('modNombre').value = '';
  document.getElementById('modNombreA').value = '';
  document.getElementById('modDate').value = '';
  document.getElementById('modDateA').value = '';
  document.getElementById('modUser').value = '';
  document.getElementById('modUserA').value = '';
  document.getElementById('modCreation').value = '';
  document.getElementById('modCreationA').value = '';
  document.getElementById('modPrecioMin').value = '';
  document.getElementById('modPrecioMax').value = '';
  document.getElementById('modCantidadMin').value = '';
  document.getElementById('modCantidadMax').value = '';
  document.getElementById('modAlmacen').value = '';
  document.getElementById('modDepartamento').value = '';
}

function tablaAbierta(tabla){
  if(tabla == 'tablaAlmacenes'){
    document.getElementById(tabla).style.display = 'block';
    document.getElementById('tablaProductos').style.display = 'none';
    document.getElementById('contEscudo').style.display = 'none';
    cargarAlmacenesV()
  }else if(tabla == 'tablaProductos'){
    document.getElementById(tabla).style.display = 'block';
    document.getElementById('tablaAlmacenes').style.display = 'none';
    document.getElementById('contEscudo').style.display = 'none';
    cargarProductosV()
  }else{
    document.getElementById('contEscudo').style.display = 'block';
  }
}

function guardarTabla(){
  if(document.getElementById('tablaAlmacenes').style.display != 'none'){
    ipcRenderer.send('guardar-tabla', 'tablaAlmacenes')
    return
  }
  if(document.getElementById('tablaProductos').style.display != 'none'){
    ipcRenderer.send('guardar-tabla', 'tablaProductos')
  }else{
    ipcRenderer.send('guardar-tabla', null)
  }
}

ipcRenderer.on('recibir-tabla', (event, tabla) =>{
  tablaAbierta(tabla)
})

function recibirTabla(){
  ipcRenderer.send('enviar-tabla')
}

