// Protección ante localStorage vacío en celulares nuevos usando '|| []'
let productos = JSON.parse(localStorage.getItem('market_productos')) || [];
let usuarios = JSON.parse(localStorage.getItem('market_usuarios')) || [];
let carrito = JSON.parse(localStorage.getItem('market_carrito')) || [];
let usuarioActivo = JSON.parse(localStorage.getItem('market_sesion')) || null;

const ADMIN_USER = "admin";
const ADMIN_PASS = "damaso2025";

let modoAuth = "ingreso";
let categoriaFiltro = "todos";

const btnAuth = document.getElementById('btnAuth');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const infoUsuario = document.getElementById('info-usuario');
const seccionVendedor = document.getElementById('seccion-vendedor');
const vitrina = document.getElementById('vitrina-productos');
const contadorCarrito = document.getElementById('contador-carrito');
const modalAuth = document.getElementById('modal-auth');
const modalCarrito = document.getElementById('modal-carrito');

document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazUsuario();
    renderizarProductos();
    actualizarContadorCarrito();
    configurarEventos();
});

function configurarEventos() {
    btnAuth.addEventListener('click', () => { modalAuth.style.display = 'flex'; });
    document.getElementById('cerrar-auth').addEventListener('click', () => { modalAuth.style.display = 'none'; });
    
    document.getElementById('btnVerCarrito').addEventListener('click', () => {
        renderizarCarrito();
        modalCarrito.style.display = 'flex';
    });
    document.getElementById('cerrar-carrito').addEventListener('click', () => { modalCarrito.style.display = 'none'; });

    document.getElementById('enlace-cambio-auth').addEventListener('click', () => {
        const titulo = document.getElementById('auth-titulo');
        const btnSubmit = document.getElementById('btn-submit-auth');
        const pCambio = document.getElementById('enlace-cambio-auth');
        
        if (modoAuth === "ingreso") {
            modoAuth = "registro";
            titulo.textContent = "Crear Cuenta Nueva";
            btnSubmit.textContent = "Registrarme";
            pCambio.textContent = "Ya tengo cuenta, ingresar";
        } else {
            modoAuth = "ingreso";
            titulo.textContent = "Iniciar Sesión";
            btnSubmit.textContent = "Ingresar";
            pCambio.textContent = "Regístrate aquí";
        }
    });

    // Control por SUBMIT (Garantiza que el botón "Ir" del celular sí procese los datos)
    document.getElementById('form-auth').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('auth-usuario').value.trim();
        const clave = document.getElementById('auth-clave').value;

        if (modoAuth === "ingreso") {
            if (user === ADMIN_USER && clave === ADMIN_PASS) {
                usuarioActivo = { nombre: "Súper Administrador", rol: "admin" };
                localStorage.setItem('market_sesion', JSON.stringify(usuarioActivo));
                window.location.href = 'admin.html';
                return;
            } else {
                const encontrado = usuarios.find(u => u.nombre === user && u.clave === clave);
                if (encontrado) {
                    usuarioActivo = { nombre: encontrado.nombre, rol: "vendedor" };
                } else {
                    alert("Credenciales incorrectas.");
                    return;
                }
            }
        } else {
            if (user === ADMIN_USER || usuarios.some(u => u.nombre === user)) {
                alert("Usuario no disponible.");
                return;
            }
            usuarios.push({ nombre: user, clave: clave });
            localStorage.setItem('market_usuarios', JSON.stringify(usuarios));
            usuarioActivo = { nombre: user, rol: "vendedor" };
        }

        localStorage.setItem('market_sesion', JSON.stringify(usuarioActivo));
        actualizarInterfazUsuario();
        renderizarProductos();
        document.getElementById('form-auth').reset();
        modalAuth.style.display = 'none';
    });

    btnCerrarSesion.addEventListener('click', () => {
        usuarioActivo = null;
        localStorage.removeItem('market_sesion');
        actualizarInterfazUsuario();
        renderizarProductos();
    });

    document.getElementById('form-producto').addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoProd = {
            id: Date.now(),
            nombre: document.getElementById('prod-nombre').value,
            categoria: document.getElementById('prod-categoria').value,
            precio: parseInt(document.getElementById('prod-precio').value),
            imagen: document.getElementById('prod-imagen').value,
            propietario: usuarioActivo.nombre
        };

        productos.push(nuevoProd);
        localStorage.setItem('market_productos', JSON.stringify(productos));
        renderizarProductos();
        document.getElementById('form-producto').reset();
        alert("Artículo publicado con éxito.");
    });

    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
            e.target.classList.add('activo');
            categoriaFiltro = e.target.getAttribute('data-cat');
            renderizarProductos();
        });
    });

    document.getElementById('btn-vaciar-carrito').addEventListener('click', () => {
        carrito = [];
        localStorage.setItem('market_carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        renderizarCarrito();
    });
}

function actualizarInterfazUsuario() {
    if (usuarioActivo) {
        infoUsuario.innerHTML = `Conectado como: <strong>${usuarioActivo.nombre}</strong>`;
        btnAuth.style.display = 'none';
        btnCerrarSesion.style.display = 'inline-block';
        seccionVendedor.style.display = 'block';
    } else {
        infoUsuario.innerHTML = `Navegando como: <strong>Invitado</strong>`;
        btnAuth.style.display = 'inline-block';
        btnCerrarSesion.style.display = 'none';
        seccionVendedor.style.display = 'none';
    }
}

function renderizarProductos() {
    vitrina.innerHTML = "";
    const listaFiltrada = categoriaFiltro === "todos" ? productos : productos.filter(p => p.categoria === categoriaFiltro);

    if (listaFiltrada.length === 0) {
        vitrina.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; color:#777;">Categoría vacía.</p>`;
        return;
    }

    listaFiltrada.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = "tarjeta-producto";
        
        let botonAccion = "";
        if (usuarioActivo) {
            if (p.propietario === usuarioActivo.nombre) {
                botonAccion = `<button class="btn-bloque btn-peligro" onclick="eliminarProducto(${p.id})">Retirar Anuncio</button>`;
            } else {
                botonAccion = `<button class="btn-bloque btn-primario" onclick="agregarAlCarrito(${p.id})">Añadir al Carrito</button>`;
            }
        } else {
            botonAccion = `<button class="btn-bloque btn-primario" onclick="alert('Inicia sesión para añadir al carrito')">Añadir al Carrito</button>`;
        }

        tarjeta.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}">
            <div class="info-prod">
                <h4>${p.nombre}</h4>
                <p class="precio">$${p.precio.toLocaleString()}</p>
                <p class="vendedor">Por: ${p.propietario}</p>
                ${botonAccion}
            </div>
        `;
        vitrina.appendChild(tarjeta);
    });
}

window.agregarAlCarrito = function(id) {
    const prod = productos.find(p => p.id === id);
    if (prod) {
        carrito.push(prod);
        localStorage.setItem('market_carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
    }
};

function actualizarContadorCarrito() {
    contadorCarrito.textContent = carrito.length;
}

function renderizarCarrito() {
    const listaHtml = document.getElementById('lista-carrito');
    const totalHtml = document.getElementById('total-precio-carrito');
    listaHtml.innerHTML = "";
    let sumaTotal = 0;
    
    if (carrito.length === 0) {
        listaHtml.innerHTML = "<p style='color:#777; text-align:center;'>Carrito vacío.</p>";
        totalHtml.textContent = "0";
        return;
    }

    carrito.forEach(item => {
        sumaTotal += item.precio;
        const div = document.createElement('div');
        div.className = "item-carrito";
        div.innerHTML = `<span>${item.nombre}</span><span><strong>$${item.precio.toLocaleString()}</strong></span>`;
        listaHtml.appendChild(div);
    });
    totalHtml.textContent = sumaTotal.toLocaleString();
}

window.eliminarProducto = function(id) {
    if (confirm("¿Retirar este producto?")) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('market_productos', JSON.stringify(productos));
        carrito = carrito.filter(c => c.id !== id);
        localStorage.setItem('market_carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        renderizarProductos();
    }
};