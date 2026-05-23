// ============================================
//   Estado global
// ============================================
let todasPreguntas = [];
let preguntas = [];
let actual = 0;
let respuestas = [];
let marcadas = new Set();      // índices de preguntas marcadas como dudosas en el examen actual
let tiempoInicio = 0;
let timerInterval = null;
let tiempoLimite = 0;
let filtroRevision = 'todas';  // todas | incorrectas | correctas | sin-responder | dudosas

// Filtros de configuración del examen
let filtros = {
  categoria: 'todas',
  dimension: 'todas',
  tipo: 'todos',
  cantidad: 'todas',
  modo: 'estudio',
  ponderado: false,  // repetición espaciada simple
  busqueda: ''       // texto libre para filtrar el banco
};

let glosario = null;
let resumenes = null;

// Estado del modo flashcards
let flashcardsState = {
  mazo: [],          // array de preguntas en orden
  idx: 0,            // posición actual en el mazo
  volteada: false,   // si la tarjeta actual está volteada
  resultados: {},    // id de pregunta -> 'sabia' | 'no_sabia' | 'saltada'
  totalOriginal: 0,  // tamaño inicial del mazo (sin reinserciones)
  reinsertadas: new Set()  // ids ya reinsertadas para no duplicar
};

const SEGUNDOS_POR_PREGUNTA_SIMULACRO = 144;
const STORAGE_KEY_EXAMEN = 'usicamm_examen_actual';
const STORAGE_KEY_NOTAS = 'usicamm_notas';
const STORAGE_KEY_REPORTADAS = 'usicamm_reportadas';
const STORAGE_KEY_HISTORIAL = 'usicamm_historial';
const STORAGE_KEY_TRACKING = 'usicamm_tracking';  // por id: { vistas, aciertos, ultimaFecha }

// ============================================
//   Etiquetas legibles
// ============================================
const ETIQUETAS_DIMENSION = {
  agente_formativo: 'Agente formativo',
  conoce_alumnos: 'Conoce a sus alumnos',
  pensamiento_didactico: 'Pensamiento didáctico',
  escuela_transformacion: 'Escuela y transformación'
};

const ETIQUETAS_TIPO = {
  directo: 'Cuestionamiento directo',
  caso: 'Caso situacional',
  valoracion: 'Valoración / juicio',
  completamiento: 'Completamiento',
  ordenamiento: 'Ordenamiento'
};

const ETIQUETAS_MODO = {
  estudio: '📚 Estudio (con feedback inmediato)',
  simulacro: '⏱️ Simulacro (con tiempo límite)'
};

// ============================================
//   Utilidades de localStorage
// ============================================
function leerLS(clave, fallback) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? fallback; }
  catch { return fallback; }
}
function escribirLS(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
}

// Escapa HTML para evitar inyección al renderizar datos del usuario
function escHTML(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNotas() { return leerLS(STORAGE_KEY_NOTAS, {}); }
function setNota(idPregunta, texto) {
  const notas = getNotas();
  if (texto && texto.trim()) notas[idPregunta] = texto;
  else delete notas[idPregunta];
  escribirLS(STORAGE_KEY_NOTAS, notas);
}
function getReportadas() { return new Set(leerLS(STORAGE_KEY_REPORTADAS, [])); }
function addReportada(id, motivo) {
  const list = leerLS(STORAGE_KEY_REPORTADAS, []);
  if (!list.find(r => r.id === id)) {
    list.push({ id, motivo: motivo || '', fecha: new Date().toISOString() });
    escribirLS(STORAGE_KEY_REPORTADAS, list);
  }
}
function getTracking() { return leerLS(STORAGE_KEY_TRACKING, {}); }
function actualizarTracking(idPregunta, acerto) {
  const t = getTracking();
  if (!t[idPregunta]) t[idPregunta] = { vistas: 0, aciertos: 0, ultimaFecha: null };
  t[idPregunta].vistas++;
  if (acerto) t[idPregunta].aciertos++;
  t[idPregunta].ultimaFecha = new Date().toISOString();
  escribirLS(STORAGE_KEY_TRACKING, t);
}

// ============================================
//   Carga inicial
// ============================================
async function cargarPreguntas() {
  // Verificar acceso ANTES de cargar nada
  if (!verificarAcceso()) {
    mostrarPantallaBienvenida();
    return;
  }
  try {
    const res = await fetch('preguntas.json');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al cargar preguntas.json`);
    }
    todasPreguntas = await res.json();
    if (!Array.isArray(todasPreguntas) || todasPreguntas.length === 0) {
      throw new Error('preguntas.json vacío o con formato inválido');
    }
    renderFiltros();
    renderPlaylists();
    renderHistorial();
    actualizarResumenSeleccion();
    verificarExamenGuardado();
    configurarAtajosTeclado();
    renderBienvenidaStat();
    actualizarBotonAdmin();
    ocultarAppLoading();
  } catch (e) {
    console.error('[cargarPreguntas] Error:', e);
    mostrarErrorCarga(e);
  }
}

function mostrarErrorCarga(e) {
  const el = document.getElementById('app-loading');
  if (!el) return;
  el.innerHTML = `
    <div class="loading-logo" style="background:#ef4444;color:white">!</div>
    <div style="color:white;font-size:1rem;font-weight:600;margin-bottom:0.4rem;text-align:center;max-width:90%">No se pudo cargar el banco de preguntas</div>
    <div style="color:rgba(255,255,255,0.85);font-size:0.85rem;text-align:center;max-width:90%;margin-bottom:1rem;line-height:1.5">${e.message || 'Error desconocido'}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:0.78rem;text-align:center;max-width:90%;line-height:1.5">
      Posibles causas:<br>
      • Service worker con caché vieja: abre DevTools → Application → Unregister<br>
      • Archivo preguntas.json no subido al repo<br>
      • Hard refresh: Cmd/Ctrl+Shift+R
    </div>
    <button onclick="window.location.reload()" style="margin-top:1.2rem;background:white;color:#667eea;border:0;padding:0.6rem 1.4rem;border-radius:8px;font-weight:600;cursor:pointer">Recargar página</button>`;
  el.classList.remove('fade-out');
}

// ============================================
//   Control de acceso (clave compartida)
// ============================================
// Hash SHA-256 de la clave de acceso. Para cambiarla:
// 1. Abre la consola del navegador
// 2. Ejecuta: generarClavesUsuario(['Juan', 'María', 'Pedro'])
// 3. Copia las líneas generadas al objeto CLAVES_AUTORIZADAS abajo
//
// Cada entrada es {hash_SHA-256: 'Etiqueta'}. Cada persona usa su propia clave.
// La etiqueta es para identificar la sesión (no se comparte públicamente).
//
// Para REVOCAR: borra la línea correspondiente y haz git push.
const CLAVES_AUTORIZADAS = {
  '089258f6c4c07a50b03892907580e7dbead828c64ac8c9fe4f522463acfb056a': 'Admin',
  '79ef4dbb7114e80241aa827fb5b62905c15203f65d27e94e2ae103de01a28a19': 'u_001',
  'a4ce0038150263606bde31094d2fc69e0bedff2f4ca2ad60a827e5986ad0ab6b': 'u_002',
};
const STORAGE_KEY_ACCESO = 'usicamm_acceso';
const ACCESO_VIGENCIA_DIAS = 30;  // tras X días sin entrar pide clave de nuevo

async function generarHash(texto) {
  // Vía rápida: Web Crypto API (HTTPS o localhost)
  if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
    try {
  const enc = new TextEncoder();
  const data = enc.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    } catch (e) {
      // Caer al fallback puro
    }
  }
  // Fallback: SHA-256 puro JS (funciona sin contexto seguro)
  return sha256Pure(texto);
}

// SHA-256 implementación pura JS (RFC 6234) — fallback cuando crypto.subtle no está disponible
function sha256Pure(input) {
  const bytes = new TextEncoder().encode(input);
  function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  const H = new Uint32Array([
    0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
  ]);
  const len = bytes.length;
  const bitLen = len * 8;
  const blockCount = Math.ceil((len + 9) / 64);
  const padded = new Uint8Array(blockCount * 64);
  padded.set(bytes);
  padded[len] = 0x80;
  const high = Math.floor(bitLen / 0x100000000);
  const low = bitLen >>> 0;
  padded[padded.length-8] = (high >>> 24) & 0xff;
  padded[padded.length-7] = (high >>> 16) & 0xff;
  padded[padded.length-6] = (high >>> 8) & 0xff;
  padded[padded.length-5] = high & 0xff;
  padded[padded.length-4] = (low >>> 24) & 0xff;
  padded[padded.length-3] = (low >>> 16) & 0xff;
  padded[padded.length-2] = (low >>> 8) & 0xff;
  padded[padded.length-1] = low & 0xff;
  const W = new Uint32Array(64);
  for (let block = 0; block < blockCount; block++) {
    const off = block * 64;
    for (let i = 0; i < 16; i++) {
      W[i] = (padded[off+i*4]<<24) | (padded[off+i*4+1]<<16) | (padded[off+i*4+2]<<8) | padded[off+i*4+3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i-15]) ^ rotr(18, W[i-15]) ^ (W[i-15] >>> 3);
      const s1 = rotr(17, W[i-2]) ^ rotr(19, W[i-2]) ^ (W[i-2] >>> 10);
      W[i] = (W[i-16] + s0 + W[i-7] + s1) | 0;
    }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  return Array.from(H).map(n => (n >>> 0).toString(16).padStart(8, '0')).join('');
}
window.generarHash = generarHash;  // Disponible en consola para generar hashes individuales

// Utilidad para generar claves de usuarios desde la consola.
// Uso:
//   generarClavesUsuario(['Juan', 'María'])              // genera claves random
//   generarClavesUsuario([['Juan', 'mi-clave-juan']])    // con claves específicas
window.generarClavesUsuario = async function(items) {
  if (!Array.isArray(items)) {
    console.error("Uso: generarClavesUsuario(['Juan', 'María']) o generarClavesUsuario([['Juan', 'clave-juan'], ...])");
    return;
  }
  console.log('%cClaves generadas — copia las líneas a CLAVES_AUTORIZADAS en app.js:', 'font-weight:bold;color:#667eea;font-size:13px');
  console.log('');
  const resultado = [];
  for (const item of items) {
    let nombre, clave;
    if (Array.isArray(item)) {
      [nombre, clave] = item;
    } else {
      nombre = item;
      const slug = String(nombre).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      clave = slug + '-' + Math.random().toString(36).slice(2, 8);
    }
    const hash = await generarHash(clave);
    console.log(`  '${hash}': '${nombre}',`);
    console.log(`%c    └─ clave para ${nombre}: ${clave}`, 'color:#10b981;font-weight:600');
    resultado.push({ nombre, clave, hash });
  }
  console.log('');
  console.log('%c⚠ Manda a cada persona SU clave (la línea verde), no el hash. El hash se queda en el código.', 'color:#f59e0b;font-weight:600');
  console.log('%cDespués: copia las líneas, pégalas en CLAVES_AUTORIZADAS, git push.', 'color:#6b7280');
  return resultado;
};

function verificarAcceso() {
  const acceso = leerLS(STORAGE_KEY_ACCESO, null);
  if (!acceso || !acceso.fecha) return false;
  const dias = (Date.now() - acceso.fecha) / (1000 * 60 * 60 * 24);
  if (dias > ACCESO_VIGENCIA_DIAS) {
    localStorage.removeItem(STORAGE_KEY_ACCESO);
    return false;
  }
  // Verifica que el hash siga vigente (puede haber sido revocado)
  return acceso.hash in CLAVES_AUTORIZADAS;
}

function obtenerEtiquetaSesion() {
  const acceso = leerLS(STORAGE_KEY_ACCESO, null);
  if (!acceso || !acceso.hash) return null;
  return CLAVES_AUTORIZADAS[acceso.hash] || null;
}

function mostrarPantallaBienvenida() {
  ocultarAppLoading();
  document.getElementById('pantalla-bienvenida').classList.remove('oculto');
}

async function intentarAcceder(e) {
  e.preventDefault();
  const input = document.getElementById('input-password');
  const check = document.getElementById('check-acepto');
  const errorDiv = document.getElementById('acceso-error');
  const clave = (input.value || '').trim();

  if (!check.checked) {
    errorDiv.textContent = 'Debes aceptar los términos para continuar.';
    errorDiv.classList.remove('oculto');
    return;
  }
  if (!clave) {
    errorDiv.textContent = 'Escribe la clave de acceso.';
    errorDiv.classList.remove('oculto');
    input.focus();
    return;
  }

  const hash = await generarHash(clave);
  if (!(hash in CLAVES_AUTORIZADAS)) {
    errorDiv.textContent = 'Clave incorrecta. Pídesela al autor.';
    errorDiv.classList.remove('oculto');
    input.value = '';
    input.focus();
    // Animación shake
    const card = document.querySelector('.bienvenida-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    return;
  }
  const etiqueta = CLAVES_AUTORIZADAS[hash];

  // Acceso concedido
  escribirLS(STORAGE_KEY_ACCESO, { hash, etiqueta, fecha: Date.now() });
  document.getElementById('pantalla-bienvenida').classList.add('oculto');
  // Mostrar pantalla de carga mientras se cargan las preguntas
  let loading = document.getElementById('app-loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.id = 'app-loading';
    loading.className = 'app-loading';
    loading.innerHTML = '<div class="loading-logo">U</div><div class="loading-spinner"></div><div class="loading-texto">Cargando…</div>';
    document.body.prepend(loading);
  } else {
    loading.classList.remove('fade-out');
  }
  cargarPreguntas();
  toast(`Bienvenido${etiqueta && etiqueta !== 'Admin' ? ', ' + etiqueta : ''}`, 'success');
}

function cerrarSesionAcceso() {
  confirmar({
    titulo: 'Salir',
    mensaje: 'Esto cierra tu sesión de acceso. Tus datos de estudio se conservan, pero deberás ingresar la clave de nuevo. ¿Continuar?',
    textoConfirmar: 'Salir',
    onConfirmar: () => {
      localStorage.removeItem(STORAGE_KEY_ACCESO);
      window.location.reload();
    }
  });
}

function abrirAcercaDe() {
  const etiqueta = obtenerEtiquetaSesion();
  const sesionInfo = etiqueta
    ? `<p style="margin-bottom: 0.7rem;"><strong>Sesión actual:</strong> ${etiqueta}</p>`
    : '';
  abrirModal({
    titulo: 'Acerca de Estudia USICAMM',
    cuerpo: `
      ${sesionInfo}
      <p style="margin-bottom: 0.7rem;"><strong>Versión:</strong> v2026.05 · 520 reactivos · Educación Inicial y Preescolar.</p>
      <p style="margin-bottom: 0.7rem;"><strong>Qué es:</strong> simulador de práctica para el examen de Admisión Docente USICAMM, ciclo 2026-2027.</p>
      <p style="margin-bottom: 0.7rem;"><strong>Qué NO es:</strong> No es oficial, no está respaldado por USICAMM ni SEP, no garantiza aprobación, no es una réplica del examen real.</p>
      <p style="margin-bottom: 0.7rem;"><strong>Privacidad:</strong> tus datos se guardan solo en tu navegador (localStorage). No hay servidor, no hay cuenta, no hay telemetría. Si limpias el navegador o usas otro dispositivo, empiezas de cero.</p>
      <p style="margin-bottom: 0.7rem;"><strong>Reportar errores:</strong> usa el botón ⚠️ en cada pregunta. Tus reportes se guardan localmente y puedes exportarlos desde el dashboard para enviarlos al autor.</p>
      <p style="margin-bottom: 0;"><strong>Bibliografía base:</strong> Plan 2022, Programa Sintético Fases 2 y 3, LGE, LGDNNA, Constitución, Acuerdos del DOF, fichero de cultura de paz SEP, manual "Eduquemos para la paz", Vygotsky-Bodrova-Leong, Meece, Díaz-Barriga, Monetti-Molina, OCDE, Montaño Sánchez.</p>
    `,
    acciones: [
      { texto: 'Cerrar', tipo: 'secundario' }
    ]
  });
}

function ocultarAppLoading() {
  const el = document.getElementById('app-loading');
  if (!el) return;
  el.classList.add('fade-out');
  setTimeout(() => el.remove(), 350);
}

function actualizarBotonAdmin() {
  const btn = document.getElementById('footer-admin');
  if (!btn) return;
  if (esAdmin()) {
    btn.classList.remove('oculto');
  } else {
    btn.classList.add('oculto');
  }
}

// ============================================
//   Panel de administración (solo Admin)
// ============================================
const STORAGE_KEY_ADMIN = 'usicamm_admin_db';

function esAdmin() {
  return obtenerEtiquetaSesion() === 'Admin';
}

function getAdminDB() {
  return leerLS(STORAGE_KEY_ADMIN, { usuarios: [], proximoNumero: 1 });
}

function setAdminDB(db) {
  escribirLS(STORAGE_KEY_ADMIN, db);
}

function abrirAdmin() {
  if (!esAdmin()) {
    toast('Acceso restringido. Solo el administrador puede entrar al panel.', 'error');
    return;
  }
  mostrarPantalla('pantalla-admin');
  adminTab('usuarios');
}

function cerrarAdmin() {
  volverInicio();
}

function adminTab(tab) {
  ['usuarios', 'agregar', 'config'].forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('activo', t === tab);
    document.getElementById('admin-tab-' + t)?.classList.toggle('oculto', t !== tab);
  });
  if (tab === 'usuarios') renderAdminUsuarios();
  if (tab === 'config') adminRefrescarExport();
  if (tab === 'agregar') {
    document.getElementById('admin-resultado-nuevo').classList.add('oculto');
    ['admin-nuevo-nombre', 'admin-nuevo-email', 'admin-nuevo-clave', 'admin-nuevo-notas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
}

function renderAdminUsuarios() {
  const div = document.getElementById('admin-usuarios-lista');
  const db = getAdminDB();
  const activos = db.usuarios.filter(u => u.activo);
  const revocados = db.usuarios.filter(u => !u.activo);

  if (db.usuarios.length === 0) {
    div.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-titulo">Sin usuarios todavía</div>
        <div class="empty-state-mensaje">Agrega tu primer usuario en la pestaña "Agregar". Aparecerá aquí con su etiqueta anónima.</div>
        <button class="empty-state-cta" onclick="adminTab('agregar')">Agregar usuario</button>
      </div>`;
    return;
  }

  let html = '';
  if (activos.length > 0) {
    html += `<h3>Activos (${activos.length})</h3><div class="admin-usuarios-grid">`;
    activos.forEach(u => {
      html += `
        <div class="admin-usuario admin-usuario-activo">
          <div class="admin-usuario-header">
            <div>
              <div class="admin-usuario-etiqueta">${escHTML(u.etiqueta)}</div>
              <div class="admin-usuario-nombre">${escHTML(u.nombre)}</div>
              ${u.email ? `<div class="admin-usuario-meta">${escHTML(u.email)}</div>` : ''}
            </div>
            <span class="admin-badge admin-badge-activo">Activo</span>
          </div>
          <div class="admin-usuario-clave">
            <span class="admin-clave-label">Clave:</span>
            <code class="admin-clave-valor" id="clave-${escHTML(u.etiqueta)}">••••••••</code>
            <button class="btn-min" onclick="adminToggleClave('${escHTML(u.etiqueta)}')">👁 Ver</button>
            <button class="btn-min" onclick="adminCopiarClave('${escHTML(u.etiqueta)}')">📋 Copiar</button>
          </div>
          ${u.notas ? `<div class="admin-usuario-notas">📝 ${escHTML(u.notas)}</div>` : ''}
          <div class="admin-usuario-acciones">
            <span class="admin-usuario-fecha">Creado ${new Date(u.creado).toLocaleDateString('es-MX')}</span>
            <button class="btn-min btn-peligro-min" onclick="adminRevocar('${escHTML(u.etiqueta)}')">Revocar</button>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  if (revocados.length > 0) {
    html += `<h3 style="margin-top:1.6rem">Revocados (${revocados.length})</h3><div class="admin-usuarios-grid">`;
    revocados.forEach(u => {
      html += `
        <div class="admin-usuario admin-usuario-revocado">
          <div class="admin-usuario-header">
            <div>
              <div class="admin-usuario-etiqueta">${escHTML(u.etiqueta)}</div>
              <div class="admin-usuario-nombre">${escHTML(u.nombre)}</div>
            </div>
            <span class="admin-badge admin-badge-revocado">Revocado</span>
          </div>
          <div class="admin-usuario-acciones">
            <span class="admin-usuario-fecha">Revocado ${u.revocado ? new Date(u.revocado).toLocaleDateString('es-MX') : ''}</span>
            <div>
              <button class="btn-min" onclick="adminReactivar('${escHTML(u.etiqueta)}')">Reactivar</button>
              <button class="btn-min btn-peligro-min" onclick="adminEliminar('${escHTML(u.etiqueta)}')">Eliminar</button>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  div.innerHTML = html;
}

async function adminGenerarUsuario() {
  const nombre = document.getElementById('admin-nuevo-nombre').value.trim();
  const email = document.getElementById('admin-nuevo-email').value.trim();
  let clave = document.getElementById('admin-nuevo-clave').value.trim();
  const notas = document.getElementById('admin-nuevo-notas').value.trim();

  if (!nombre) {
    toast('Escribe el nombre de la persona', 'warn');
    return;
  }

  const db = getAdminDB();
  if (!clave) {
    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    clave = (slug || 'user') + '-' + Math.random().toString(36).slice(2, 8);
  }

  // Verificar que la clave no exista ya
  const hash = await generarHash(clave);
  if (db.usuarios.some(u => u.hash === hash && u.activo)) {
    toast('Esa clave ya está en uso. Genera otra.', 'error');
    return;
  }

  const etiqueta = 'u_' + String(db.proximoNumero).padStart(3, '0');
  const usuario = {
    etiqueta,
    nombre,
    email,
    notas,
    clave,
    hash,
    creado: Date.now(),
    activo: true
  };
  db.usuarios.push(usuario);
  db.proximoNumero++;
  setAdminDB(db);

  // Mostrar resultado
  const resultado = document.getElementById('admin-resultado-nuevo');
  resultado.innerHTML = `
    <div class="admin-resultado-card">
      <h4>✓ Acceso generado para ${escHTML(nombre)}</h4>
      <div class="admin-resultado-fila">
        <span class="admin-resultado-label">Etiqueta:</span>
        <code>${escHTML(etiqueta)}</code>
      </div>
      <div class="admin-resultado-fila">
        <span class="admin-resultado-label">Clave para mandar a ${escHTML(nombre)}:</span>
        <code class="admin-clave-grande">${escHTML(clave)}</code>
        <button class="btn-min" onclick="adminCopiarTexto('${clave.replace(/'/g, "\\'")}')">📋 Copiar clave</button>
      </div>
      <div class="admin-resultado-pasos">
        <strong>Siguientes pasos:</strong>
        <ol>
          <li>Manda la clave a ${escHTML(nombre)} de forma privada (mensaje individual).</li>
          <li>Ve a la pestaña <strong>Exportar / Importar</strong> y copia el bloque <code>CLAVES_AUTORIZADAS</code>.</li>
          <li>Pega ese bloque en <code>app.js</code> reemplazando el actual.</li>
          <li>Haz <code>git push</code>. En 1-3 minutos la persona podrá entrar.</li>
        </ol>
      </div>
      <button onclick="adminTab('config')">📤 Ir a exportar →</button>
    </div>
  `;
  resultado.classList.remove('oculto');
  toast(`Usuario ${etiqueta} (${nombre}) generado`, 'success');
}

function adminToggleClave(etiqueta) {
  const db = getAdminDB();
  const u = db.usuarios.find(x => x.etiqueta === etiqueta);
  if (!u) return;
  const el = document.getElementById('clave-' + etiqueta);
  if (!el) return;
  if (el.textContent === '••••••••') {
    el.textContent = u.clave;
  } else {
    el.textContent = '••••••••';
  }
}

function adminCopiarClave(etiqueta) {
  const db = getAdminDB();
  const u = db.usuarios.find(x => x.etiqueta === etiqueta);
  if (!u) return;
  adminCopiarTexto(u.clave);
}

function adminCopiarTexto(texto) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => toast('Copiado al portapapeles', 'success'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Copiado al portapapeles', 'success');
  }
}

function adminRevocar(etiqueta) {
  const db = getAdminDB();
  const u = db.usuarios.find(x => x.etiqueta === etiqueta);
  if (!u) return;
  confirmar({
    titulo: `Revocar acceso de ${u.nombre}`,
    mensaje: `Esto marca a ${u.etiqueta} (${u.nombre}) como revocado. Tendrás que actualizar el código y hacer push para que el cambio surta efecto.`,
    textoConfirmar: 'Revocar',
    peligro: true,
    onConfirmar: () => {
      u.activo = false;
      u.revocado = Date.now();
      setAdminDB(db);
      renderAdminUsuarios();
      toast(`${u.etiqueta} marcado como revocado. No olvides actualizar el código.`, 'warn');
    }
  });
}

function adminReactivar(etiqueta) {
  const db = getAdminDB();
  const u = db.usuarios.find(x => x.etiqueta === etiqueta);
  if (!u) return;
  u.activo = true;
  delete u.revocado;
  setAdminDB(db);
  renderAdminUsuarios();
  toast(`${u.etiqueta} reactivado`, 'success');
}

function adminEliminar(etiqueta) {
  const db = getAdminDB();
  const u = db.usuarios.find(x => x.etiqueta === etiqueta);
  if (!u) return;
  confirmar({
    titulo: `Eliminar permanentemente`,
    mensaje: `Esto borra todos los datos de ${u.etiqueta} (${u.nombre}). No se podrá recuperar. Solo aplica a la base privada de tu navegador; en el código siguen apareciendo si no lo actualizas.`,
    textoConfirmar: 'Eliminar permanentemente',
    peligro: true,
    onConfirmar: () => {
      db.usuarios = db.usuarios.filter(x => x.etiqueta !== etiqueta);
      setAdminDB(db);
      renderAdminUsuarios();
      toast(`${u.etiqueta} eliminado`, 'info');
    }
  });
}

function adminRefrescarExport() {
  const db = getAdminDB();
  const ta = document.getElementById('admin-export');
  if (!ta) return;

  // El admin actual (el que está logueado) siempre se incluye
  const adminActual = leerLS(STORAGE_KEY_ACCESO, null);
  const lineas = [];
  if (adminActual && adminActual.hash) {
    lineas.push(`  '${adminActual.hash}': 'Admin',`);
  }

  // Solo usuarios activos
  db.usuarios.filter(u => u.activo).forEach(u => {
    lineas.push(`  '${u.hash}': '${u.etiqueta}',`);
  });

  ta.value = `const CLAVES_AUTORIZADAS = {\n${lineas.join('\n')}\n};`;
}

function adminCopiarExport() {
  const ta = document.getElementById('admin-export');
  if (!ta || !ta.value) return;
  adminCopiarTexto(ta.value);
}

function adminExportarBackup() {
  const db = getAdminDB();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usicamm-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup descargado. Guárdalo en sitio seguro.', 'success');
}

function adminImportarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const datos = JSON.parse(e.target.result);
      if (!datos || !Array.isArray(datos.usuarios)) {
        toast('Archivo inválido. No parece un backup de admin.', 'error');
        return;
      }
      confirmar({
        titulo: 'Importar backup',
        mensaje: `Esto reemplaza tu base privada actual con ${datos.usuarios.length} usuarios del archivo. ¿Continuar?`,
        textoConfirmar: 'Reemplazar',
        peligro: true,
        onConfirmar: () => {
          setAdminDB(datos);
          renderAdminUsuarios();
          adminRefrescarExport();
          toast('Backup importado correctamente', 'success');
        }
      });
    } catch (err) {
      toast('No se pudo leer el archivo: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';  // permite re-importar el mismo archivo
}

function adminBorrarTodo() {
  confirmar({
    titulo: 'Borrar toda la base privada',
    mensaje: 'Esto elimina permanentemente todos los datos de tu base privada (nombres, claves, etc.). Considera exportar un backup antes. Esta acción no afecta el código publicado en GitHub Pages.',
    textoConfirmar: 'Sí, borrar todo',
    peligro: true,
    onConfirmar: () => {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
      renderAdminUsuarios();
      adminRefrescarExport();
      toast('Base privada borrada', 'info');
    }
  });
}

// ============================================
//   Toasts (notificaciones efímeras)
// ============================================
function toast(mensaje, tipo) {
  tipo = tipo || 'info';  // info | success | error | warn
  const cont = document.getElementById('toast-container');
  if (!cont) return;
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  const iconos = { info: 'ℹ', success: '✓', error: '✕', warn: '!' };
  el.innerHTML = `<span class="toast-icon">${iconos[tipo] || ''}</span><span class="toast-msg">${mensaje}</span>`;
  cont.appendChild(el);
  // Forzar reflow para activar la transición
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 2800);
}

// ============================================
//   Modal genérico (confirmaciones, prompts)
// ============================================
function abrirModal({ titulo, cuerpo, acciones }) {
  document.getElementById('modal-titulo').textContent = titulo || '';
  document.getElementById('modal-body').innerHTML = cuerpo || '';
  document.getElementById('modal-acciones').innerHTML = '';
  (acciones || []).forEach(a => {
    const btn = document.createElement('button');
    btn.textContent = a.texto;
    if (a.tipo === 'secundario') btn.className = 'btn-secundario';
    else if (a.tipo === 'peligro') btn.className = 'btn-peligro';
    btn.onclick = () => {
      if (a.onClick) a.onClick();
      if (a.cerrar !== false) cerrarModal();
    };
    document.getElementById('modal-acciones').appendChild(btn);
  });
  document.getElementById('modal-backdrop').classList.remove('oculto');
}

function cerrarModal() {
  document.getElementById('modal-backdrop').classList.add('oculto');
}

// Cerrar modal con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = document.getElementById('modal-backdrop');
    if (m && !m.classList.contains('oculto')) cerrarModal();
  }
});

function confirmar(opciones) {
  // opciones: { titulo, mensaje, textoConfirmar, peligro, onConfirmar }
  return abrirModal({
    titulo: opciones.titulo || '¿Estás seguro?',
    cuerpo: `<p>${opciones.mensaje || ''}</p>`,
    acciones: [
      { texto: 'Cancelar', tipo: 'secundario' },
      {
        texto: opciones.textoConfirmar || 'Confirmar',
        tipo: opciones.peligro ? 'peligro' : null,
        onClick: opciones.onConfirmar
      }
    ]
  });
}

function pedirTexto(opciones) {
  // opciones: { titulo, etiqueta, placeholder, onAceptar(texto) }
  const inputId = 'modal-input-' + Date.now();
  abrirModal({
    titulo: opciones.titulo || 'Escribe',
    cuerpo: `
      <label class="modal-label" for="${inputId}">${opciones.etiqueta || ''}</label>
      <textarea id="${inputId}" class="modal-input" rows="3" placeholder="${opciones.placeholder || ''}"></textarea>
    `,
    acciones: [
      { texto: 'Cancelar', tipo: 'secundario' },
      {
        texto: opciones.textoAceptar || 'Guardar',
        onClick: () => {
          const txt = document.getElementById(inputId)?.value?.trim();
          if (txt && opciones.onAceptar) opciones.onAceptar(txt);
        }
      }
    ]
  });
  setTimeout(() => document.getElementById(inputId)?.focus(), 50);
}

// ============================================
//   Navegación entre pantallas
// ============================================
const PANTALLAS = ['pantalla-inicio', 'pantalla-config-examen', 'pantalla-playlists', 'pantalla-examen', 'pantalla-resultados', 'pantalla-dashboard', 'pantalla-glosario', 'pantalla-repaso', 'pantalla-flashcards', 'pantalla-admin'];

function mostrarPantalla(id) {
  // Si salimos del examen sin finalizar, detenemos el timer del simulacro
  const enExamen = !document.getElementById('pantalla-examen').classList.contains('oculto');
  if (enExamen && id !== 'pantalla-examen' && id !== 'pantalla-resultados') {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  PANTALLAS.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('oculto');
  });
  const target = document.getElementById(id);
  if (target) target.classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverInicio() {
  renderBienvenidaStat();
  verificarExamenGuardado();
  mostrarPantalla('pantalla-inicio');
}

// ============================================
//   Bienvenida y estadística rápida en home
// ============================================
function renderBienvenidaStat() {
  const div = document.getElementById('bienvenida-stat');
  if (!div) return;
  const tracking = getTracking();
  const vistas = Object.keys(tracking).filter(id => (tracking[id]?.vistas || 0) > 0).length;
  const total = todasPreguntas.length || 300;
  const pct = total ? Math.round(vistas / total * 100) : 0;
  if (vistas === 0) {
    div.innerHTML = `
      <div class="stat-bloque">
        <div class="stat-bloque-num">${total}</div>
        <div class="stat-bloque-label">reactivos en el banco</div>
      </div>`;
    return;
  }
  // Calcular promedio de aciertos
  let aciertosTot = 0, vistasTot = 0;
  Object.values(tracking).forEach(t => {
    aciertosTot += t.aciertos || 0;
    vistasTot += t.vistas || 0;
  });
  const promedio = vistasTot ? Math.round(aciertosTot / vistasTot * 100) : 0;
  div.innerHTML = `
    <div class="stat-bloque">
      <div class="stat-bloque-num">${vistas}/${total}</div>
      <div class="stat-bloque-label">reactivos vistos (${pct}%)</div>
    </div>
    <div class="stat-bloque">
      <div class="stat-bloque-num">${promedio}%</div>
      <div class="stat-bloque-label">tasa de aciertos</div>
    </div>`;
}

// ============================================
//   Pantalla de configuración del examen / flashcards
// ============================================
function abrirConfigExamen() {
  document.getElementById('config-examen-titulo').innerHTML = '🎯 Configurar examen';
  document.getElementById('config-intro').textContent = 'Selecciona modo, dimensión y categoría. Tu examen tendrá las preguntas que coincidan con los filtros.';
  // El botón principal es "Iniciar Examen"
  const acciones = document.querySelector('#pantalla-config-examen .acciones-inicio');
  if (acciones) {
    acciones.innerHTML = `
      <button id="btn-iniciar" onclick="iniciarExamen()">Iniciar Examen</button>
      <button class="btn-secundario" onclick="iniciarFlashcards()">🎴 Como flashcards</button>
      <button class="btn-secundario" onclick="guardarPlaylistActual()">💾 Guardar configuración</button>`;
  }
  renderFiltros();
  actualizarResumenSeleccion();
  mostrarPantalla('pantalla-config-examen');
}

function abrirConfigFlashcards() {
  document.getElementById('config-examen-titulo').innerHTML = '🎴 Configurar mazo de flashcards';
  document.getElementById('config-intro').textContent = 'Selecciona el subconjunto de preguntas que quieres repasar como flashcards. El modo (estudio/simulacro) y el tiempo no aplican aquí.';
  const acciones = document.querySelector('#pantalla-config-examen .acciones-inicio');
  if (acciones) {
    acciones.innerHTML = `
      <button id="btn-iniciar" onclick="iniciarFlashcards()">🎴 Empezar flashcards</button>
      <button class="btn-secundario" onclick="iniciarExamen()">📝 Como examen</button>
      <button class="btn-secundario" onclick="guardarPlaylistActual()">💾 Guardar configuración</button>`;
  }
  renderFiltros();
  actualizarResumenSeleccion();
  mostrarPantalla('pantalla-config-examen');
}

function cerrarConfigExamen() {
  volverInicio();
}

// ============================================
//   Pantalla de playlists
// ============================================
function abrirPlaylists() {
  renderPlaylists();
  mostrarPantalla('pantalla-playlists');
}

function cerrarPlaylists() {
  volverInicio();
}

// ============================================
//   Renderizado de filtros (pantalla inicio)
// ============================================
function renderFiltros() {
  renderModo();
  renderCantidad();
  renderDimensiones();
  renderTipos();
  renderCategorias();
  renderPonderado();
}

function renderModo() {
  const opciones = [
    { v: 'estudio', l: ETIQUETAS_MODO.estudio },
    { v: 'simulacro', l: ETIQUETAS_MODO.simulacro }
  ];
  document.getElementById('modo-examen').innerHTML = opciones.map(o =>
    `<label class="chip ${o.v === filtros.modo ? 'activo' : ''}">
      <input type="radio" name="modo" value="${o.v}" ${o.v === filtros.modo ? 'checked' : ''} onchange="setFiltro('modo', '${o.v}')">
      <span>${o.l}</span>
    </label>`).join('');
}

function renderCantidad() {
  const opciones = [10, 20, 50, 100, 'todas'];
  document.getElementById('cantidad-preguntas').innerHTML = opciones.map(v =>
    `<label class="chip ${v === filtros.cantidad ? 'activo' : ''}">
      <input type="radio" name="cantidad" value="${v}" ${v === filtros.cantidad ? 'checked' : ''} onchange="setFiltro('cantidad', '${v}')">
      <span>${v === 'todas' ? 'Todas' : v}</span>
    </label>`).join('');
}

function renderDimensiones() {
  const dims = [...new Set(todasPreguntas.map(q => q.dimension))].filter(Boolean).sort();
  document.getElementById('dimensiones').innerHTML = `<label class="chip ${filtros.dimension === 'todas' ? 'activo' : ''}">
    <input type="radio" name="dim" value="todas" onchange="setFiltro('dimension', 'todas')"><span>Todas (${todasPreguntas.length})</span>
  </label>` + dims.map(d => {
    const n = todasPreguntas.filter(q => q.dimension === d).length;
    return `<label class="chip ${filtros.dimension === d ? 'activo' : ''}">
      <input type="radio" name="dim" value="${d}" onchange="setFiltro('dimension', '${d}')"><span>${ETIQUETAS_DIMENSION[d] || d} (${n})</span>
    </label>`;
  }).join('');
}

function renderTipos() {
  const tipos = [...new Set(todasPreguntas.map(q => q.tipo))].filter(Boolean).sort();
  document.getElementById('tipos').innerHTML = `<label class="chip ${filtros.tipo === 'todos' ? 'activo' : ''}">
    <input type="radio" name="tipo" value="todos" onchange="setFiltro('tipo', 'todos')"><span>Todos</span>
  </label>` + tipos.map(t => {
    const n = todasPreguntas.filter(q => q.tipo === t).length;
    return `<label class="chip ${filtros.tipo === t ? 'activo' : ''}">
      <input type="radio" name="tipo" value="${t}" onchange="setFiltro('tipo', '${t}')"><span>${ETIQUETAS_TIPO[t] || t} (${n})</span>
    </label>`;
  }).join('');
}

function renderCategorias() {
  const subset = filtroBase();
  const cats = [...new Set(subset.map(q => q.categoria))].sort();
  document.getElementById('categorias').innerHTML = `<label class="cat-option ${filtros.categoria === 'todas' ? 'activo' : ''}">
    <input type="radio" name="cat" value="todas" onchange="setFiltro('categoria', 'todas')"><span>Todas (${subset.length})</span>
  </label>` + cats.map(c => {
    const n = subset.filter(q => q.categoria === c).length;
    return `<label class="cat-option ${filtros.categoria === c ? 'activo' : ''}">
      <input type="radio" name="cat" value="${c}" onchange="setFiltro('categoria', '${c.replace(/'/g, "\\'")}')"><span>${c} (${n})</span>
    </label>`;
  }).join('');
}

function renderPonderado() {
  const cont = document.getElementById('ponderado-toggle');
  if (!cont) return;
  cont.innerHTML = `<label class="chip ${filtros.ponderado ? 'activo' : ''}">
    <input type="checkbox" ${filtros.ponderado ? 'checked' : ''} onchange="setFiltro('ponderado', this.checked)">
    <span>🎯 Priorizar mis preguntas débiles (repetición espaciada)</span>
  </label>`;
}

function setFiltro(clave, valor) {
  if (clave === 'cantidad' && valor !== 'todas') valor = parseInt(valor, 10);
  if (clave === 'ponderado') valor = !!valor;
  filtros[clave] = valor;
  if (clave === 'dimension' || clave === 'tipo' || clave === 'busqueda') {
    const subset = filtroBase();
    const catsValidas = new Set(subset.map(q => q.categoria));
    if (filtros.categoria !== 'todas' && !catsValidas.has(filtros.categoria)) {
      filtros.categoria = 'todas';
    }
  }
  // Para búsqueda, no re-renderizamos el input para no perder el cursor
  if (clave === 'busqueda') {
    renderDimensiones();
    renderTipos();
    renderCategorias();
  } else {
    renderFiltros();
  }
  actualizarResumenSeleccion();
}

function filtroBase() {
  const q_busqueda = (filtros.busqueda || '').trim().toLowerCase();
  return todasPreguntas.filter(q => {
    if (filtros.dimension !== 'todas' && q.dimension !== filtros.dimension) return false;
    if (filtros.tipo !== 'todos' && q.tipo !== filtros.tipo) return false;
    if (q_busqueda) {
      const texto = (q.pregunta + ' ' + (q.caso || '') + ' ' + q.opciones.join(' ') + ' ' + (q.explicacion || '') + ' ' + (q.cita || '')).toLowerCase();
      if (!texto.includes(q_busqueda)) return false;
    }
    return true;
  });
}

function preguntasFiltradas() {
  return filtroBase().filter(q =>
    filtros.categoria === 'todas' || q.categoria === filtros.categoria
  );
}

function actualizarResumenSeleccion() {
  const subset = preguntasFiltradas();
  const cantidad = filtros.cantidad === 'todas' ? subset.length : Math.min(filtros.cantidad, subset.length);
  const el = document.getElementById('resumen-seleccion');
  const btn = document.getElementById('btn-iniciar');
  if (!el) return; // pantalla activa no tiene resumen (estamos fuera de config)
  if (cantidad === 0) {
    el.textContent = 'No hay preguntas con esta combinación. Ajusta los filtros.';
    el.className = 'resumen-seleccion vacio';
    if (btn) btn.disabled = true;
  } else {
    let txt = `Tu examen tendrá ${cantidad} pregunta${cantidad !== 1 ? 's' : ''} de ${subset.length} disponibles.`;
    if (filtros.modo === 'simulacro') {
      const segTotal = cantidad * SEGUNDOS_POR_PREGUNTA_SIMULACRO;
      const minTotal = Math.floor(segTotal / 60);
      const horas = Math.floor(minTotal / 60);
      const minRest = minTotal % 60;
      const tiempoStr = horas > 0 ? `${horas}h ${minRest}min` : `${minRest} minutos`;
      txt += ` Tiempo límite: ${tiempoStr} (≈2:24 por pregunta como el ADEB).`;
    }
    if (filtros.ponderado) {
      txt += ' Las preguntas que has fallado más aparecerán con mayor probabilidad.';
    }
    el.textContent = txt;
    el.className = 'resumen-seleccion';
    if (btn) btn.disabled = false;
  }
}

// ============================================
//   Historial
// ============================================
function renderHistorial() {
  const div = document.getElementById('historial');
  if (!div) return;
  const hist = leerLS(STORAGE_KEY_HISTORIAL, []);
  if (!hist.length) {
    div.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-titulo">Sin intentos registrados</div>
        <div class="empty-state-mensaje">Realiza tu primer examen y aquí verás el resumen de tus intentos recientes.</div>
      </div>`;
    return;
  }
  div.innerHTML = hist.slice(-5).reverse().map(h =>
    `<div class="hist-item"><span>${h.fecha}</span><span><strong>${h.correctas}/${h.total}</strong> (${h.porcentaje}%)</span><span>${h.descripcion || h.categoria || ''}</span><span>${h.tiempo}</span></div>`
  ).join('');
}

// ============================================
//   Resume del examen (pausa/continuación)
// ============================================
function verificarExamenGuardado() {
  const guardado = leerLS(STORAGE_KEY_EXAMEN, null);
  if (!guardado || !guardado.preguntas || !guardado.preguntas.length) return;
  const banner = document.getElementById('banner-resume');
  const detalle = document.getElementById('banner-detalle');
  const respondidas = guardado.respuestas.filter(r => r !== null).length;
  detalle.textContent = `${respondidas} de ${guardado.preguntas.length} preguntas respondidas — modo ${guardado.filtros.modo}`;
  banner.classList.remove('oculto');
}

function reanudarExamen() {
  const guardado = leerLS(STORAGE_KEY_EXAMEN, null);
  if (!guardado) return;
  preguntas = guardado.preguntas;
  respuestas = guardado.respuestas;
  marcadas = new Set(guardado.marcadas || []);
  actual = guardado.actual || 0;
  filtros = { ...filtros, ...guardado.filtros };
  tiempoInicio = guardado.tiempoInicio;
  tiempoLimite = guardado.tiempoLimite;
  mostrarPantalla('pantalla-examen');
  iniciarTimer();
  renderMapa();
  mostrarPregunta();
  document.getElementById('banner-resume').classList.add('oculto');
}

function descartarExamenGuardado() {
  confirmar({
    titulo: 'Descartar examen en curso',
    mensaje: '¿Estás seguro? Se perderá el progreso del examen en curso. Esta acción no se puede deshacer.',
    textoConfirmar: 'Sí, descartar',
    peligro: true,
    onConfirmar: () => {
      localStorage.removeItem(STORAGE_KEY_EXAMEN);
      document.getElementById('banner-resume').classList.add('oculto');
      toast('Examen descartado', 'info');
    }
  });
}

function guardarEstadoExamen() {
  if (!preguntas.length) return;
  escribirLS(STORAGE_KEY_EXAMEN, {
    preguntas, respuestas, actual, marcadas: [...marcadas],
    filtros, tiempoInicio, tiempoLimite,
    timestamp: Date.now()
  });
}

// ============================================
//   Iniciar examen
// ============================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Selección ponderada por debilidad: las preguntas con menor tasa de aciertos tienen más peso
function seleccionPonderada(pool, n) {
  const tracking = getTracking();
  const peso = q => {
    const t = tracking[q.id];
    if (!t || t.vistas === 0) return 1;  // pregunta nueva → peso normal
    const tasa = t.aciertos / t.vistas;
    return Math.max(0.5, 3 - 2 * tasa);   // tasa 0% → 3, tasa 100% → 1
  };
  const pesos = pool.map(peso);
  const elegidas = [];
  const disponibles = [...pool];
  const pesosArr = [...pesos];
  while (elegidas.length < n && disponibles.length > 0) {
    const total = pesosArr.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < disponibles.length; i++) {
      r -= pesosArr[i];
      if (r <= 0) {
        elegidas.push(disponibles[i]);
        disponibles.splice(i, 1);
        pesosArr.splice(i, 1);
        break;
      }
    }
  }
  return elegidas;
}

function iniciarExamen(soloErrores) {
  if (!soloErrores) {
    let pool = preguntasFiltradas();
    const n = filtros.cantidad === 'todas' ? pool.length : Math.min(filtros.cantidad, pool.length);
    if (filtros.ponderado) {
      preguntas = seleccionPonderada(pool, n);
    } else {
      shuffle(pool);
      preguntas = pool.slice(0, n);
    }
    shuffle(preguntas);
  }
  preguntas.forEach(p => {
    const indices = p.opciones.map((_, i) => i);
    shuffle(indices);
    p._opciones = indices.map(i => p.opciones[i]);
    p._respuesta = indices.indexOf(p.respuesta);
  });
  respuestas = new Array(preguntas.length).fill(null);
  marcadas = new Set();
  actual = 0;
  tiempoInicio = Date.now();
  tiempoLimite = (filtros.modo === 'simulacro') ? preguntas.length * SEGUNDOS_POR_PREGUNTA_SIMULACRO : 0;
  mostrarPantalla('pantalla-examen');
  document.getElementById('banner-resume').classList.add('oculto');
  iniciarTimer();
  renderMapa();
  mostrarPregunta();
  guardarEstadoExamen();
}

// ============================================
//   Timer
// ============================================
function iniciarTimer() {
  clearInterval(timerInterval);
  actualizarTimer();
  timerInterval = setInterval(actualizarTimer, 1000);
}

function actualizarTimer() {
  const seg = Math.floor((Date.now() - tiempoInicio) / 1000);
  const timerEl = document.getElementById('timer');
  if (tiempoLimite > 0) {
    const restante = Math.max(0, tiempoLimite - seg);
    const min = Math.floor(restante / 60);
    const s = restante % 60;
    timerEl.textContent = `⏱️ ${min}:${s.toString().padStart(2, '0')}`;
    timerEl.classList.toggle('timer-alerta', restante <= 60);
    timerEl.classList.toggle('timer-aviso', restante <= 300 && restante > 60);
    if (restante === 0) {
      clearInterval(timerInterval);
      toast('Tiempo agotado. Finalizando examen…', 'warn');
      setTimeout(() => finalizar(), 1500);
    }
  } else {
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    timerEl.textContent = `${min}:${s.toString().padStart(2, '0')}`;
    timerEl.classList.remove('timer-alerta', 'timer-aviso');
  }
}

function tiempoFormateado() {
  const seg = Math.floor((Date.now() - tiempoInicio) / 1000);
  const min = Math.floor(seg / 60);
  const s = seg % 60;
  return `${min}:${s.toString().padStart(2, '0')}`;
}

// ============================================
//   Multireactivos: agrupación por caso
// ============================================
function preguntasMismoCaso(idx) {
  const p = preguntas[idx];
  if (!p.caso) return [idx];
  return preguntas
    .map((q, i) => (q.caso === p.caso ? i : -1))
    .filter(i => i !== -1);
}

// ============================================
//   Mapa de preguntas (navegación rápida)
// ============================================
function renderMapa() {
  const mapa = document.getElementById('mapa-preguntas');
  mapa.innerHTML = preguntas.map((_, i) => {
    let cls = 'mapa-btn';
    if (respuestas[i] !== null) cls += ' contestada';
    if (marcadas.has(i)) cls += ' dudosa';
    if (i === actual) cls += ' activa';
    return `<button class="${cls}" onclick="irA(${i})">${i + 1}</button>`;
  }).join('');
}

function irA(i) { actual = i; mostrarPregunta(); guardarEstadoExamen(); }

// ============================================
//   Mostrar pregunta + soporte multireactivo
// ============================================
function mostrarPregunta() {
  const p = preguntas[actual];
  document.getElementById('contador').textContent = `Pregunta ${actual + 1} de ${preguntas.length}`;
  document.getElementById('barra-fill').style.width = `${((actual + 1) / preguntas.length) * 100}%`;

  const casoEl = document.getElementById('caso-texto');
  // Multireactivo: si la pregunta anterior tiene el mismo caso, no repetimos el caso
  const grupoIdx = preguntasMismoCaso(actual);
  const esPrimeraDelGrupo = grupoIdx[0] === actual;
  if (p.caso) {
    if (grupoIdx.length > 1) {
      const pos = grupoIdx.indexOf(actual) + 1;
      casoEl.innerHTML = `<div class="multi-tag">Multireactivo · ${pos}/${grupoIdx.length}</div>${p.caso}`;
    } else {
      casoEl.textContent = p.caso;
    }
    casoEl.style.display = '';
  } else {
    casoEl.style.display = 'none';
    casoEl.textContent = '';
  }

  document.getElementById('pregunta-texto').textContent = p.pregunta;

  // Botón marcar dudosa
  const btnMarcar = document.getElementById('btn-marcar');
  const estaMarcada = marcadas.has(actual);
  document.getElementById('btn-marcar-icon').textContent = estaMarcada ? '🚩' : '🏳️';
  document.getElementById('btn-marcar-texto').textContent = estaMarcada ? 'Dudosa marcada' : 'Marcar dudosa';
  btnMarcar.classList.toggle('marcado', estaMarcada);

  // Notas personales
  const notas = getNotas();
  const ta = document.getElementById('notas-textarea');
  ta.value = notas[p.id] || '';
  ta.oninput = () => {
    setNota(p.id, ta.value);
    document.getElementById('notas-status').textContent = '✓ Nota guardada';
    setTimeout(() => { document.getElementById('notas-status').textContent = ''; }, 1500);
  };

  // Opciones
  const opcionesDiv = document.getElementById('opciones');
  opcionesDiv.innerHTML = '';
  // Si todas las opciones son cortas (como en ordenamiento), aplicar layout compacto
  const promLong = p._opciones.reduce((a, o) => a + o.length, 0) / p._opciones.length;
  opcionesDiv.classList.toggle('opciones-cortas', promLong < 25);
  const yaContestada = respuestas[actual] !== null;
  p._opciones.forEach((texto, i) => {
    const btn = document.createElement('button');
    let cls = 'opcion';
    if (respuestas[actual] === i) cls += ' seleccionada';
    if (filtros.modo === 'estudio' && yaContestada) {
      if (i === p._respuesta) cls += ' correcta-revelada';
      if (respuestas[actual] === i && i !== p._respuesta) cls += ' incorrecta-revelada';
      btn.disabled = true;
    }
    btn.className = cls;
    btn.textContent = `${String.fromCharCode(65 + i)}) ${texto}`;
    btn.onclick = () => seleccionar(i);
    opcionesDiv.appendChild(btn);
  });

  // Feedback inmediato (modo estudio)
  const fbEl = document.getElementById('feedback-estudio');
  if (filtros.modo === 'estudio' && yaContestada) {
    const esCorrecta = respuestas[actual] === p._respuesta;
    fbEl.classList.remove('oculto');
    fbEl.className = `feedback-estudio ${esCorrecta ? 'fb-correcta' : 'fb-incorrecta'}`;
    fbEl.innerHTML = `
      <div class="fb-titulo">${esCorrecta ? '✓ ¡Correcto!' : '✗ Incorrecto'}</div>
      ${!esCorrecta ? `<p class="fb-respuesta">Respuesta correcta: <strong>${String.fromCharCode(65 + p._respuesta)}) ${p._opciones[p._respuesta]}</strong></p>` : ''}
      <div class="fb-explicacion"><strong>Explicación:</strong> ${p.explicacion}</div>
      ${p.cita ? `<div class="cita-fuente"><strong>Fuente:</strong> ${p.cita}</div>` : ''}
    `;
  } else {
    fbEl.classList.add('oculto');
    fbEl.innerHTML = '';
  }

  document.getElementById('btn-anterior').classList.toggle('oculto', actual === 0);
  document.getElementById('btn-siguiente').classList.toggle('oculto', actual === preguntas.length - 1);
  document.getElementById('btn-finalizar').classList.toggle('oculto', actual !== preguntas.length - 1);
  renderMapa();
}

function seleccionar(i) {
  if (filtros.modo === 'estudio' && respuestas[actual] !== null) return;
  respuestas[actual] = i;
  if (filtros.modo === 'estudio') mostrarPregunta();
  else {
    document.querySelectorAll('.opcion').forEach((btn, idx) => btn.classList.toggle('seleccionada', idx === i));
  }
  renderMapa();
  guardarEstadoExamen();
}

function siguiente() { if (actual < preguntas.length - 1) { actual++; mostrarPregunta(); guardarEstadoExamen(); } }
function anterior() { if (actual > 0) { actual--; mostrarPregunta(); guardarEstadoExamen(); } }

// ============================================
//   Marcar / Reportar
// ============================================
function toggleMarcada() {
  if (marcadas.has(actual)) marcadas.delete(actual);
  else marcadas.add(actual);
  mostrarPregunta();
  guardarEstadoExamen();
}

function reportarPregunta() {
  const p = preguntas[actual];
  if (!p) return;
  pedirTexto({
    titulo: `Reportar pregunta #${p.id}`,
    etiqueta: '¿Qué problema tiene? (ambigua, respuesta incorrecta, distractor mal formulado, etc.)',
    placeholder: 'Describe el problema…',
    textoAceptar: 'Reportar',
    onAceptar: (motivo) => {
      addReportada(p.id, motivo);
      toast('Reporte registrado. Gracias.', 'success');
    }
  });
}

// ============================================
//   Atajos de teclado
// ============================================
function configurarAtajosTeclado() {
  if (window.__atajosConfigurados) return;  // Evitar registrar listeners duplicados
  window.__atajosConfigurados = true;
  document.addEventListener('keydown', e => {
    // Evitar interferir con inputs/textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    const enExamen = !document.getElementById('pantalla-examen').classList.contains('oculto');
    const enFlashcards = !document.getElementById('pantalla-flashcards').classList.contains('oculto');

    // Atajos para flashcards
    if (enFlashcards) {
      const fin = flashcardsState.idx >= flashcardsState.mazo.length;
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrarFlashcards();
        return;
      }
      if (fin) return;
      if (!flashcardsState.volteada) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          voltearFlashcard();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          anteriorFlashcard();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
          e.preventDefault();
          siguienteFlashcard('saltada');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleMarcadaFlashcard();
        }
      } else {
        // Volteada
        if (e.key === 'ArrowRight' || e.key === '2') {
          e.preventDefault();
          siguienteFlashcard('sabia');
        } else if (e.key === 'ArrowLeft' || e.key === '1') {
          e.preventDefault();
          siguienteFlashcard('no_sabia');
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          // Default: la sabía si presiona espacio/enter después de voltear
          siguienteFlashcard('sabia');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleMarcadaFlashcard();
        }
      }
      return;
    }

    if (!enExamen) return;
    const p = preguntas[actual];
    if (!p) return;
    const yaContestada = respuestas[actual] !== null;

    if (e.key === '1' || e.key === 'a' || e.key === 'A') {
      if (!(filtros.modo === 'estudio' && yaContestada)) seleccionar(0);
    } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
      if (p._opciones.length > 1 && !(filtros.modo === 'estudio' && yaContestada)) seleccionar(1);
    } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
      if (p._opciones.length > 2 && !(filtros.modo === 'estudio' && yaContestada)) seleccionar(2);
    } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (actual < preguntas.length - 1) siguiente();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      anterior();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMarcada();
    }
  });
}

// ============================================
//   Finalización del examen
// ============================================
function finalizar() {
  clearInterval(timerInterval);
  const tiempo = tiempoFormateado();
  const segTotal = Math.floor((Date.now() - tiempoInicio) / 1000);

  mostrarPantalla('pantalla-resultados');

  let correctas = 0;
  const statsCat = {};
  const statsDim = {};

  preguntas.forEach((p, i) => {
    const esCorrecta = respuestas[i] === p._respuesta;
    if (esCorrecta) correctas++;
    actualizarTracking(p.id, esCorrecta);
    if (!statsCat[p.categoria]) statsCat[p.categoria] = { ok: 0, total: 0 };
    statsCat[p.categoria].total++;
    if (esCorrecta) statsCat[p.categoria].ok++;
    const d = p.dimension || 'sin_dimension';
    if (!statsDim[d]) statsDim[d] = { ok: 0, total: 0 };
    statsDim[d].total++;
    if (esCorrecta) statsDim[d].ok++;
  });

  const porcentaje = Math.round(correctas / preguntas.length * 100);
  const promPorPregunta = (segTotal / preguntas.length).toFixed(1);
  document.getElementById('score').textContent = `${correctas} / ${preguntas.length} (${porcentaje}%)`;
  document.getElementById('stats-tiempo').textContent = `Tiempo total: ${tiempo} · Promedio por pregunta: ${promPorPregunta}s`;

  renderStatsDimensiones(statsDim);
  renderStatsCategorias(statsCat);
  renderFiltrosRevision();
  filtroRevision = 'todas';
  renderRevision();

  const errores = preguntas.filter((_, i) => respuestas[i] !== preguntas[i]._respuesta);
  document.getElementById('btn-repaso').classList.toggle('oculto', errores.length === 0);

  const hist = leerLS(STORAGE_KEY_HISTORIAL, []);
  hist.push({
    fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    correctas, total: preguntas.length, porcentaje, tiempo,
    descripcion: descripcionConfiguracion(),
    modo: filtros.modo,
    fechaIso: new Date().toISOString()
  });
  escribirLS(STORAGE_KEY_HISTORIAL, hist.slice(-50));

  // Limpiar examen guardado (ya completado)
  localStorage.removeItem(STORAGE_KEY_EXAMEN);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function descripcionConfiguracion() {
  const partes = [];
  if (filtros.categoria !== 'todas') partes.push(filtros.categoria);
  else if (filtros.dimension !== 'todas') partes.push(ETIQUETAS_DIMENSION[filtros.dimension]);
  else partes.push('Todas');
  if (filtros.tipo !== 'todos') partes.push(ETIQUETAS_TIPO[filtros.tipo]);
  return partes.join(' · ');
}

// ============================================
//   Stats por categoría (al final del examen)
// ============================================
function renderStatsCategorias(stats) {
  const div = document.getElementById('stats-categorias');
  const entradas = Object.entries(stats)
    .map(([cat, v]) => ({ cat, ok: v.ok, total: v.total, pct: Math.round(v.ok / v.total * 100) }))
    .sort((a, b) => a.pct - b.pct);
  if (entradas.length <= 1) { div.innerHTML = ''; return; }
  div.innerHTML = `
    <h3 class="stats-titulo">Rendimiento por categoría</h3>
    <div class="stats-grid">
      ${entradas.map(e => `
        <div class="stat-row">
          <div class="stat-cat">${e.cat}</div>
          <div class="stat-barra-wrap"><div class="stat-barra" style="width:${e.pct}%; background:${colorPct(e.pct)}"></div></div>
          <div class="stat-num">${e.ok}/${e.total} (${e.pct}%)</div>
        </div>`).join('')}
    </div>`;
}

function colorPct(pct) {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

// ============================================
//   Stats por dimensión (al final del examen)
// ============================================
function renderStatsDimensiones(stats) {
  const div = document.getElementById('stats-dimensiones');
  const entradas = Object.entries(stats)
    .map(([dim, v]) => ({
      dim: ETIQUETAS_DIMENSION[dim] || dim,
      ok: v.ok,
      total: v.total,
      pct: Math.round(v.ok / v.total * 100)
    }))
    .sort((a, b) => a.pct - b.pct);
  if (entradas.length <= 1) { div.innerHTML = ''; return; }
  const debil = entradas[0];
  const fuerte = entradas[entradas.length - 1];
  let alerta = '';
  if (debil.pct < 60 && debil.pct < fuerte.pct - 15) {
    alerta = `<div class="stats-alerta">📌 Área a reforzar: <strong>${debil.dim}</strong> (${debil.pct}%). Tu fortaleza está en ${fuerte.dim} (${fuerte.pct}%).</div>`;
  }
  div.innerHTML = `
    <h3 class="stats-titulo">Rendimiento por dimensión del perfil docente</h3>
    ${alerta}
    <div class="stats-grid">
      ${entradas.map(e => `
        <div class="stat-row">
          <div class="stat-cat">${e.dim}</div>
          <div class="stat-barra-wrap"><div class="stat-barra" style="width:${e.pct}%; background:${colorPct(e.pct)}"></div></div>
          <div class="stat-num">${e.ok}/${e.total} (${e.pct}%)</div>
        </div>`).join('')}
    </div>`;
}

// ============================================
//   Glosario
// ============================================
async function cargarGlosario() {
  if (glosario) return glosario;
  try {
    const res = await fetch('glosario.json');
    glosario = await res.json();
  } catch (e) {
    glosario = {};
  }
  return glosario;
}

async function abrirGlosario() {
  await cargarGlosario();
  mostrarPantalla('pantalla-glosario');
  document.getElementById('glosario-busqueda').value = '';
  renderGlosario('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarGlosario() {
  volverInicio();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderGlosario(filtro) {
  filtro = (filtro || '').trim().toLowerCase();
  const div = document.getElementById('glosario-content');
  if (!glosario) { div.innerHTML = '<p class="vacio">Cargando…</p>'; return; }
  let html = '';
  let total = 0;
  for (const [seccion, items] of Object.entries(glosario)) {
    const visibles = items.filter(it =>
      !filtro ||
      it.sigla.toLowerCase().includes(filtro) ||
      it.termino.toLowerCase().includes(filtro) ||
      it.definicion.toLowerCase().includes(filtro)
    );
    if (visibles.length === 0) continue;
    total += visibles.length;
    html += `<h3 class="glosario-seccion">${seccion}</h3>`;
    html += visibles.map(it => `
      <div class="glosario-item">
        <div class="glosario-sigla">${it.sigla}</div>
        <div class="glosario-cuerpo">
          <div class="glosario-termino">${it.termino}</div>
          <div class="glosario-def">${it.definicion}</div>
        </div>
      </div>
    `).join('');
  }
  if (total === 0) {
    html = `<p class="vacio">Sin resultados para "${filtro}"</p>`;
  }
  div.innerHTML = html;
}

// ============================================
//   Repaso por tema (resúmenes por categoría)
// ============================================
async function cargarResumenes() {
  if (resumenes) return resumenes;
  try {
    const res = await fetch('resumenes.json');
    resumenes = await res.json();
  } catch (e) {
    resumenes = {};
  }
  return resumenes;
}

async function abrirRepaso() {
  await cargarResumenes();
  mostrarPantalla('pantalla-repaso');
  document.getElementById('repaso-busqueda').value = '';
  renderRepaso('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarRepaso() {
  volverInicio();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRepaso(filtro) {
  filtro = (filtro || '').trim().toLowerCase();
  const div = document.getElementById('repaso-content');
  if (!resumenes) { div.innerHTML = '<p class="vacio">Cargando…</p>'; return; }
  const entradas = Object.entries(resumenes);
  const visibles = entradas.filter(([cat, r]) => {
    if (!filtro) return true;
    const blob = (cat + ' ' + r.titulo + ' ' + r.que_es + ' ' + r.ideas_clave.join(' ') + ' ' + (r.no_es || '') + ' ' + (r.errores_comunes || '')).toLowerCase();
    return blob.includes(filtro);
  });
  if (visibles.length === 0) {
    div.innerHTML = `<p class="vacio">Sin resultados para "${filtro}"</p>`;
    return;
  }
  div.innerHTML = visibles.map(([cat, r]) => {
    const cuenta = todasPreguntas.filter(q => q.categoria === cat).length;
    return `
      <details class="repaso-item">
        <summary class="repaso-titulo">
          <span>${r.titulo}</span>
          <span class="repaso-cuenta">${cuenta} reactivos</span>
        </summary>
        <div class="repaso-cuerpo">
          <div class="repaso-bloque">
            <div class="repaso-label">¿Qué es?</div>
            <div>${r.que_es}</div>
          </div>
          <div class="repaso-bloque">
            <div class="repaso-label">Ideas clave</div>
            <ul>${r.ideas_clave.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
          ${r.no_es ? `<div class="repaso-bloque">
            <div class="repaso-label">No es / no significa</div>
            <div>${r.no_es}</div>
          </div>` : ''}
          ${r.errores_comunes ? `<div class="repaso-bloque">
            <div class="repaso-label">Errores comunes</div>
            <div>${r.errores_comunes}</div>
          </div>` : ''}
          <button class="btn-secundario" onclick="estudiarCategoria('${cat.replace(/'/g,"\\'")}')">📝 Practicar reactivos de este tema</button>
        </div>
      </details>
    `;
  }).join('');
}

function estudiarCategoria(cat) {
  filtros.categoria = cat;
  filtros.dimension = 'todas';
  filtros.tipo = 'todos';
  filtros.busqueda = '';
  filtros.modo = 'estudio';
  abrirConfigExamen();
  // Después de abrirConfigExamen, los filtros ya quedaron aplicados
  const btn = document.getElementById('btn-iniciar');
  if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
//   Flashcards
// ============================================
function iniciarFlashcards() {
  const subset = preguntasFiltradas();
  if (subset.length === 0) {
    toast('No hay preguntas con esta combinación. Ajusta los filtros.', 'warn');
    return;
  }
  let mazo;
  const cantidad = filtros.cantidad === 'todas' ? subset.length : Math.min(filtros.cantidad, subset.length);
  if (filtros.ponderado) {
    mazo = seleccionPonderada(subset, cantidad);
  } else {
    mazo = shuffle([...subset]).slice(0, cantidad);
  }
  flashcardsState = {
    mazo,
    idx: 0,
    volteada: false,
    resultados: {},
    totalOriginal: mazo.length,
    reinsertadas: new Set()
  };
  mostrarPantalla('pantalla-flashcards');
  renderFlashcard();
}

function cerrarFlashcards() {
  volverInicio();
}

function flashcardsStats() {
  const r = flashcardsState.resultados;
  let sabia = 0, noSabia = 0, saltada = 0;
  Object.values(r).forEach(v => {
    if (v === 'sabia') sabia++;
    else if (v === 'no_sabia') noSabia++;
    else if (v === 'saltada') saltada++;
  });
  return { sabia, noSabia, saltada, vistas: sabia + noSabia + saltada };
}

function renderFlashcard() {
  const { mazo, idx, volteada } = flashcardsState;
  const stats = flashcardsStats();

  if (idx >= mazo.length) {
    renderFlashcardFin();
    return;
  }

  const q = mazo[idx];
  const total = mazo.length;
  const visibleNum = idx + 1;
  const pct = Math.round((visibleNum / total) * 100);

  // Header con stats
  document.getElementById('flashcard-progreso').innerHTML = `
    <div class="fc-header">
      <div class="fc-header-info">
        <span class="fc-card-num">Tarjeta ${visibleNum} de ${total}</span>
        <span class="fc-cat">${q.categoria}</span>
      </div>
      <div class="fc-header-stats">
        <span class="fc-stat-ok">✅ ${stats.sabia}</span>
        <span class="fc-stat-fail">❌ ${stats.noSabia}</span>
        ${stats.saltada > 0 ? `<span class="fc-stat-skip">⏭ ${stats.saltada}</span>` : ''}
      </div>
    </div>
    <div class="fc-progreso-barra"><div class="fc-progreso-fill" style="width:${pct}%"></div></div>
  `;

  const correcta = q.opciones[q.respuesta];
  const marcadas = leerLS('usicamm_marcadas_fc', []);
  const estaMarcada = marcadas.includes(q.id);

  if (!volteada) {
    document.getElementById('flashcard-actual').innerHTML = `
      <div class="flashcard frente">
        <div class="fc-toolbar">
          <button class="fc-toolbar-btn" onclick="leerFlashcard()" title="Leer en voz alta">🔊</button>
          <button class="fc-toolbar-btn ${estaMarcada ? 'activo' : ''}" onclick="toggleMarcadaFlashcard()" title="Marcar para repaso">${estaMarcada ? '🚩' : '🏳️'}</button>
          <button class="fc-toolbar-btn" onclick="reportarFlashcard()" title="Reportar pregunta">⚠️</button>
        </div>
        ${q.caso ? `<div class="flashcard-caso">${q.caso}</div>` : ''}
        <div class="flashcard-pregunta">${q.pregunta}</div>
        <div class="flashcard-pista">Piensa tu respuesta y luego voltea la tarjeta.<br><span class="fc-atajo-tip">Espacio: voltear · ←: anterior · S: saltar · Esc: salir</span></div>
      </div>`;
    document.getElementById('flashcard-acciones').innerHTML = `
      ${idx > 0 ? `<button class="btn-secundario" onclick="anteriorFlashcard()">← Anterior</button>` : ''}
      <button onclick="voltearFlashcard()">🔄 Voltear tarjeta</button>
      <button class="btn-secundario" onclick="siguienteFlashcard('saltada')">Saltar ⏭</button>`;
  } else {
    document.getElementById('flashcard-actual').innerHTML = `
      <div class="flashcard reverso">
        <div class="fc-toolbar">
          <button class="fc-toolbar-btn" onclick="leerFlashcard()" title="Leer en voz alta">🔊</button>
          <button class="fc-toolbar-btn ${estaMarcada ? 'activo' : ''}" onclick="toggleMarcadaFlashcard()" title="Marcar para repaso">${estaMarcada ? '🚩' : '🏳️'}</button>
          <button class="fc-toolbar-btn" onclick="reportarFlashcard()" title="Reportar pregunta">⚠️</button>
        </div>
        ${q.caso ? `<div class="flashcard-caso">${q.caso}</div>` : ''}
        <div class="flashcard-pregunta">${q.pregunta}</div>
        <div class="flashcard-respuesta">
          <div class="flashcard-label">Respuesta correcta</div>
          <div class="flashcard-correcta">${correcta}</div>
        </div>
        ${q.explicacion ? `<div class="flashcard-explicacion"><strong>Por qué:</strong> ${q.explicacion}</div>` : ''}
        ${q.cita ? `<div class="flashcard-cita">📚 ${q.cita}</div>` : ''}
        <div class="fc-atajo-tip-rev">←: no la sabía · →: la sabía</div>
      </div>`;
    document.getElementById('flashcard-acciones').innerHTML = `
      <button class="btn-flash-fail" onclick="siguienteFlashcard('no_sabia')">❌ No la sabía</button>
      <button class="btn-flash-ok" onclick="siguienteFlashcard('sabia')">✅ La sabía</button>`;
  }
}

function renderFlashcardFin() {
  const stats = flashcardsStats();
  const total = flashcardsState.totalOriginal;
  const pctSabia = total > 0 ? Math.round((stats.sabia / total) * 100) : 0;
  const errores = Object.entries(flashcardsState.resultados)
    .filter(([_, v]) => v === 'no_sabia')
    .map(([id]) => parseInt(id));

  document.getElementById('flashcard-progreso').innerHTML = '';
  document.getElementById('flashcard-actual').innerHTML = `
    <div class="flashcard-fin">
      <h3>¡Mazo completo!</h3>
      <p class="fc-fin-resumen">
        Repasaste <strong>${total}</strong> tarjetas
      </p>
      <div class="fc-fin-stats">
        <div class="fc-fin-stat fc-fin-ok">
          <div class="fc-fin-num">${stats.sabia}</div>
          <div class="fc-fin-label">Sabidas</div>
        </div>
        <div class="fc-fin-stat fc-fin-fail">
          <div class="fc-fin-num">${stats.noSabia}</div>
          <div class="fc-fin-label">No sabidas</div>
        </div>
        ${stats.saltada > 0 ? `<div class="fc-fin-stat fc-fin-skip">
          <div class="fc-fin-num">${stats.saltada}</div>
          <div class="fc-fin-label">Saltadas</div>
        </div>` : ''}
      </div>
      <div class="fc-fin-pct">${pctSabia}% de aciertos</div>
    </div>`;

  let acciones = '';
  if (errores.length > 0) {
    acciones += `<button class="btn-flash-fail" onclick="repasarErroresFlashcards()">🔁 Repasar las ${errores.length} que no supe</button>`;
  }
  acciones += `<button onclick="iniciarFlashcards()">🎴 Nuevo mazo</button>`;
  acciones += `<button class="btn-secundario" onclick="cerrarFlashcards()">← Volver al inicio</button>`;
  document.getElementById('flashcard-acciones').innerHTML = acciones;
}

function repasarErroresFlashcards() {
  const errores = Object.entries(flashcardsState.resultados)
    .filter(([_, v]) => v === 'no_sabia')
    .map(([id]) => parseInt(id));
  if (errores.length === 0) return;
  const erroresMazo = todasPreguntas.filter(q => errores.includes(q.id));
  flashcardsState = {
    mazo: shuffle(erroresMazo),
    idx: 0,
    volteada: false,
    resultados: {},
    totalOriginal: erroresMazo.length,
    reinsertadas: new Set()
  };
  renderFlashcard();
}

function voltearFlashcard() {
  if (!flashcardsState.mazo[flashcardsState.idx]) return;
  flashcardsState.volteada = true;
  renderFlashcard();
}

function siguienteFlashcard(resultado) {
  const q = flashcardsState.mazo[flashcardsState.idx];
  if (!q) return;
  // Registrar resultado (sabia | no_sabia | saltada)
  if (resultado) {
    flashcardsState.resultados[q.id] = resultado;
    // Tracking solo si es sabía/no sabía (saltadas no cuentan)
    if (resultado === 'sabia' || resultado === 'no_sabia') {
      actualizarTracking(q.id, resultado === 'sabia');
    }
    // Repetición intra-sesión: si dijo "no_sabia", reinsertar más adelante en el mazo
    if (resultado === 'no_sabia' && !flashcardsState.reinsertadas.has(q.id)) {
      const posReinsert = Math.min(
        flashcardsState.idx + 4 + Math.floor(Math.random() * 3),
        flashcardsState.mazo.length
      );
      flashcardsState.mazo.splice(posReinsert, 0, q);
      flashcardsState.reinsertadas.add(q.id);
    }
  }
  flashcardsState.idx++;
  flashcardsState.volteada = false;
  renderFlashcard();
}

function anteriorFlashcard() {
  if (flashcardsState.idx === 0) return;
  flashcardsState.idx--;
  flashcardsState.volteada = false;
  // Si volvemos a una tarjeta, removemos su resultado previo y su reinserción
  const q = flashcardsState.mazo[flashcardsState.idx];
  if (q) {
    delete flashcardsState.resultados[q.id];
    if (flashcardsState.reinsertadas.has(q.id)) {
      // Buscar y eliminar la reinserción posterior
      for (let i = flashcardsState.idx + 1; i < flashcardsState.mazo.length; i++) {
        if (flashcardsState.mazo[i].id === q.id) {
          flashcardsState.mazo.splice(i, 1);
          break;
        }
      }
      flashcardsState.reinsertadas.delete(q.id);
    }
  }
  renderFlashcard();
}

function leerFlashcard() {
  const q = flashcardsState.mazo[flashcardsState.idx];
  if (!q) return;
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    let texto = '';
    if (q.caso) texto += q.caso + '. ';
    texto += q.pregunta;
    if (flashcardsState.volteada) {
      texto += '. Respuesta correcta: ' + q.opciones[q.respuesta];
      if (q.explicacion) texto += '. ' + q.explicacion;
    }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX';
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }
}

function toggleMarcadaFlashcard() {
  const q = flashcardsState.mazo[flashcardsState.idx];
  if (!q) return;
  const marcadas = leerLS('usicamm_marcadas_fc', []);
  const idx = marcadas.indexOf(q.id);
  if (idx >= 0) marcadas.splice(idx, 1);
  else marcadas.push(q.id);
  escribirLS('usicamm_marcadas_fc', marcadas);
  renderFlashcard();
}

function reportarFlashcard() {
  const q = flashcardsState.mazo[flashcardsState.idx];
  if (!q) return;
  pedirTexto({
    titulo: `Reportar pregunta #${q.id}`,
    etiqueta: '¿Qué problema tiene? (errata, respuesta dudosa, ambigua, etc.)',
    placeholder: 'Describe el problema…',
    textoAceptar: 'Reportar',
    onAceptar: (motivo) => {
      addReportada(q.id, motivo);
      toast('Reporte registrado. Gracias.', 'success');
    }
  });
}

// ============================================
//   Plan de estudio sugerido (dashboard)
// ============================================
function calcularPlanSugerido() {
  const tracking = getTracking();
  const idsConDatos = Object.keys(tracking);
  const totalBanco = todasPreguntas.length;
  const vistas = idsConDatos.length;
  const cobertura = totalBanco > 0 ? Math.round(vistas / totalBanco * 100) : 0;

  // Stats por categoría con datos
  const statsCat = {};
  todasPreguntas.forEach(q => {
    const t = tracking[q.id];
    if (!t || !t.vistas) return;
    if (!statsCat[q.categoria]) statsCat[q.categoria] = { vistas: 0, aciertos: 0 };
    statsCat[q.categoria].vistas += t.vistas;
    statsCat[q.categoria].aciertos += t.aciertos || 0;
  });
  const catsArr = Object.entries(statsCat)
    .filter(([,v]) => v.vistas >= 3)
    .map(([c,v]) => ({ cat: c, pct: v.aciertos / v.vistas * 100, vistas: v.vistas }))
    .sort((a,b) => a.pct - b.pct);

  // Stats por dimensión
  const statsDim = {};
  todasPreguntas.forEach(q => {
    const t = tracking[q.id];
    if (!t || !t.vistas) return;
    const d = q.dimension || 'sin';
    if (!statsDim[d]) statsDim[d] = { vistas: 0, aciertos: 0 };
    statsDim[d].vistas += t.vistas;
    statsDim[d].aciertos += t.aciertos || 0;
  });
  const dimsArr = Object.entries(statsDim)
    .filter(([,v]) => v.vistas >= 3)
    .map(([d,v]) => ({ dim: d, pct: v.aciertos / v.vistas * 100 }))
    .sort((a,b) => a.pct - b.pct);

  return { cobertura, vistas, totalBanco, catsArr, dimsArr };
}

function renderPlanSugerido() {
  const plan = calcularPlanSugerido();
  const div = document.getElementById('plan-sugerido');
  if (!div) return;

  if (plan.vistas < 10) {
    div.innerHTML = `
      <div class="plan-card">
        <div class="plan-titulo">🎯 Plan sugerido</div>
        <p>Has visto ${plan.vistas} de ${plan.totalBanco} preguntas. Empieza con un examen general para que el simulador conozca tu nivel y luego te recomiende qué reforzar.</p>
        <button onclick="aplicarPlan('inicial')">Empezar examen general (50 reactivos)</button>
      </div>`;
    return;
  }

  let html = `
    <div class="plan-card">
      <div class="plan-titulo">🎯 Plan sugerido para hoy</div>
      <p class="plan-cobertura">Cobertura del banco: <strong>${plan.cobertura}%</strong> (${plan.vistas}/${plan.totalBanco} reactivos vistos)</p>
      <div class="plan-sesiones">`;

  // Sesión 1: peor categoría
  if (plan.catsArr.length > 0) {
    const peor = plan.catsArr[0];
    const pct = Math.round(peor.pct);
    html += `
      <div class="plan-sesion">
        <div class="plan-sesion-num">1</div>
        <div class="plan-sesion-cuerpo">
          <div class="plan-sesion-titulo">Refuerza tu categoría más débil</div>
          <div class="plan-sesion-detalle"><strong>${peor.cat}</strong> · ${pct}% de aciertos</div>
          <button onclick="aplicarPlan('debil_cat', ${JSON.stringify(peor.cat).replace(/"/g,'&quot;')})">▶ 20 reactivos · estudio · ponderado</button>
        </div>
      </div>`;
  }

  // Sesión 2: peor dimensión
  if (plan.dimsArr.length > 0) {
    const peorD = plan.dimsArr[0];
    const pct = Math.round(peorD.pct);
    const nombreDim = ETIQUETAS_DIMENSION[peorD.dim] || peorD.dim;
    html += `
      <div class="plan-sesion">
        <div class="plan-sesion-num">2</div>
        <div class="plan-sesion-cuerpo">
          <div class="plan-sesion-titulo">Trabaja tu dimensión más débil</div>
          <div class="plan-sesion-detalle"><strong>${nombreDim}</strong> · ${pct}% de aciertos</div>
          <button onclick="aplicarPlan('debil_dim', ${JSON.stringify(peorD.dim).replace(/"/g,'&quot;')})">▶ 30 reactivos · estudio</button>
        </div>
      </div>`;
  }

  // Sesión 3: simulacro completo
  html += `
      <div class="plan-sesion">
        <div class="plan-sesion-num">3</div>
        <div class="plan-sesion-cuerpo">
          <div class="plan-sesion-titulo">Simulacro tipo USICAMM</div>
          <div class="plan-sesion-detalle">90 reactivos cronometrados · ~3:36 hrs · todas las dimensiones</div>
          <button onclick="aplicarPlan('simulacro')">▶ Empezar simulacro completo</button>
        </div>
      </div>`;

  // Sesión 4: flashcards de errores
  const tracking = getTracking();
  const idsErrores = Object.keys(tracking).filter(id => {
    const t = tracking[id];
    return t.vistas >= 2 && (t.aciertos / t.vistas) < 0.5;
  });
  if (idsErrores.length >= 5) {
    html += `
      <div class="plan-sesion">
        <div class="plan-sesion-num">4</div>
        <div class="plan-sesion-cuerpo">
          <div class="plan-sesion-titulo">Flashcards de tus errores recurrentes</div>
          <div class="plan-sesion-detalle">${idsErrores.length} reactivos en los que has fallado más</div>
          <button onclick="aplicarPlan('flashcards_errores')">▶ Repasar con flashcards</button>
        </div>
      </div>`;
  }

  html += `</div></div>`;
  div.innerHTML = html;
}

function aplicarPlan(tipo, valor) {
  cerrarDashboard();
  if (tipo === 'inicial') {
    filtros = { ...filtros, modo: 'estudio', cantidad: 50, dimension: 'todas', tipo: 'todos', categoria: 'todas', ponderado: false, busqueda: '' };
    renderFiltros();
    actualizarResumenSeleccion();
    iniciarExamen();
  } else if (tipo === 'debil_cat') {
    filtros = { ...filtros, modo: 'estudio', cantidad: 20, dimension: 'todas', tipo: 'todos', categoria: valor, ponderado: true, busqueda: '' };
    renderFiltros();
    actualizarResumenSeleccion();
    iniciarExamen();
  } else if (tipo === 'debil_dim') {
    filtros = { ...filtros, modo: 'estudio', cantidad: 30, dimension: valor, tipo: 'todos', categoria: 'todas', ponderado: false, busqueda: '' };
    renderFiltros();
    actualizarResumenSeleccion();
    iniciarExamen();
  } else if (tipo === 'simulacro') {
    filtros = { ...filtros, modo: 'simulacro', cantidad: 90, dimension: 'todas', tipo: 'todos', categoria: 'todas', ponderado: false, busqueda: '' };
    renderFiltros();
    actualizarResumenSeleccion();
    iniciarExamen();
  } else if (tipo === 'flashcards_errores') {
    filtros = { ...filtros, ponderado: true, cantidad: 30, dimension: 'todas', tipo: 'todos', categoria: 'todas', busqueda: '' };
    renderFiltros();
    iniciarFlashcards();
  }
}

// ============================================
//   Filtros de revisión + render
// ============================================
function renderFiltrosRevision() {
  const cont = document.getElementById('filtros-revision-chips');
  if (!cont) return;
  const conteos = {
    todas: preguntas.length,
    incorrectas: preguntas.filter((_, i) => respuestas[i] !== preguntas[i]._respuesta && respuestas[i] !== null).length,
    correctas: preguntas.filter((_, i) => respuestas[i] === preguntas[i]._respuesta).length,
    'sin-responder': preguntas.filter((_, i) => respuestas[i] === null).length,
    dudosas: marcadas.size
  };
  const opciones = [
    { v: 'todas', l: 'Todas' },
    { v: 'incorrectas', l: '✗ Incorrectas' },
    { v: 'correctas', l: '✓ Correctas' },
    { v: 'sin-responder', l: '○ Sin responder' },
    { v: 'dudosas', l: '🚩 Dudosas' }
  ];
  cont.innerHTML = opciones.map(o => `
    <button class="chip-rev ${filtroRevision === o.v ? 'activo' : ''}" onclick="setFiltroRevision('${o.v}')" ${conteos[o.v] === 0 ? 'disabled' : ''}>
      ${o.l} (${conteos[o.v]})
    </button>`).join('');
}

function setFiltroRevision(v) {
  filtroRevision = v;
  renderFiltrosRevision();
  renderRevision();
}

function renderRevision() {
  const div = document.getElementById('revision');
  div.innerHTML = '';

  // Determinar grupos: si dos preguntas comparten caso, las mostramos en un grupo
  const usado = new Set();
  preguntas.forEach((p, i) => {
    if (usado.has(i)) return;
    const grupo = preguntasMismoCaso(i);
    grupo.forEach(j => usado.add(j));

    // Filtrar el grupo según el filtro de revisión
    const filtradas = grupo.filter(j => {
      const ok = respuestas[j] === preguntas[j]._respuesta;
      if (filtroRevision === 'incorrectas') return !ok && respuestas[j] !== null;
      if (filtroRevision === 'correctas') return ok;
      if (filtroRevision === 'sin-responder') return respuestas[j] === null;
      if (filtroRevision === 'dudosas') return marcadas.has(j);
      return true;
    });
    if (!filtradas.length) return;

    if (grupo.length > 1 && p.caso) {
      // Render como multireactivo
      const wrap = document.createElement('div');
      wrap.className = 'multireactivo';
      wrap.innerHTML = `
        <div class="multi-encabezado">
          <span class="multi-tag">Multireactivo · ${grupo.length} preguntas</span>
        </div>
        <div class="caso multi-caso">${p.caso}</div>
        <div class="multi-preguntas"></div>`;
      const cont = wrap.querySelector('.multi-preguntas');
      filtradas.forEach(j => cont.appendChild(buildRevItem(j, /*soloPregunta*/ true)));
      div.appendChild(wrap);
    } else {
      filtradas.forEach(j => div.appendChild(buildRevItem(j, false)));
    }
  });

  if (!div.children.length) {
    div.innerHTML = '<p class="hist-empty">No hay preguntas que cumplan el filtro seleccionado.</p>';
  }
}

function buildRevItem(i, soloPregunta) {
  const p = preguntas[i];
  const esCorrecta = respuestas[i] === p._respuesta;
  const dudosa = marcadas.has(i);
  const div = document.createElement('div');
  div.className = `revision-item ${esCorrecta ? 'correcta' : 'incorrecta'} ${dudosa ? 'dudosa' : ''}`;
  div.innerHTML = `
    <div class="revision-meta">
      <span class="etiqueta ${esCorrecta ? 'ok' : 'mal'}">${esCorrecta ? '✓ Correcta' : (respuestas[i] === null ? '○ Sin responder' : '✗ Incorrecta')}</span>
      ${dudosa ? '<span class="meta-chip dudosa-chip">🚩 Marcada como dudosa</span>' : ''}
      ${p.tipo ? `<span class="meta-chip">${ETIQUETAS_TIPO[p.tipo] || p.tipo}</span>` : ''}
      ${p.categoria && !soloPregunta ? `<span class="meta-chip">${p.categoria}</span>` : ''}
    </div>
    ${!soloPregunta && p.caso ? `<div class="caso">${p.caso}</div>` : ''}
    <p class="pregunta-rev"><strong>${p.pregunta}</strong></p>
    <p class="tu-respuesta">Tu respuesta: <strong>${respuestas[i] !== null ? p._opciones[respuestas[i]] : 'Sin responder'}</strong></p>
    ${!esCorrecta ? `<p class="respuesta-correcta">Respuesta correcta: <strong>${p._opciones[p._respuesta]}</strong></p>` : ''}
    <div class="explicacion"><strong>Explicación:</strong> ${p.explicacion}</div>
    ${p.cita ? `<div class="cita-fuente"><strong>Fuente:</strong> ${p.cita}</div>` : ''}
    ${getNotas()[p.id] ? `<div class="nota-rev"><strong>📝 Tu nota:</strong> ${getNotas()[p.id]}</div>` : ''}
  `;
  return div;
}

// ============================================
//   Repaso de errores
// ============================================
function repetirErrores() {
  preguntas = preguntas.filter((_, i) => respuestas[i] !== preguntas[i]._respuesta);
  shuffle(preguntas);
  iniciarExamen(true);
}

function reiniciar() {
  volverInicio();
  renderHistorial();
  verificarExamenGuardado();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
//   Dashboard de progreso
// ============================================
function abrirDashboard() {
  mostrarPantalla('pantalla-dashboard');
  renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarDashboard() {
  volverInicio();
}

function renderDashboard() {
  const cont = document.getElementById('dashboard-content');
  const hist = leerLS(STORAGE_KEY_HISTORIAL, []);
  const tracking = getTracking();
  const idsTrackeadas = Object.keys(tracking);

  if (!hist.length && !idsTrackeadas.length) {
    cont.innerHTML = `
      <div id="plan-sugerido"></div>
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-titulo">Aún no tienes datos</div>
        <div class="empty-state-mensaje">Realiza algunos exámenes o flashcards para que aparezcan tus estadísticas, evolución y plan sugerido aquí.</div>
        <button class="empty-state-cta" onclick="abrirConfigExamen()">Empezar mi primer examen</button>
      </div>`;
    renderPlanSugerido();
    return;
  }

  // Estadísticas globales
  const totalIntentos = hist.length;
  const totalPreguntas = hist.reduce((a, h) => a + h.total, 0);
  const totalCorrectas = hist.reduce((a, h) => a + h.correctas, 0);
  const promedio = totalPreguntas ? Math.round(totalCorrectas / totalPreguntas * 100) : 0;

  // Aciertos por categoría histórica (a partir de tracking)
  const statsCat = {};
  todasPreguntas.forEach(q => {
    const t = tracking[q.id];
    if (!t || t.vistas === 0) return;
    if (!statsCat[q.categoria]) statsCat[q.categoria] = { vistas: 0, aciertos: 0, preguntasUnicas: 0, total: 0 };
    statsCat[q.categoria].vistas += t.vistas;
    statsCat[q.categoria].aciertos += t.aciertos;
    statsCat[q.categoria].preguntasUnicas++;
  });
  todasPreguntas.forEach(q => {
    if (!statsCat[q.categoria]) return;
    statsCat[q.categoria].total = todasPreguntas.filter(p => p.categoria === q.categoria).length;
  });

  const categorias = Object.entries(statsCat)
    .map(([cat, v]) => ({ cat, ...v, pct: Math.round(v.aciertos / v.vistas * 100) }))
    .sort((a, b) => a.pct - b.pct);

  // Línea de progreso temporal
  const ultimos = hist.slice(-20);

  // Preguntas más falladas (top 10)
  const debiles = todasPreguntas
    .map(q => {
      const t = tracking[q.id];
      if (!t || t.vistas < 2) return null;
      const tasa = t.aciertos / t.vistas;
      return { ...q, vistas: t.vistas, aciertos: t.aciertos, tasa };
    })
    .filter(x => x && x.tasa < 0.5)
    .sort((a, b) => a.tasa - b.tasa)
    .slice(0, 10);

  // Preguntas reportadas
  const reportadas = leerLS(STORAGE_KEY_REPORTADAS, []);

  cont.innerHTML = `
    <div id="plan-sugerido"></div>
    <div class="dash-summary">
      <div class="dash-card">
        <div class="dash-num">${totalIntentos}</div>
        <div class="dash-label">Exámenes hechos</div>
      </div>
      <div class="dash-card">
        <div class="dash-num">${totalPreguntas}</div>
        <div class="dash-label">Preguntas respondidas</div>
      </div>
      <div class="dash-card">
        <div class="dash-num" style="color:${colorPct(promedio)}">${promedio}%</div>
        <div class="dash-label">Promedio histórico</div>
      </div>
      <div class="dash-card">
        <div class="dash-num">${idsTrackeadas.length}/${todasPreguntas.length}</div>
        <div class="dash-label">Preguntas vistas</div>
      </div>
    </div>

    ${ultimos.length >= 2 ? `
    <h3 class="dash-section-titulo">Evolución de tus últimos exámenes</h3>
    <div class="dash-chart">${renderLineChart(ultimos)}</div>
    ` : ''}

    ${categorias.length ? `
    <h3 class="dash-section-titulo">Rendimiento por categoría (histórico)</h3>
    <div class="stats-grid">
      ${categorias.map(c => `
        <div class="stat-row">
          <div class="stat-cat">${c.cat}</div>
          <div class="stat-barra-wrap"><div class="stat-barra" style="width:${c.pct}%;background:${colorPct(c.pct)}"></div></div>
          <div class="stat-num">${c.aciertos}/${c.vistas} (${c.pct}%)</div>
        </div>`).join('')}
    </div>` : ''}

    ${debiles.length ? `
    <h3 class="dash-section-titulo">🎯 Preguntas a reforzar (top ${debiles.length})</h3>
    <div class="debiles-lista">
      ${debiles.map(q => `
        <div class="debil-item">
          <div class="debil-pregunta">${q.pregunta}</div>
          <div class="debil-meta">
            <span class="meta-chip">${q.categoria}</span>
            <span>Aciertos: ${q.aciertos}/${q.vistas} (${Math.round(q.tasa*100)}%)</span>
          </div>
        </div>`).join('')}
    </div>` : ''}

    ${reportadas.length ? `
    <h3 class="dash-section-titulo">⚠️ Preguntas que reportaste (${reportadas.length})</h3>
    <div class="reportadas-lista">
      ${reportadas.map(r => {
        const q = todasPreguntas.find(qq => qq.id === r.id);
        return `<div class="reportada-item">
          <div><strong>#${r.id}</strong> — ${q ? q.categoria : 'pregunta desconocida'}</div>
          <div class="reporte-motivo">${r.motivo || '(sin motivo)'}</div>
          <div class="reporte-fecha">${new Date(r.fecha).toLocaleDateString('es-MX')}</div>
        </div>`;
      }).join('')}
      <button class="btn-secundario" onclick="exportarReportadas()">Exportar como JSON</button>
    </div>` : ''}

    <div class="dash-acciones">
      <button class="btn-secundario" onclick="resetearProgreso()">Borrar todo mi progreso</button>
    </div>
  `;
  renderPlanSugerido();
}

function renderLineChart(hist) {
  if (hist.length < 2) return '';
  const w = 600, h = 160, padding = 30;
  const xs = hist.map((_, i) => padding + (i * (w - 2*padding) / (hist.length - 1)));
  const ys = hist.map(h0 => h - padding - (h0.porcentaje * (h - 2*padding) / 100));
  const linea = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const puntos = xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="4" fill="${colorPct(hist[i].porcentaje)}"/>`).join('');
  return `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto">
      <line x1="${padding}" y1="${h-padding}" x2="${w-padding}" y2="${h-padding}" stroke="#cbd5e1"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${h-padding}" stroke="#cbd5e1"/>
      <text x="${padding-5}" y="${padding}" text-anchor="end" font-size="10" fill="#64748b">100%</text>
      <text x="${padding-5}" y="${h-padding}" text-anchor="end" font-size="10" fill="#64748b">0%</text>
      <path d="${linea}" stroke="#667eea" stroke-width="2" fill="none"/>
      ${puntos}
    </svg>`;
}

function exportarReportadas() {
  const datos = leerLS(STORAGE_KEY_REPORTADAS, []);
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usicamm-reportadas-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetearProgreso() {
  confirmar({
    titulo: 'Borrar todo tu progreso',
    mensaje: 'Esto eliminará tu historial, tracking, notas, reportes y examen en curso. Esta acción no se puede deshacer.',
    textoConfirmar: 'Sí, borrar todo',
    peligro: true,
    onConfirmar: () => {
      [STORAGE_KEY_EXAMEN, STORAGE_KEY_HISTORIAL, STORAGE_KEY_TRACKING, STORAGE_KEY_NOTAS, STORAGE_KEY_REPORTADAS].forEach(k => localStorage.removeItem(k));
      toast('Progreso borrado', 'success');
      cerrarDashboard();
      renderHistorial();
      verificarExamenGuardado();
      renderBienvenidaStat();
    }
  });
}

// ============================================
//   Preferencias UI: tema, fuente, TTS
// ============================================
const STORAGE_KEY_PREFS = 'usicamm_prefs';

function getPrefs() { return leerLS(STORAGE_KEY_PREFS, { tema: 'claro', fontScale: 1, ttsLeyendo: false }); }
function setPrefs(p) { escribirLS(STORAGE_KEY_PREFS, p); }

function aplicarTema() {
  const p = getPrefs();
  document.documentElement.dataset.tema = p.tema;
  document.documentElement.style.setProperty('--font-scale', p.fontScale);
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = p.tema === 'oscuro' ? '☀️' : '🌙';
}

function toggleTema() {
  const p = getPrefs();
  p.tema = (p.tema === 'oscuro') ? 'claro' : 'oscuro';
  setPrefs(p);
  aplicarTema();
}

function cambiarFuente(delta) {
  const p = getPrefs();
  p.fontScale = Math.max(0.85, Math.min(1.4, (p.fontScale || 1) + delta * 0.1));
  setPrefs(p);
  aplicarTema();
}

let utteranceActual = null;
function leerEnVoz() {
  if (!('speechSynthesis' in window)) { alert('Tu navegador no soporta lectura por voz.'); return; }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.getElementById('btn-tts').textContent = '🔊';
    return;
  }
  // Intentar leer la pregunta actual del examen, o el contenido visible
  const enExamen = !document.getElementById('pantalla-examen').classList.contains('oculto');
  let texto = '';
  if (enExamen && preguntas[actual]) {
    const p = preguntas[actual];
    if (p.caso) texto += p.caso + '. ';
    texto += p.pregunta + '. ';
    p._opciones.forEach((o, i) => texto += `Opción ${String.fromCharCode(65 + i)}: ${o}. `);
  } else {
    texto = (document.querySelector('.info-card h2')?.textContent || '') + '. ' +
            (document.querySelector('.info-card p')?.textContent || '');
  }
  if (!texto.trim()) return;
  utteranceActual = new SpeechSynthesisUtterance(texto);
  utteranceActual.lang = 'es-MX';
  utteranceActual.rate = 1.0;
  utteranceActual.onstart = () => document.getElementById('btn-tts').textContent = '⏸️';
  utteranceActual.onend = () => document.getElementById('btn-tts').textContent = '🔊';
  utteranceActual.onerror = () => document.getElementById('btn-tts').textContent = '🔊';
  window.speechSynthesis.speak(utteranceActual);
}

// ============================================
//   Playlists / Sets guardados
// ============================================
const STORAGE_KEY_PLAYLISTS = 'usicamm_playlists';

function getPlaylists() { return leerLS(STORAGE_KEY_PLAYLISTS, []); }

function guardarPlaylistActual() {
  pedirTexto({
    titulo: 'Guardar configuración',
    etiqueta: 'Nombre descriptivo (por ejemplo: "Plan 2022 simulacro 50 reactivos")',
    placeholder: 'Nombre…',
    textoAceptar: 'Guardar',
    onAceptar: (nombre) => {
      const playlists = getPlaylists();
      playlists.push({ nombre, filtros: { ...filtros }, fecha: new Date().toISOString() });
      escribirLS(STORAGE_KEY_PLAYLISTS, playlists);
      renderPlaylists();
      toast(`Configuración "${nombre}" guardada`, 'success');
    }
  });
}

function cargarPlaylist(idx) {
  const playlists = getPlaylists();
  const p = playlists[idx];
  if (!p) return;
  filtros = { ...filtros, ...p.filtros };
  renderFiltros();
  actualizarResumenSeleccion();
}

function eliminarPlaylist(idx) {
  const playlists = getPlaylists();
  const p = playlists[idx];
  if (!p) return;
  confirmar({
    titulo: 'Eliminar configuración',
    mensaje: `¿Eliminar la configuración "${p.nombre}"?`,
    textoConfirmar: 'Eliminar',
    peligro: true,
    onConfirmar: () => {
      playlists.splice(idx, 1);
      escribirLS(STORAGE_KEY_PLAYLISTS, playlists);
      renderPlaylists();
      toast('Configuración eliminada', 'info');
    }
  });
}

function renderPlaylists() {
  const cont = document.getElementById('playlists');
  if (!cont) return;
  const playlists = getPlaylists();
  if (!playlists.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⭐</div>
        <div class="empty-state-titulo">Sin configuraciones guardadas</div>
        <div class="empty-state-mensaje">Configura los filtros del examen como te acomoden y guárdalos para volver a usarlos con un solo click.</div>
        <button class="empty-state-cta btn-secundario" onclick="abrirConfigExamen()">Configurar mi primer examen</button>
      </div>`;
    return;
  }
  cont.innerHTML = playlists.map((p, i) => `
    <div class="playlist-item">
      <div class="playlist-info">
        <div class="playlist-nombre">${escHTML(p.nombre)}</div>
        <div class="playlist-detalle">${escHTML(describirFiltros(p.filtros))}</div>
      </div>
      <div class="playlist-acciones">
        <button class="btn-toolbar" onclick="cargarPlaylist(${i})">Cargar</button>
        <button class="btn-toolbar" onclick="eliminarPlaylist(${i})">✕</button>
      </div>
    </div>`).join('');
}

function describirFiltros(f) {
  const partes = [];
  partes.push(f.modo === 'simulacro' ? 'Simulacro' : 'Estudio');
  partes.push(f.cantidad === 'todas' ? 'Todas' : `${f.cantidad} preguntas`);
  if (f.dimension !== 'todas') partes.push(ETIQUETAS_DIMENSION[f.dimension]);
  if (f.tipo !== 'todos') partes.push(ETIQUETAS_TIPO[f.tipo]);
  if (f.categoria !== 'todas') partes.push(f.categoria);
  if (f.ponderado) partes.push('🎯 ponderado');
  return partes.join(' · ');
}

// ============================================
//   PWA: registrar service worker (con auto-limpieza)
// ============================================
const APP_VERSION = '4';

if ('serviceWorker' in navigator) {
  // Limpiar cualquier service worker viejo y caches obsoletos en cada carga
  navigator.serviceWorker.getRegistrations().then(regs => {
    const tieneViejo = regs.some(r => !r.active || !r.active.scriptURL.includes('sw.js'));
    if (tieneViejo) {
      Promise.all(regs.map(r => r.unregister())).then(() => {
        if ('caches' in window) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
      });
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Detectar cambios de versión y forzar recarga única
const versionGuardada = localStorage.getItem('app_version');
if (versionGuardada && versionGuardada !== APP_VERSION) {
  localStorage.setItem('app_version', APP_VERSION);
  if ('caches' in window) {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => location.reload(true));
  } else {
    location.reload(true);
  }
} else if (!versionGuardada) {
  localStorage.setItem('app_version', APP_VERSION);
}

// ============================================
//   Inicio
// ============================================
aplicarTema();
cargarPreguntas();
