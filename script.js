// Bases de datos en LocalStorage
let inventario = JSON.parse(localStorage.getItem("market_productos")) || [];
let bitacora = JSON.parse(localStorage.getItem("market_visitas")) || [];
let usuarios = JSON.parse(localStorage.getItem("market_usuarios")) || [];
let usuarioActivo = localStorage.getItem("market_usuario_activo") || null;
let carrito = JSON.parse(localStorage.getItem(`carrito_${usuarioActivo}`)) || [];

let modoRegistro = false;

function inicializarPlataforma() {
    actualizarInterfazUsuario();
    mostrarProductosGuardados();
    if (document.getElementById("lista-registros")) {
        actualizarTablaAdmin();
    }
}

// CONMUTAR INTERFAZ SEGÚN USUARIO LOGUEADO
function actualizarInterfazUsuario() {
    const anonimoDiv = document.getElementById("info-usuario-anonimo");
    const logueadoDiv = document.getElementById("info-usuario-logueado");
    const formularioDiv = document.getElementById("contenedor-formulario-vendedor");
    const rangoAdmin = document.getElementById("rango-admin");
    const enlacePanelAdmin = document.getElementById("enlace-panel-admin");
    const tituloForm = document.getElementById("titulo-formulario");
    const btnForm = document.getElementById("btn-enviar-formulario");

    if (!anonimoDiv || !logueadoDiv) return;

    if (usuarioActivo) {
        anonimoDiv.style.display = "none";
        logueadoDiv.style.display = "flex";
        document.getElementById("nombre-usuario-activo").innerText = usuarioActivo;
        formularioDiv.style.display = "block"; 

        // Personalización si el usuario es el Administrador supremo
        if (usuarioActivo === "Administrador") {
            if(rangoAdmin) rangoAdmin.style.display = "inline-block";
            if(enlacePanelAdmin) enlacePanelAdmin.style.display = "inline-block";
            if(tituloForm) tituloForm.innerText = "📢 Publicar Anuncio u Oferta Oficial (Administración)";
            if(btnForm) {
                btnForm.innerText = "Publicar Oferta Administrativa";
                btnForm.style.background = "#0056b3";
            }
        } else {
            if(rangoAdmin) rangoAdmin.style.display = "none";
            if(enlacePanelAdmin) enlacePanelAdmin.style.display = "none";
            if(tituloForm) tituloForm.innerText = "📢 Publicar un Nuevo Artículo o Servicio";
            if(btnForm) {
                btnForm.innerText = "Subir al Marketplace";
                btnForm.style.background = "#28a745";
            }
        }

        carrito = JSON.parse(localStorage.getItem(`carrito_${usuarioActivo}`)) || [];
        actualizarContadorCarrito();
    } else {
        anonimoDiv.style.display = "flex";
        logueadoDiv.style.display = "none";
        formularioDiv.style.display = "none"; 
    }
}

// MANEJO DE VENTANAS MODALES FLOTANTES
function abrirModalAuth() { document.getElementById("modal-auth").style.display = "block"; }
function cerrarModalAuth() { document.getElementById("modal-auth").style.display = "none"; }
function toggleCarrito() {
    const modal = document.getElementById("modal-carrito");
    if(!modal) return;
    if(modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
        renderizarCarrito();
    }
}

function cambiarModoAuth(registrar) {
    modoRegistro = registrar;
    const titulo = document.getElementById("auth-titulo");
    const boton = document.getElementById("btn-auth-principal");
    const texto = document.getElementById("texto-cambio-auth");

    if (modoRegistro) {
        titulo.innerText = "Crear Cuenta Escolar";
        boton.innerText = "Registrarse";
        boton.style.background = "#28a745";
        texto.innerHTML = '¿Ya tienes cuenta? <a href="#" onclick="cambiarModoAuth(false)">Inicia sesión aquí</a>';
    } else {
        titulo.innerText = "Iniciar Sesión";
        boton.innerText = "Ingresar";
        boton.style.background = "#0056b3";
        texto.innerHTML = '¿Quieres vender o usar el carrito? <a href="#" onclick="cambiarModoAuth(true)">Regístrate aquí</a>';
    }
}

function procesarAuth() {
    const userTxt = document.getElementById("auth-usuario").value.trim();
    const claveTxt = document.getElementById("auth-clave").value;

    if (!userTxt || !claveTxt) return alert("Completa todos los datos.");

    // CUENTA SUPREMA DE ADMINISTRADOR
    if (userTxt.toLowerCase() === "admin" && claveTxt === "admin123") {
        usuarioActivo = "Administrador";
        localStorage.setItem("market_usuario_activo", usuarioActivo);
        cerrarModalAuth();
        registrarActividad(usuarioActivo, "Inició sesión como Administrador Supremo");
        inicializarPlataforma();
        return;
    }

    if (modoRegistro) {
        if (usuarios.find(u => u.username.toLowerCase() === userTxt.toLowerCase())) {
            return alert("Este nombre de usuario ya está registrado.");
        }
        usuarios.push({ username: userTxt, clave: claveTxt });
        localStorage.setItem("market_usuarios", JSON.stringify(usuarios));
        usuarioActivo = userTxt;
        alert("¡Cuenta de vendedor creada con éxito!");
    } else {
        const valido = usuarios.find(u => u.username.toLowerCase() === userTxt.toLowerCase() && u.clave === claveTxt);
        if (valido) {
            usuarioActivo = valido.username;
        } else {
            return alert("Usuario o contraseña incorrectos.");
        }
    }
    
    localStorage.setItem("market_usuario_activo", usuarioActivo);
    cerrarModalAuth();
    registrarActividad(usuarioActivo, "Inició sesión en la plataforma");
    inicializarPlataforma();
}

function cerrarSesion() {
    registrarActividad(usuarioActivo, "Cerró sesión");
    localStorage.removeItem("market_usuario_activo");
    usuarioActivo = null;
    inicializarPlataforma();
}

// ASISTENTE LÓGICO DE PRECIOS
function evaluarCamposIA() {
    const categoria = document.getElementById("categoria").value;
    const seccionSimulador = document.getElementById("seccion-simulador");
    if (categoria === "uniformes" || categoria === "materiales") {
        seccionSimulador.style.display = "block";
        calcularPrecioSugerido();
    } else {
        seccionSimulador.style.display = "none";
        if(categoria === "donaciones") document.getElementById("precio").value = 0;
    }
}

function calcularPrecioSugerido() {
    const categoria = document.getElementById("categoria").value;
    const estado = document.getElementById("estado-articulo").value;
    let precioSugerido = 0;
    if (categoria === "uniformes") {
        precioSugerido = estado === "nuevo" ? 35000 : estado === "bueno" ? 20000 : 10000;
    } else if (categoria === "materiales") {
        precioSugerido = estado === "nuevo" ? 15000 : estado === "bueno" ? 8000 : 3000;
    }
    document.getElementById("precio-sugerido-texto").innerText = `💡 Sugerido para el colegio: $${precioSugerido.toLocaleString()} COP`;
    document.getElementById("precio").value = precioSugerido;
}

// PROCESAR PUBLICACIÓN DE PRODUCTOS
const formulario = document.getElementById("formulario");
if (formulario) {
    formulario.addEventListener("submit", function(e) {
        e.preventDefault();
        const archivoFoto = document.getElementById("foto").files[0];
        const lector = new FileReader();
        
        lector.addEventListener("load", function() {
            const nuevoArticulo = {
                id: Date.now(),
                categoria: document.getElementById("categoria").value,
                producto: document.getElementById("producto").value,
                precio: document.getElementById("precio").value,
                descripcion: document.getElementById("descripcion").value,
                vendedor: usuarioActivo,
                contacto: document.getElementById("contacto").value,
                imagen: lector.result,
                estado: "disponible",
                tipoUsuario: usuarioActivo === "Administrador" ? "admin" : "publico"
            };

            inventario.push(nuevoArticulo);
            localStorage.setItem("market_productos", JSON.stringify(inventario));
            formulario.reset();
            if(document.getElementById("seccion-simulador")) {
                document.getElementById("seccion-simulador").style.display = "none";
            }
            registrarActividad(usuarioActivo, `Publicó el producto: ${nuevoArticulo.producto}`);
            mostrarProductosGuardados();
            alert("¡Publicado exitosamente en el colegio!");
        });
        if (archivoFoto) lector.readAsDataURL(archivoFoto);
    });
}

// RENDERIZAR ARTÍCULOS EN LA VITRINA PÚBLICA
function mostrarProductosGuardados() {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const disponibles = inventario.filter(item => item.estado !== "vendido");
    if (disponibles.length === 0) {
        contenedor.innerHTML = "<p style='color:#777; width:100%; text-align:center;'>No hay productos disponibles por el momento.</p>";
        return;
    }

    disponibles.forEach(item => {
        const badgeAdmin = item.tipoUsuario === "admin" ? `<span style="background:#0056b3; color:white; padding:3px 8px; border-radius:10px; font-size:11px; display:inline-block; margin-bottom:5px;">📢 Oficial</span>` : ``;
        
        // REGLA CLAVE DE BOTONES (Súper Administrador vs Dueños vs Invitados)
        let botonAccion = "";
        const esDueñoOAdmin = (usuarioActivo === item.vendedor || usuarioActivo === "Administrador");

        if (usuarioActivo) {
            if (esDueñoOAdmin) {
                // Si soy el dueño o el Administrador global, puedo retirarlo de inmediato
                botonAccion = `<button onclick="marcarComoVendido(${item.id})" style="background:#dc3545; color:white; border:none; padding:8px; border-radius:4px; width:100%; cursor:pointer; font-weight:bold; margin-top:10px;">🔴 Retirar Publicación</button>`;
            } else {
                // Si es el producto de otra persona, puedo añadirlo al carrito personal
                botonAccion = `<button onclick="agregarAlCarrito(${item.id})" style="background:#ffc107; color:#212529; border:none; padding:8px; border-radius:4px; width:100%; cursor:pointer; font-weight:bold; margin-top:10px;">🛒 Añadir al Carrito</button>`;
            }
        } else {
            // Invitado común
            botonAccion = `<p style="font-size:11px; color:#888; text-align:center; margin-top:10px; font-style:italic;">🔑 Inicia sesión para guardar en tu carrito</p>`;
        }

        contenedor.innerHTML += `
            <div class="producto ${item.categoria}">
                <img src="${item.imagen}">
                <div class="producto-info">
                    ${badgeAdmin}
                    <h3>${item.producto}</h3>
                    <p>${item.descripcion}</p>
                    <strong>Precio: $${parseInt(item.precio).toLocaleString()}</strong>
                    <div class="vendedor-info">
                        <p>👤 <strong>Vendedor:</strong> ${item.vendedor}</p>
                        <p>📱 <strong>Contacto:</strong> ${item.contacto}</p>
                        ${botonAccion}
                    </div>
                </div>
            </div>
        `;
    });
}

function marcarComoVendido(id) {
    const itemProd = inventario.find(i => i.id === id);
    if (!itemProd) return;

    if (confirm(`¿Estás seguro de retirar la publicación "${itemProd.producto}" del sistema?`)) {
        inventario = inventario.map(item => { 
            if(item.id === id) {
                item.estado = "vendido"; 
                registrarActividad(usuarioActivo, `Retiró la publicación: ${item.producto}`);
            }
            return item; 
        });
        localStorage.setItem("market_productos", JSON.stringify(inventario));
        mostrarProductosGuardados();
        if (document.getElementById("lista-registros")) actualizarTablaAdmin();
    }
}

// ==========================================
// 🛒 LOGICA DEL CARRITO DE COMPRAS (ESTILO TEMU)
// ==========================================
function agregarAlCarrito(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    
    if (carrito.find(c => c.id === id)) return alert("Este artículo ya está en tu carrito.");
    
    carrito.push(item);
    localStorage.setItem(`carrito_${usuarioActivo}`, JSON.stringify(carrito));
    actualizarContadorCarrito();
    alert(`"${item.producto}" guardado en tu carrito.`);
}

function actualizarContadorCarrito() {
    const contador = document.getElementById("contador-carrito");
    if(contador) contador.innerText = carrito.length;
}

function renderizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    const totalCont = document.getElementById("total-carrito");
    if(!lista) return;

    lista.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = "<p style='color:#777; text-align:center;'>Tu carrito de interés está vacío.</p>";
        totalCont.innerText = "$0";
        return;
    }

    carrito.forEach((item, index) => {
        total += parseInt(item.precio);
        lista.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee; gap:10px;">
                <div style="text-align:left;">
                    <span style="font-weight:bold; font-size:14px;">${item.producto}</span><br>
                    <span style="font-size:12px; color:#28a745; font-weight:bold;">$${parseInt(item.precio).toLocaleString()}</span>
                    <span style="font-size:11px; color:#666;"> - Vendedor: ${item.vendedor} (Grado/Tel: ${item.contacto})</span>
                </div>
                <button onclick="eliminarDelCarrito(${index})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Quitar</button>
            </div>
        `;
    });
    totalCont.innerText = `$${total.toLocaleString()}`;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem(`carrito_${usuarioActivo}`, JSON.stringify(carrito));
    actualizarContadorCarrito();
    renderizarCarrito();
}

// FILTRADO DE CATEGORÍAS
function filtrarProductos(cat) {
    document.querySelectorAll(".producto").forEach(t => {
        t.style.display = (cat === "todos" || t.classList.contains(cat)) ? "block" : "none";
    });
}

// CONTROL DE HISTORIAL (BITÁCORA)
function registrarActividad(user, acc) {
    bitacora.push({ fecha: new Date().toLocaleString(), usuario: user, accion: acc });
    localStorage.setItem("market_visitas", JSON.stringify(bitacora));
}

// RENDERIZAR TABLA DE AUDITORÍA (Pestaña admin.html)
function actualizarTablaAdmin() {
    const tablaBody = document.getElementById("lista-registros");
    if (!tablaBody) return; 

    tablaBody.innerHTML = "";
    
    // 1. Mostrar estado de los productos
    inventario.forEach(item => {
        const esVendido = item.estado === "vendido";
        const estiloFila = esVendido ? 'background-color: #f8d7da; color: #721c24;' : 'background-color: #fffdec;';
        const textoEstado = esVendido ? '🔴 [VENDIDO/RETIRADO]' : '✨ Activo';

        tablaBody.innerHTML += `
            <tr style="${estiloFila}">
                <td>${textoEstado}</td>
                <td><strong>${item.vendedor}</strong></td>
                <td>${item.contacto}</td>
                <td>${item.producto}</td>
                <td><span class="badge">${item.categoria}</span></td>
                <td>
                    <button onclick="eliminarProductoDefinitivo(${item.id})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:11px;">Eliminar por Completo</button>
                </td>
            </tr>
        `;
    });

    // 2. Mostrar logs de ingresos y cierres de sesión
    bitacora.slice().reverse().forEach(log => {
        tablaBody.innerHTML += `
            <tr style="background:#f8f9fa;">
                <td>📋 LOG</td>
                <td><strong>${log.usuario}</strong></td>
                <td>--</td>
                <td colspan="3" style="color: #666; font-style: italic; font-size:12px;">${log.accion} - (${log.fecha})</td>
            </tr>
        `;
    });
}

function eliminarProductoDefinitivo(id) {
    if (confirm("¿Estás completamente seguro de borrar este artículo de forma permanente del disco duro del sistema? Esto no se puede deshacer.")) {
        inventario = inventario.filter(item => item.id !== id);
        localStorage.setItem("market_productos", JSON.stringify(inventario));
        registrarActividad("Administrador", "Eliminó un registro de forma permanente");
        actualizarTablaAdmin();
    }
}