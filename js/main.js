const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
let win;
const bcrypt = require('bcryptjs'); //Encripcion
const sqlite3 = require('sqlite3').verbose(); //Funciones de sqlite
let db; //Abrir base de datos
let usuario = null;
let dpe;
let tablaAbierta;

// Función para inicializar la base de datos
function initDatabase() {
  const isDev = !app.isPackaged;

  // Ruta de la base de datos según el entorno
  let dbPath;

  if (isDev) {
    // En desarrollo: usar la ruta local
    dbPath = path.join(__dirname, 'InventarioBD_2.db');
  } else {
    // En producción: copiar la BD al directorio de usuario
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'InventarioBD_2.db');

    // Copiar la base de datos si no existe
    if (!fs.existsSync(dbPath)) {
      const dbTemplate = path.join(process.resourcesPath, 'app.asar.unpacked', 'js', 'InventarioBD_2.db');

      console.log('Copiando BD desde:', dbTemplate);
      console.log('Copiando BD hacia:', dbPath);

      try {
        // Crear directorio si no existe
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }

        // Copiar archivo
        fs.copyFileSync(dbTemplate, dbPath);
        console.log('Base de datos copiada exitosamente');
      } catch (error) {
        console.error('Error al copiar la base de datos:', error);
        dialog.showErrorBox('Error', 'No se pudo inicializar la base de datos: ' + error.message);
        app.quit();
        return null;
      }
    }
  }

  console.log('Ruta final de la BD:', dbPath);

  // Abrir la base de datos
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error al abrir la base de datos:', err);
      dialog.showErrorBox('Error', 'No se pudo abrir la base de datos: ' + err.message);
      app.quit();
    } else {
      console.log('Base de datos conectada correctamente en:', dbPath);
    }
  });
}

/**
 * ==============FUNCIONES DE VENTANA==============//
 */
app.disableHardwareAcceleration();

function createWindow() {
  // Crear ventana principal
  win = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'img/logounison.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  ipcMain.on('change-view', (event, pagePath) => {
    console.log('Cambiando a:', pagePath);
    if (win) {
      win.loadFile(pagePath);
    }
  });
}

// Cuando Electron esté listo, crear ventana
app.whenReady().then(() => {
  db = initDatabase();
  if (db) {
    createWindow();
    setupIpcListeners();
  }
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcListeners() {
  /**
   * =========== Funciones de usuarios ===========
   */
  //Funcion de agregar usuario: Obtiene nombre, contraseña y fecha, encripta la contraseña y loa inserta en la base de datos
  ipcMain.on('agregar-usuario', async (event, usuario) => {
    console.log("Datos recibidos:", usuario);

    try {
      const date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');
      const username = usuario.nombre;
      const saltRounds = 12;
      const hash = await bcrypt.hash(usuario.pw, saltRounds);

      let stmt = `INSERT INTO usuarios (usuario, contrasena, login)
                  VALUES (?, ?, ?)`;  // Usar placeholders para prevenir SQL injection

      db.run(stmt, [username, hash, date], (err) => {
        if (err) {
          console.error("Error al insertar usuario:", err.message);
        } else {
          console.log('Usuario Ingresado Correctamente.');
        }
      });
    } catch (error) {
      console.error("Error en agregar-usuario:", error);
    }
  });

  //Funcion para verificar el inicio de sesion
  ipcMain.on('login', (event, datos) => {
    let stmt = "SELECT usuario, contrasena, rol FROM usuarios WHERE usuario = ?";

    db.get(stmt, [datos.username], async (err, row) => {
      if (err) {
        console.error("Error en la consulta:", err.message);
        return;
      }

      // Verificar si el usuario existe
      if (!row) {
        console.log("Usuario no encontrado:", datos.username);
        await dialog.showErrorBox(
          'Error',
          'Usuario o contraseña incorrectos'
        );
        return;
      }

      // Comparar la contraseña ingresada con el hash almacenado
      const passwordCorrecta = await bcrypt.compare(datos.password, row.contrasena);

      if (passwordCorrecta) {
        console.log("Login exitoso para:", datos.username);

        // Actualizar fecha de último login
        const date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');
        db.run(`UPDATE usuarios
                SET login = ?
                WHERE usuario = ?`, [date, datos.username]);

        win.loadFile("tablas.html");

        console.log("El usuario ingreso en el rol de " + row.rol);
        usuario = [row.usuario, row.rol]
      }else{
        await dialog.showErrorBox(
          'Error',
          'Usuario o contraseña incorrectos'
        );
      }
    })
  });

  //Regresa el rol del usuario para la verificacion al iniciar sesion
  ipcMain.on('obtener-rolusuario', (event) => {
    if (usuario != null) {
      event.reply('asignar-rol', usuario[1]);
    }
  });

  //Limpia la informacion que se guarda de la sesion
  ipcMain.on('cerrar-sesion', (event) =>{
    usuario = null;
    tablaAbierta = null;
  })

  /**
   * =========== Funciones para la tabla productos ===========
   */
  //Obtener informacion de la base de datos (almacenes y productos)
  ipcMain.on('obtener-productos', (event) => {
    let stmt = `SELECT p.id,
                       p.nombre,
                       p.precio,
                       p.cantidad,
                       p.departamento,
                       a.nombre as almacen,
                       p.lastmoddate,
                       p.lastmoduser,
                       p.creationdate
                FROM productos p
                       INNER JOIN almacenes a ON p.almacen = a.id `;

    db.all(stmt, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('productos-cargados', rows);
    });
  });

  //Obtener datos ordenados de productos
  ipcMain.on('obtener-productos-sorted', (event, sort) => {
    let stmt = `SELECT p.id,
                       p.nombre,
                       p.precio,
                       p.cantidad,
                       p.departamento,
                       a.nombre as almacen,
                       p.lastmoddate,
                       p.lastmoduser,
                       p.creationdate
                FROM productos p
                       INNER JOIN almacenes a ON p.almacen = a.id `;

    if (sort.campo != null) {
      console.log("Tabla ordenada por" + sort.campo + " " + sort.orden);
      stmt = stmt + ` ORDER BY ${sort.campo} COLLATE NOCASE ${sort.orden}`;
    }
    db.all(stmt, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('productos-cargados', rows);
    });
  });

  //Busqueda de productos con filtros
  ipcMain.on('productos-filtros', (event, filter) => {
    let stmt = `SELECT p.id,
                       p.nombre,
                       p.precio,
                       p.cantidad,
                       p.departamento,
                       a.nombre as almacen,
                       p.lastmoddate,
                       p.lastmoduser,
                       p.creationdate
                FROM productos p
                       INNER JOIN almacenes a ON p.almacen = a.id
                WHERE true ` + filter;

    console.log("Filtros de busqueda: " + filter);

    db.all(stmt, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('productos-cargados', rows);
    });
  });

  //Eliminar producto
  ipcMain.on('eliminar-producto', (event, id) => {
    let stmt = "DELETE FROM productos WHERE id = ?";
    db.run(stmt, [id], (err, rows) => {
    });
  });

  //Actualizar producto
  ipcMain.on('actualizar-producto', (event, elemento) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`UPDATE productos
            SET nombre      = ?,
                precio      = ?,
                cantidad    = ?,
                almacen     = ?,
                departamento= ?,
                lastmoddate = ?,
                lastmoduser = ?
            WHERE id = ?;`, [elemento.nombre, elemento.precio, elemento.cantidad, elemento.almacen, elemento.departamento, date, usuario[0], elemento.id]);
    console.log('El elemento ' + elemento.id + ' fue editado')
  });

  //Agregar producto (con id por autoincremento)
  ipcMain.on('agregar-producto', (event, elemento) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`INSERT INTO productos (nombre, precio, cantidad, almacen, departamento, lastmoddate, lastmoduser, creationdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`, [elemento.nombre, elemento.precio, elemento.cantidad, elemento.almacen, elemento.departamento, date, usuario[0], date])
  });

  //Agregar producto (con id por el usuario)
  ipcMain.on('agregar-producto-id', (event, elemento) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`INSERT INTO productos (id, nombre, precio, cantidad, almacen, departamento, lastmoddate, lastmoduser, creationdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`, [elemento.id, elemento.nombre, elemento.precio, elemento.cantidad, elemento.almacen, elemento.departamento, date, usuario[0], date])
  });

  //Verifica si existe un producto con cierto id
  ipcMain.on('verificar-existencia-productos', (event, id) => {
    db.all(`SELECT *
            FROM productos
            WHERE id = ?`, [id], (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }

        if (rows.length === 0) {
          console.log('El elemento no existe');
          event.reply('obtener-existencia-productos', false);
        } else {
          console.log('El elemento existe');
          event.reply('obtener-existencia-productos', true);
        }
      }
    )
  });

  //Regresa la cantidad de almacenes para poner un maximo en agregar/editar productos
  ipcMain.on('cantidad-almacenes', (event) => {
    db.all(`SELECT MAX(id)
            FROM almacenes`, [], (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log("Numero maximo de almacen: " + rows[0]['MAX(id)']);
        event.reply('retorno-almacenes', rows[0]['MAX(id)'])
      }
    )
  });

  //Obtiene el id del producto seleccionado en la tabla
  ipcMain.on('ob-dpe-producto', (event, id)=>{
    console.log("Id del producto seleccionado: " + id)
    dpe = id;
  });

  //Regresa la informacion del producto seleccionado en la tabla
  ipcMain.on('r-dpe-producto', (event)=>{
    db.get(`SELECT *
            FROM productos
            WHERE id = ?`, [dpe], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('editar-producto', rows);
    });

  })

  /**
   * =========== Funciones para la tabla almacenes ===========
   */
  //Selecciona todos los almacenes
  ipcMain.on('obtener-almacenes', (event) => {
    db.all(`SELECT *
            FROM almacenes`, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('almacenes-cargados', rows);
    });
  });

  //Regresa los almacenes ordenados
  ipcMain.on('obtener-almacenes-sorted', (event, sort) => {
    let stmt = `SELECT *
                FROM almacenes a
                ORDER BY `;
    if (sort.campo != null) {
      console.log("Tabla ordenada por " + sort.campo + " " + sort.orden);
      stmt = stmt + ` ${sort.campo} ${sort.orden}`;
    }
    db.all(stmt, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('almacenes-cargados', rows);
    });
  });

  //Busqueda de almacenes con filtroe
  ipcMain.on('almacenes-filtros', (event, filter) => {
    let stmt = `SELECT *
                FROM almacenes
                WHERE TRUE ` + filter;

    console.log('Filtros de busqueda: ' + filter);

    db.all(stmt, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('almacenes-cargados', rows);
    });
  });

  //Eliminar almacen
  ipcMain.on('eliminar-almacen', (event, id) => {
    let stmt = "DELETE FROM almacenes WHERE id = ?";
    db.run(stmt, [id], (err, rows) => {
    });
  });

  //Edita la informacion de un almacen
  ipcMain.on('actualizar-almacen', (event, elemento) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`UPDATE almacenes
            SET nombre      = ?,
                lastmoddate = ?,
                lastmoduser = ?
            WHERE id = ?;`, [elemento.nombre, date, usuario[0], elemento.id]);
  });

  //Agrega un almacen a la tabla (con id por autoincremento)
  ipcMain.on('agregar-almacen', (event, nombre) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`INSERT INTO almacenes (nombre, lastmoddate, lastmoduser, creationdate)
            VALUES (?, ?, ?, ?);`, [nombre, date, usuario[0], date]);
  });

  //Agrega un almacen a la tabla (con id dado por el usuario)
  ipcMain.on('agregar-almacen-id', (event, elemento) => {
    let date = new Date().toLocaleDateString('es-MX') + " " + new Date().toLocaleTimeString('es-MX');

    db.run(`INSERT INTO almacenes (id, nombre, lastmoddate, lastmoduser, creationdate)
            VALUES (?, ?, ?, ?, ?);`, [elemento.id, elemento.nombre, date, usuario[0], date])
  });

  //Verifica si existe un almacen con cierto id
  ipcMain.on('verificar-existencia-almacenes', (event, id) => {
    db.all(`SELECT *
            FROM almacenes
            WHERE id = ?`, [id], (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }

        if (rows.length === 0) {
          console.log('El elemento no existe');
          event.reply('obtener-existencia-almacenes', false);
        } else {
          console.log('El elemento existe');
          event.reply('obtener-existencia-almacenes', true);
        }
      }
    )
  });

  //Regresa la informacion del dato seleccionado en la tabla
  ipcMain.on('r-dpe-almacen', (event)=>{
    db.get(`SELECT *
            FROM almacenes
            WHERE id = ?`, [dpe], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      event.reply('editar-almacen', rows);
    });

  });

  //Cuadro de texto de confirmacion
  ipcMain.handle('mostrar-confirmacion', async (event, opciones) => {
    const resultado = await dialog.showMessageBox(win, {
      type: 'question',
      title: opciones.titulo || 'Confirmación',
      message: opciones.mensaje,
      buttons: ['Sí', 'Cancelar'],
      defaultId: 0, // Botón por defecto
      cancelId: 1   // Botón al presionar ESC
    });

    return resultado.response;
  });

  ipcMain.handle('mostrar-error', async (event, opciones) => {
    await dialog.showErrorBox(
      opciones.titulo || 'Error',
      opciones.mensaje
    );
  });



  //Guarda el ultimo estado de la vista tablas
  ipcMain.on('guardar-tabla', (event, tabla) => {
    tablaAbierta = tabla;
    console.log("Tabla accedida: " + tablaAbierta)
  });

  //Regresa el ultimo estado de la vista tablas
  ipcMain.on('enviar-tabla', (event) => {
    event.reply('recibir-tabla', tablaAbierta);
  });
}
