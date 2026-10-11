/*
 * logica.js — Reglas de la app de hábitos (fechas, rachas, validación).
 *
 * No toca el HTML. Todas las fechas se manejan como texto "AAAA-MM-DD" en hora
 * LOCAL, porque así se comparan y guardan fácil, y se evitan errores de zona horaria.
 */
"use strict";

const LARGO_MAXIMO_NOMBRE = 40;
const INICIALES_DIAS = ["D", "L", "M", "X", "J", "V", "S"]; // getDay(): 0 = domingo. X = miércoles

/** Convierte un objeto Date en "AAAA-MM-DD" usando la hora local. */
function aFechaTexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Convierte "AAAA-MM-DD" en un Date local (a mediodía, para evitar problemas de horario). */
function aFecha(fechaTexto) {
  const [anio, mes, dia] = fechaTexto.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 12);
}

/** Fecha de hoy en formato texto. */
function hoyTexto() {
  return aFechaTexto(new Date());
}

/**
 * Suma (o resta, con números negativos) días a una fecha texto.
 * JavaScript corrige solo los desbordes: el 1 de marzo menos 1 día da 28 o 29 de febrero.
 */
function sumarDias(fechaTexto, cantidad) {
  const fecha = aFecha(fechaTexto);
  fecha.setDate(fecha.getDate() + cantidad);
  return aFechaTexto(fecha);
}

/** Devuelve "" si el nombre es válido, o un mensaje de error. */
function validarNombre(nombre, habitos) {
  const limpio = String(nombre ?? "").trim();
  if (limpio === "") {
    return "Escribe el nombre del hábito.";
  }
  if (limpio.length > LARGO_MAXIMO_NOMBRE) {
    return `El nombre no puede pasar de ${LARGO_MAXIMO_NOMBRE} caracteres.`;
  }
  const repetido = habitos.some((h) => h.nombre.toLowerCase() === limpio.toLowerCase());
  if (repetido) {
    return "Ya tienes un hábito con ese nombre.";
  }
  return "";
}

/** Crea un hábito nuevo (se asume que el nombre ya fue validado). */
function crearHabito(nombre) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nombre: nombre.trim(),
    creado: hoyTexto(),
    completados: [] // lista de fechas "AAAA-MM-DD" en las que se cumplió
  };
}

/** ¿Se cumplió el hábito en esa fecha? */
function estaCompletado(habito, fecha) {
  return habito.completados.includes(fecha);
}

/**
 * Marca o desmarca un día. Devuelve un hábito NUEVO en lugar de modificar el
 * original ("inmutabilidad"): así es más fácil saber qué cambió y evitar errores.
 */
function alternarDia(habito, fecha) {
  const completados = estaCompletado(habito, fecha)
    ? habito.completados.filter((f) => f !== fecha) // quitar
    : [...habito.completados, fecha];               // agregar
  return { ...habito, completados };
}

/**
 * Racha = cuántos días SEGUIDOS se ha cumplido el hábito hasta hoy.
 * Regla: si hoy todavía no lo has marcado, la racha no se pierde; se cuenta
 * desde ayer. Se rompe solo cuando falta un día completo.
 */
function calcularRacha(habito, hoy) {
  const hechos = new Set(habito.completados); // Set: búsqueda rápida
  let dia = hechos.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (hechos.has(dia)) {
    racha++;
    dia = sumarDias(dia, -1);
  }
  return racha;
}

/** Lista de las últimas N fechas, de la más antigua a hoy. */
function ultimosDias(hoy, cantidad) {
  const dias = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    dias.push(sumarDias(hoy, -i));
  }
  return dias;
}

/** "2026-10-10" -> "S" (sábado). */
function inicialDia(fechaTexto) {
  return INICIALES_DIAS[aFecha(fechaTexto).getDay()];
}

/** Cuántos hábitos se cumplieron en una fecha. */
function contarCompletados(habitos, fecha) {
  return habitos.filter((h) => estaCompletado(h, fecha)).length;
}

/** "2026-10-10" -> "sábado, 10 de octubre". */
function fechaLarga(fechaTexto) {
  return aFecha(fechaTexto).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

/** Revisa que un hábito leído del almacenamiento tenga la forma correcta. */
function esHabitoValido(h) {
  return Boolean(h) &&
    typeof h.id === "string" &&
    typeof h.nombre === "string" &&
    h.nombre.trim() !== "" &&
    Array.isArray(h.completados) &&
    h.completados.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f));
}
