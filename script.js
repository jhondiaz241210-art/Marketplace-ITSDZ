// Cargar bases de datos desde la memoria del PC (LocalStorage)
let inventario = JSON.parse(localStorage.getItem("market_productos")) || [];
let bitacora = JSON.parse(localStorage.getItem("market_visitas")) || [];

// Capturar formulario (Funciona tanto en index.html como en admin.html si existiera)
const formulario = document.getElementById("formulario");
if (formulario) {
    formulario.addEventListener("submit", function(e) {
        e.preventDefault(); 

        const categoria = document.getElementById("categoria").value;
        const productoNom = document.getElementById("producto").value;
        const precioNom = document.getElementById("precio").value;
        const descripNom = document.getElementById("descripcion").value;
        const dueño = document.getElementById("vendedor").value;
        const contactoDueño = document.getElementById("contacto").value;
        
        const archivoFoto = document.getElementById("foto").files[0];
        const lector = new FileReader();
        
        lector.addEventListener("load", function() {
            // Crear el objeto del nuevo producto
            const nuevoArticulo = {
                id: Date.now(),
                categoria: categoria,
                producto: productoNom,
                precio: precioNom,
                descripcion: descripNom,
                vendedor: dueño,
                contacto: contactoDueño,
                imagen: lector.result
            };

            // Guardar en el inventario y actualizar memoria global
            inventario.push(nuevoArticulo);
            localStorage.setItem("market_productos", JSON.stringify(inventario));

            // Registrar la acción de publicación en la bitácora
            registrarActividad(dueño, `Publicó el producto: ${productoNom}`);

            // Actualizar la pantalla según en qué página estemos
            if (document.getElementById("productos")) {
                mostrarProductosGuardados(); // Si estamos en index.html, muestra la tarjeta de una vez
            }
            if (document.getElementById("lista-registros")) {
                actualizarTablaAdmin(); // Si estamos en admin.html, actualiza la tabla
            }

            formulario.reset();
            alert("¡Tu producto ha sido publicado con éxito en la vitrina del colegio!");
        });

        if (archivoFoto) {
            lector.readAsDataURL(archivoFoto);
        }
    });
}

// FUNCIÓN PARA MOSTRAR PRODUCTOS EN LA VISTA PÚBLICA (index.html)
function mostrarProductosGuardados() {
    const productosContainer = document.getElementById("productos");
    if (!productosContainer) return; // Si no está este contenedor, no hace nada
    
    productosContainer.innerHTML = ""; // Limpiar antes de redibujar

    if (inventario.length === 0) {
        productosContainer.innerHTML = "<p style='color:#777; width:100%;'>No hay productos publicados por el momento.</p>";
        return;
    }

    inventario.forEach(item => {
        productosContainer.innerHTML += `
            <div class="producto ${item.categoria}">
                <img src="${item.imagen}" alt="${item.producto}">
                <div class="producto-info">
                    <h3>${item.producto}</h3>
                    <p>${item.descripcion}</p>
                    <strong>Precio/Tarifa: $${item.precio}</strong>
                    
                    <div class="vendedor-info">
                        <p>👤 <strong>Vendedor:</strong> ${item.vendedor}</p>
                        <p>📱 <strong>Contacto:</strong> ${item.contacto}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

// FUNCIÓN PARA FILTRAR EN TIEMPO REAL (Vista Pública)
function filtrarProductos(categoriaSeleccionada) {
    const todasLasTarjetas = document.querySelectorAll(".producto");
    todasLasTarjetas.forEach(tarjeta => {
        if (categoriaSeleccionada === "todos" || tarjeta.classList.contains(categoriaSeleccionada)) {
            tarjeta.style.display = "block";
        } else {
            tarjeta.style.display = "none";
        }
    });
}

// FUNCIÓN PARA REGISTRAR VISITAS O MOVIMIENTOS
function registrarActividad(usuario, accion) {
    const ahora = new Date();
    const registro = {
        fecha: ahora.toLocaleString(),
        usuario: usuario,
        accion: accion
    };
    bitacora.push(registro);
    localStorage.setItem("market_visitas", JSON.stringify(bitacora));
    
    // Solo intenta actualizar la tabla si existe en la página actual
    if (document.getElementById("lista-registros")) {
        actualizarTablaAdmin();
    }
}

// FUNCIÓN PARA LLENAR LA TABLA DEL ADMINISTRADOR (admin.html)
function actualizarTablaAdmin() {
    const tablaBody = document.getElementById("lista-registros");
    if (!tablaBody) return; // Si no es la página de admin, se sale

    tablaBody.innerHTML = "";
    
    // 1. Mostramos los productos que están activos para la venta
    inventario.forEach(item => {
        tablaBody.innerHTML += `
            <tr style="background-color: #fffdec;">
                <td>✨ Producto Activo</td>
                <td><strong>${item.vendedor}</strong></td>
                <td>${item.contacto}</td>
                <td>${item.producto} (Listo para la venta)</td>
                <td><span class="badge">${item.categoria}</span></td>
                <td><button onclick="eliminarProducto(${item.id})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar</button></td>
            </tr>
        `;
    });

    // 2. Mostramos el historial de ingresos y acciones debajo
    bitacora.slice().reverse().forEach(log => {
        tablaBody.innerHTML += `
            <tr>
                <td>${log.fecha}</td>
                <td>${log.usuario}</td>
                <td>--</td>
                <td colspan="3" style="color: #666; font-style: italic;">${log.accion}</td>
            </tr>
        `;
    });
}

// FUNCIÓN DEL ADMINISTRADOR PARA MODERAR / ELIMINAR ARTÍCULOS
function eliminarProducto(id) {
    if (confirm("¿Estás seguro de que deseas quitar este artículo del Marketplace del colegio?")) {
        inventario = inventario.filter(item => item.id !== id);
        localStorage.setItem("market_productos", JSON.stringify(inventario));
        registrarActividad("Administrador", "Eliminó un artículo del sistema");
        
        // Refrescar la tabla del admin de inmediato
        actualizarTablaAdmin();
    }
}

// Ejecutar automáticamente al cargar la página en la que se abra
if (document.getElementById("lista-registros")) {
    actualizarTablaAdmin();
}