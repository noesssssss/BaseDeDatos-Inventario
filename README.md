1. Introducción
Se requiere desarrollar un sistema de manejo de inventario para una empresa que maneja productos en diferentes almacenes y ciudades. El sistema debe componerse de diferentes vistas, siendo un programa de escritorio, y este debe tener conexión a una base de datos interna. El sistema debe incluir inicio de sesión, manejo de roles de usuarios, encripción de contraseñas y un sistema CRUD para las tablas existentes en la base de datos.
3. Solución
Se decidió desarrollar el programa en JavaScript, con diseño en HTML y CSS para su facilidad de manejo gracias al Document Object Model, además del conocimiento previo de estas herramientas. Para poder realizar la aplicación como un programa de escritorio, se utiliza el framework Electron, el cual nos permite ultilizar directamente archivos HTML sin necesidad de que se abran en un navegador. Electron también requiere de comunicación entre procesos (inter-process communication) para que el sistema funcione correctamente. Por esta razón, el código de funcionalidad se divide en main.js (donde están todas las funciones de ventana y manejo de base de datos) y script.js (el archivo que se conecta a HTML, e interactua con los elementos del archivo para mandar a llamar acciones de main). Con el uso de estas herramientas, se realiza el programa de inventario cumpliendo con los requisitos del proyecto.
4. Implementación
* Base de datos
Al ser un programa directamente enlazado con la base de datos SQLite, necesitamos conocer la estructura de nuestras tablas y nuestro sistema.
La base de datos se compone de tres tablas:
- Usuarios. Esta tabla contiene la información requerida para el inicio de sesión de un usuario (nombre de usuario, contraseña, rol y ultimo inicio de sesion).
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/tablausuarios.png">
- Productos. Esta tabla contiene toda la información requerida de los productos existentes en los almacenes.
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/tablaproductos.png">
- Almacenes. Esta tabla contiene únicamente id y nombre del almacén (además de los campos de control de edición).
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/tablaalmacenes.png">
- Roles
Teniendo en cuenta los diferentes tipos de usuarios existentes, estos tendrán restricciones bastante directas en su rol.
Almacén: Sólo puede modificar la tabla almacenes
Productos: Sólo puede modificar la tabla productos
Admin: Puede acceder a todo
Los roles aplican al momento de agregar, editar o eliminar un registro. Los roles no influyen en como lo usuarios acceden a la información, pero sí en cómo interactúan con ella. Si el usuario intenta realizar una acción no permitida por su rol, se mostrará un mensaje de error que lo comunique. De igual forma, si el rol sí lo permite, se mostrará un mensaje de confirmación antes de cada acción.
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/error.png">
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/confirmar.png">
* Programa
- Inicio de sesión
El programa es, en esencia, una interfaz en la que los usuarios manejadores del inventario realizarán las acciones correspondientes a su trabajo. Al abrir la aplicación los recibirá una ventana de inicio de sesión para introducir su usuario y contraseña.
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/login.png">
- Usuarios
Al ser un sistema interno de una empresa, no existe manera de crear usuarios nuevos mediante interfaz. De igual forma, no existe manera de recuperar la contraseña ni dejar la sesión abierta.
Las contraseñas, al crear usuarios, son encriptadas antes de mandarse a la base de datos con el uso de bcryptjs. Se crea un código aleatorio y se encripta la contraseña. Al momento de que un usuario inicia sesión, se reciben los datos de la BD y se compara la contraseña introducida con la contraseña en la BD del usuario introducido con uso de la función compare de bcrypt
Si la función compare retorna verdadero, se guarda el rol de inicio de sesión, se actualiza la última fecha de inicio de sesión, y se manda al usuario a la página principal.
- Pantalla principal
Aquí, se recibe al usuario con el logotipo de la universidad, título y dos botones: Almacenes y Productos. Cada botón muestra su respectiva tabla al dar click.
También, a través de estas pantallas, está la barra de navegación, en la cual el usuario puede intercambiar su vista o cerrar la sesión.
Si el usuario decide cerrar la sesión, los valores correspondientes al rol guardado y última tabla abierta se regresarán a nulo (su valor por defecto) y se esperará a que el usuario vuelva a iniciar sesión
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/principal.png">
- Tablas
Al dar click en los botones de cualquiera de las dos tablas, se mostrarán todos los registros existentes en ellas. Se mostrarán también cuatro botones nuevos: Volver (la flecha, regresará a la pantalla principal), Editar/Agregar (manda al usuario a un formulario con todos los campos para editar o agregar un producto), Eliminar (mostrará un diálogo de confirmación antes de modificar el registro), y Filtros (donde el usuario puede buscar por cualquier campo que desee). Ambas puede ser vistas por todos los usuarios.
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/almacenes">
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/productos.png">
- Filtros y ordenamiento
En esta sección el usuario ingresa los datos por los que quiere buscar algún almacén o producto en específico. Los filtros se pueden acumular. Si el usuario desea eliminar los filtros puede dar click a “limpiar campos” y posteriormente a “filtrar” nuevamente para obtener todos los datos otra vez.
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/filtrosalmacenes.png">
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/filtrosproductos.png">
El usuario también tiene la opción de ordenar según el campo que desee con simplemente darle click al nombre de la columna por la que desee ordenar. El tipo de ordenamiento se intercambiará entre ascendente y descendente con cada click.
El usuario solo puede filtrar u ordenar a la vez, no ambas juntas.
- Editar/Agregar
En esta pantalla el usuario puede introducir la información de un producto u obtenerla precargada si seleccionó algún registro en la pantalla anterior. Dentro de esta acción pueden pasar 3 cosas:
Si el usuario introduce un id y existe un registro con el mismo, se editará.
Si el usuario introduce un id y NO existe un registro con ese id, se agregará.
Si el usuario no introduce un id, se agregará con autoincremento.
Todos los campos son obligatorios
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/almacenagregar.png">
<img src="https://github.com/noesssssss/BaseDeDatos-Inventario/blob/master/imgs_readme_bd/productoagregar.png">
- Eliminar
Si el usuario desea eliminar un producto o almacen de las tablas, basta con seleccionar el registro a eliminar dentro de la tabla (este se resaltará de color azul), y posteriormente presionar el boton rojo de eliminar. Al hacer esto, si se tiene permiso de edición de la tabla, se mostrará un mensaje de confirmación. Al momento de confirmar se actualizará automáticamente la tabla y mostrará todos los registros existentes en la tabla (claramente sin el registro eliminado). En caso de que no se tenga permiso se mostrará un mensaje de error. Para poder eliminar se tiene que seleccionar un registro de la tabla, si no se selecciona nada, no se mostrará ningún mensaje ni realizará ninguna acción.
5. Conclusión
En el desarrollo de este proyecto se revisitaron conocimientos obtenidos en etapas anteriores de educación (y repasados en el curso), además de agregar conocimiento nuevo con el tipo de programa desarrollado. El uso de las herramientas de diseño web (HTML, CSS y JavaScript) hizo que el desarrollo del proyecto fuera, por un lado, más fácil de desarrollar y probar para corregir errores. Sin embargo, el uso de una nueva tecnología en el desarrollo (Electron) fue un desafío que se logró superar gracias a el mismo conocimiento previo del lenguaje. El uso de las bases de datos, y específicamente SQL, fue reforzado y estudiado a lo largo del proyecto, refrescando conocimiento obtenido, y descubriendo nuevos aspectos del tema.
