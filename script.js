// Cargar bases de datos desde la memoria del PC (LocalStorage)
let inventario = JSON.parse(localStorage.getItem("market_productos")) || [];
let bitacora = JSON.parse(localStorage.getItem("market_visitas")) || [];

// ==========================================
// 🤖 SIMULADOR INTELIGENTE DE PRECIOS
// ==========================================
function evaluarCamposIA() {
    const categoria = document.getElementById("categoria").value;
    const seccionSimulador = document.getElementById("seccion-simulador");
    
    // Solo mostrar el asistente para Uniformes y Materiales
    if (categoria === "uniformes" || categoria === "materiales") {
        seccionSimulador.style.display = "block";
        calcularPrecioSugerido();
    } else {
        seccionSimulador.style.display = "none";
        if(categoria === "donaciones") {
            document.getElementById("precio").value = 0;
        }
    }
}

function calcularPrecioSugerido() {
    const categoria = document.getElementById("categoria").value;
    const estado = document.getElementById("estado-articulo").value;
    const textoSugerencia = document.getElementById("precio-sugerido-texto");
    const inputPrecio = document.getElementById("precio");
    
    let precioSugerido = 0;

    if (categoria === "uniformes") {
        if (estado === "nuevo") precioSugerido = 35000;
        if (estado === "bueno") precioSugerido = 20000;
        if (estado === "desgastado") precioSugerido = 10000;
    } else if (categoria === "materiales") {
        if (estado === "nuevo") precioSugerido = 15000;
        if (estado === "bueno") precioSugerido = 8000;
        if (estado === "desgastado") precioSugerido = 3000;
    }

    textoSugerencia.innerText = `💡 Tarifa sugerida para el colegio: $${precioSugerido.toLocaleString()} COP`;
    inputPrecio.value = precioSugerido; // Le autocompleta el precio para ayudarle
}
// ==========================================

// Capturar formulario (Funciona tanto en index.html como en admin.html)
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
            const esAdmin = (dueño === "Administrador");

            const nuevoArticulo = {
                id: Date.now(),
                categoria: categoria,
                producto: productoNom,
                precio: precioNom,
                descripcion: descripNom,
                vendedor: dueño,
                contacto: contactoDueño,
                imagen: lector.result,
                estado: "disponible", 
                tipoUsuario: esAdmin ? "admin" : "publico"
            };

            inventario.push(nuevoArticulo);
            localStorage.setItem("market_productos", JSON.stringify(inventario));

            registrarActividad(dueño, `Publicó el producto: ${productoNom}`);

            if (document.getElementById("productos")) {
                mostrarProductosGuardados();
            }
            if (document.getElementById("lista-registros")) {
                actualizarTablaAdmin();
            }

            formulario.reset();
            // Ocultar asistente si estamos en index
            if(document.getElementById("seccion-simulador")) {
                document.getElementById("seccion-simulador").style.display = "none";
            }
            alert("¡Publicación realizada con éxito!");
        });

        if (archivoFoto) {
            lector.readAsDataURL(archivoFoto);
        }
    });
}

// MOSTRAR PRODUCTOS DISPONIBLES EN EL INDEX
function mostrarProductosGuardados() {
    const productosContainer = document.getElementById("productos");
    if (!productosContainer) return; 
    
    productosContainer.innerHTML = ""; 
    const disponibles = inventario.filter(item => item.estado !== "vendido");

    if (disponibles.length === 0) {
        productosContainer.innerHTML = "<p style='color:#777; width:100%;'>No hay productos disponibles por el momento.</p>";
        return;
    }

    disponibles.forEach(item => {
        const etiquetaVendedor = item.tipoUsuario === "admin" 
            ? `<span style="background:#0056b3; color:white; padding:3px 8px; border-radius:10px; font-size:11px; display:inline-block; margin-bottom:5px;">📢 Publicación Administrador</span>`
            : ``;

        productosContainer.innerHTML += `
            <div class="producto ${item.categoria}">
                <img src="${item.imagen}" alt="${item.producto}">
                <div class="producto-info">
                    ${etiquetaVendedor}
                    <h3>${item.producto}</h3>
                    <p>${item.descripcion}</p>
                    <strong>Precio/Tarifa: $${parseInt(item.precio).toLocaleString()}</strong>
                    
                    <div class="vendedor-info">
                        <p>👤 <strong>Vendedor:</strong> ${item.vendedor}</p>
                        <p>📱 <strong>Contacto:</strong> ${item.contacto}</p>
                        <button onclick="marcarComoVendido(${item.id})" style="margin-top:10px; background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; width:100%;">✔️ Marcar como Vendido</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// OCULTAR SI SE MARCA COMO VENDIDO
function marcarComoVendido(id) {
    if (confirm("¿Ya vendiste este producto? Se quitará de la vitrina pública.")) {
        inventario = inventario.map(item => {
            if (item.id === id) {
                item.estado = "vendido";
                registrarActividad(item.vendedor, `Marcó como VENDIDO el producto: ${item.producto}`);
            }
            return item;
        });
        localStorage.setItem("market_productos", JSON.stringify(inventario));
        mostrarProductosGuardados();
    }
}

// FILTRAR EN TIEMPO REAL
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

// REGISTRAR BITÁCORA
function registrarActividad(usuario, accion) {
    const ahora = new Date();
    const registro = {
        fecha: ahora.toLocaleString(),
        usuario: usuario,
        accion: accion
    };
    bitacora.push(registro);
    localStorage.setItem("market_visitas", JSON.stringify(bitacora));
    
    if (document.getElementById("lista-registros")) {
        actualizarTablaAdmin();
    }
}

// REFRESCAR TABLA EN ADMIN
function actualizarTablaAdmin() {
    const tablaBody = document.getElementById("lista-registros");
    if (!tablaBody) return; 

    tablaBody.innerHTML = "";
    
    inventario.forEach(item => {
        const esVendido = item.estado === "vendido";
        const estiloFila = esVendido ? 'background-color: #f8d7da; color: #721c24;' : 'background-color: #fffdec;';
        const textoEstado = esVendido ? '🔴 [VENDIDO]' : '✨ Activo';

        tablaBody.innerHTML += `
            <tr style="${estiloFila}">
                <td>${textoEstado}</td>
                <td><strong>${item.vendedor}</strong> ${item.tipoUsuario === 'admin' ? '(Admin)' : ''}</td>
                <td>${item.contacto}</td>
                <td>${item.producto}</td>
                <td><span class="badge">${item.categoria}</span></td>
                <td>
                    <button onclick="eliminarProducto(${item.id})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar por completo</button>
                </td>
            </tr>
        `;
    });

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

// ELIMINAR REGISTRO DEFINITIVO
function eliminarProducto(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este registro por completo del sistema?")) {
        inventario = inventario.filter(item => item.id !== id);
        localStorage.setItem("market_productos", JSON.stringify(inventario));
        registrarActividad("Administrador", "Eliminó un artículo definitivamente");
        actualizarTablaAdmin();
    }
}

if (document.getElementById("lista-registros")) {
    actualizarTablaAdmin();
}