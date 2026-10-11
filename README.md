# ✅ Mis Hábitos (aplicación móvil PWA)

Aplicación móvil para hacer seguimiento de hábitos diarios y ver rachas de días seguidos.
Es una **PWA (Progressive Web App)**: se abre con un link y se puede instalar en el celular como una app, con ícono propio y funcionamiento sin internet.

- **Autor:** Daniel Salomón Palles Atis
- **Semestre:** Primer semestre, Ingeniería de Software
- **Materia:** Contexto de Software
- **App publicada:** https://pallesatisdanielsalomon967-bot.github.io/habitos_app/

## Funcionalidades

- Crear hábitos (sin nombres vacíos ni repetidos).
- Marcar o desmarcar cada hábito como hecho hoy con un toque.
- Racha de días seguidos (si hoy aún no lo marcas, la racha no se pierde hasta que pase el día).
- Vista de los últimos 7 días por hábito.
- Barra de progreso del día.
- Eliminar hábitos (con confirmación).
- Datos guardados en el dispositivo (`localStorage`).
- Instalable y funciona sin internet (service worker).

## Cómo instalarla en el celular

- **Android (Chrome):** abre el link → botón **Instalar** de la app, o menú ⋮ → **Instalar aplicación / Agregar a pantalla principal**.
- **iPhone (Safari):** abre el link → botón **Compartir** → **Agregar a pantalla de inicio**.

## Estructura

```
habitos-app/
├── index.html           Estructura de la app
├── manifest.json        Datos para instalarla (nombre, íconos, colores)
├── sw.js                Service worker: copia en caché para usarla sin internet
├── css/estilos.css      Diseño (primero celular)
├── js/logica.js         Fechas, rachas y validaciones, sin HTML
├── js/app.js            Interfaz, eventos e instalación
├── iconos/icono-192.png
├── iconos/icono-512.png
└── README.md
```

## Cómo ejecutarla en tu computador

Con doble clic en `index.html` la app funciona, pero **sin** modo offline ni instalación, porque el service worker exige `https` o `localhost`. Para probarla completa:

```bash
cd habitos-app
python -m http.server 8000
```

y abre http://localhost:8000 en el navegador.

## Despliegue

Igual que la web de gastos, en un repositorio llamado `habitos_app` (rutina completa en el documento de entrega, sección 3).

## Pruebas manuales

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Agregar un hábito vacío | Mensaje "Escribe el nombre del hábito." |
| 2 | Agregar "Agua" y luego "agua" | Mensaje de nombre repetido |
| 3 | Marcar un hábito | Círculo verde, progreso y racha suben |
| 4 | Desmarcarlo | Vuelve al estado anterior |
| 5 | Cerrar y volver a abrir | Los datos siguen ahí |
| 6 | Instalar en el celular | Aparece con ícono propio |
| 7 | Activar modo avión y abrir la app instalada | Abre igual |
| 8 | Eliminar un hábito | Pide confirmación y desaparece |
