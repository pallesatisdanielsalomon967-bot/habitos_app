/*
 * app.js — Interfaz de la app de hábitos.
 * Mismo patrón que la web de gastos: cargar datos -> escuchar eventos ->
 * actualizar datos -> guardar -> volver a pintar (render).
 */
"use strict";

const CLAVE_ALMACENAMIENTO = "habitos-app:v1";
const DIAS_VISIBLES = 7;

// ---------- 1. Referencias al HTML ----------
const fechaHoyElemento = document.getElementById("fecha-hoy");
const textoProgreso = document.getElementById("texto-progreso");
const rellenoProgreso = document.getElementById("relleno-progreso");
const listaHabitos = document.getElementById("lista-habitos");
const mensajeVacio = document.getElementById("mensaje-vacio");
const formulario = document.getElementById("formulario-habito");
const campoNombre = document.getElementById("nombre-habito");
const mensajeError = document.getElementById("mensaje-error");
const botonInstalar = document.getElementById("boton-instalar");

// ---------- 2. Datos ----------
let habitos = cargarHabitos();

function cargarHabitos() {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!texto) return [];
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos.filter(esHabitoValido) : [];
  } catch (error) {
    console.warn("No se pudieron leer los hábitos guardados:", error);
    return [];
  }
}

function guardarHabitos() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(habitos));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los hábitos:", error);
    mensajeError.textContent = "No se pudo guardar en este dispositivo.";
    return false;
  }
}

// ---------- 3. Interfaz ----------

/** Crea el <li> de un hábito. */
function crearElementoHabito(habito, hoy) {
  const hecho = estaCompletado(habito, hoy);
  const racha = calcularRacha(habito, hoy);

  const elemento = document.createElement("li");
  elemento.className = hecho ? "habito habito-hecho" : "habito";

  // Botón grande para marcar el día de hoy
  const botonMarcar = document.createElement("button");
  botonMarcar.type = "button";
  botonMarcar.className = "boton-marcar";
  botonMarcar.dataset.accion = "marcar";
  botonMarcar.dataset.id = habito.id;
  botonMarcar.setAttribute("aria-pressed", String(hecho)); // accesibilidad: botón tipo interruptor
  botonMarcar.setAttribute("aria-label", `${hecho ? "Desmarcar" : "Marcar"} ${habito.nombre} como hecho hoy`);
  botonMarcar.textContent = hecho ? "✓" : "";

  // Nombre, racha y los últimos 7 días
  const info = document.createElement("div");
  info.className = "habito-info";

  const nombre = document.createElement("strong");
  nombre.className = "habito-nombre";
  nombre.textContent = habito.nombre; // textContent: seguro frente a inyección de HTML

  const textoRacha = document.createElement("span");
  textoRacha.className = "habito-racha";
  textoRacha.textContent = racha === 0
    ? "Sin racha todavía"
    : `🔥 ${racha} ${racha === 1 ? "día" : "días"} seguidos`;

  const semana = document.createElement("div");
  semana.className = "semana";
  semana.setAttribute("aria-label", "Últimos 7 días");
  for (const dia of ultimosDias(hoy, DIAS_VISIBLES)) {
    const punto = document.createElement("span");
    punto.className = estaCompletado(habito, dia) ? "dia dia-hecho" : "dia";
    if (dia === hoy) punto.classList.add("dia-hoy");
    punto.textContent = inicialDia(dia);
    punto.title = `${fechaLarga(dia)}: ${estaCompletado(habito, dia) ? "cumplido" : "no cumplido"}`;
    semana.append(punto);
  }

  info.append(nombre, textoRacha, semana);

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.className = "boton-eliminar";
  botonEliminar.dataset.accion = "eliminar";
  botonEliminar.dataset.id = habito.id;
  botonEliminar.setAttribute("aria-label", `Eliminar el hábito ${habito.nombre}`);
  botonEliminar.textContent = "🗑";

  elemento.append(botonMarcar, info, botonEliminar);
  return elemento;
}

function render() {
  // Se calcula "hoy" en cada render: si la app queda abierta pasada la medianoche,
  // el siguiente render ya usa el día nuevo.
  const hoy = hoyTexto();
  fechaHoyElemento.textContent = fechaLarga(hoy);

  const hechos = contarCompletados(habitos, hoy);
  const total = habitos.length;
  textoProgreso.textContent = total === 0
    ? "Agrega tu primer hábito"
    : `${hechos} de ${total} hábitos hoy${hechos === total ? " 🎉" : ""}`;
  rellenoProgreso.style.width = total === 0 ? "0%" : `${(hechos / total) * 100}%`;

  listaHabitos.replaceChildren(...habitos.map((h) => crearElementoHabito(h, hoy)));
  mensajeVacio.hidden = total > 0;
}

// ---------- 4. Eventos ----------

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const error = validarNombre(campoNombre.value, habitos);
  if (error) {
    mensajeError.textContent = error;
    return;
  }
  habitos.push(crearHabito(campoNombre.value));
  if (!guardarHabitos()) return;
  mensajeError.textContent = "";
  formulario.reset();
  render();
});

// Al escribir de nuevo, se borra el mensaje de error anterior
campoNombre.addEventListener("input", () => {
  mensajeError.textContent = "";
});

// Delegación de eventos: un solo escuchador para marcar y eliminar
listaHabitos.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const { accion, id } = boton.dataset;

  if (accion === "marcar") {
    const hoy = hoyTexto();
    habitos = habitos.map((h) => (h.id === id ? alternarDia(h, hoy) : h));
  } else if (accion === "eliminar") {
    // Confirmación de doble toque: el primer toque marca el botón, el segundo elimina
    if (boton.dataset.confirmar !== "si") {
      boton.dataset.confirmar = "si";
      boton.textContent = "¿Borrar?";
      boton.classList.add("boton-confirmar");
      setTimeout(render, 4000); // si no se confirma, vuelve a la normalidad
      return;
    }
    habitos = habitos.filter((h) => h.id !== id);
  }
  guardarHabitos();
  render();
});

// Al volver a la app (por ejemplo, al día siguiente) se actualiza la pantalla
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") render();
});

// ---------- 5. Instalación como app (PWA) ----------

// Chrome en Android avisa que la app es instalable con este evento
let solicitudInstalacion = null;
window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  solicitudInstalacion = evento;
  botonInstalar.hidden = false;
});

botonInstalar.addEventListener("click", async () => {
  if (!solicitudInstalacion) return;
  solicitudInstalacion.prompt();
  await solicitudInstalacion.userChoice;
  solicitudInstalacion = null;
  botonInstalar.hidden = true;
});

// El service worker permite abrir la app sin internet.
// Solo funciona en https (GitHub Pages) o en localhost, no abriendo el archivo con doble clic.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker no registrado (normal si abriste el archivo localmente):", error);
    });
  });
}

// ---------- 6. Arranque ----------
render();
