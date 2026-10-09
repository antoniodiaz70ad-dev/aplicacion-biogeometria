# BioGeometría · reconstrucción

Aplicación de estudio de formas, reconstruida a partir del proyecto Bolt y los originales recuperados de Dropbox. El ZIP de rediseño de GPT se utilizó únicamente como contexto. Esta entrega es una nueva versión independiente.

## Uso inmediato

El ZIP de revisión entregado contiene **vista-previa.html**, una copia que incluye dibujos y páginas de cotejo y funciona sin conexión. El repositorio contiene el proyecto de desarrollo; para ejecutarlo utiliza los pasos siguientes. La copia autónoma se puede generar con `python3 scripts/make_preview.py` después de compilar.

## Desarrollo y Vercel

Requiere Node.js 22.12 o posterior (se verificó con Node.js 24.19).

```sh
npm ci
npm run dev
npm run build
npm run preview
```

En Vercel: proyecto Vite, comando de instalación `npm ci`, compilación `npm run build`, directorio de salida `dist`. Se incluye `vercel.json`. Vercel puede compilar el proyecto conectado al repositorio; el resultado del despliegue debe comprobarse por commit.

## Qué funciona

- Atlas de 246 recortes reales, búsqueda, grupos, favoritos y referencias visibles. La vista inicial muestra nueve correspondencias revisadas.
- Taller: dibujo limpio, recorte original, cuadrícula, ampliación y colores; trazado con ratón o pantalla táctil, deshacer y exportación de trazo PNG.
- Exportación SVG de la forma recuperada; impresión A4 con ancho elegido, límite de altura para evitar recortes y línea de calibración de 100 mm.
- Temporizador de observación de 1, 3 o 5 minutos, con pausa y reanudación.
- Cuaderno con notas, tiempo registrado y atención percibida; exportación e importación JSON con validación y combinación sin borrar las notas actuales.
- Comparación de cada recorte con su página del PDF; información de procedencia y límites de la revisión.

Las notas y los favoritos se guardan **en este navegador y dispositivo**. No hay cuenta, servidor, sincronización ni historial de pacientes. Exporta el cuaderno como respaldo y antes de cambiar de navegador. No se importan estadísticas ni diagnósticos inventados del proyecto anterior.

## Dibujos y revisión

La fuente del catálogo es **BioGeometry Signatures**, de Ibrahim Karim, PDF de **224 páginas**. Se recuperaron 246 PNG: 245 posibles firmas y una ilustración de instrumento. Las páginas del catálogo son ordinales del PDF, no necesariamente las páginas impresas.

Se cotejaron manualmente imagen y título de nueve recortes de las páginas PDF 89 y 90. Los otros 237 permanecen pendientes. Los títulos automáticos con correspondencia débil se presentan como recortes sin clasificar; la propuesta original queda en el catálogo para revisión. El reconocimiento automático sirve de ayuda editorial y nunca determina eficacia o recomendaciones de salud.

Los SVG representan el contorno de la tinta del escaneo, con fondo retirado y proporciones conservadas. No se inventaron trazos ni se rediseñó la firma. Se filtra ruido de componentes menores de seis píxeles; por eso la equivalencia se mide respecto a la máscara de tinta limpiada, no al escaneo íntegro. La vectorización no recupera detalle que el recorte original no contiene. Revisa la página documental antes de considerar cerrado cualquier dibujo.

Los nombres de órganos o condiciones reproducen títulos del libro. **Revisión documental no significa validación terapéutica.** Se eliminaron diagnósticos, porcentajes de mejora, geolocalización energética y predicciones de ML simuladas. El cuaderno registra experiencias sin atribuir causalidad.

## Estructura

`src/App.tsx` y `src/styles.css`: interfaz y herramientas. `src/figures.json`: catálogo editorial. `public/figures`: PNG recuperados y SVG. `public/source-pages`: 63 páginas de cotejo. `public/validation.json`: comprobaciones técnicas de recuperación. `docs/REVISION.md`: auditoría y pendientes. `scripts`: reconstrucción reproducible de imágenes, páginas y vista autónoma.

Los libros completos y ZIP originales permanecen en sus ubicaciones de origen. Este paquete contiene recortes y páginas de referencia para la revisión privada solicitada. Antes de distribuir públicamente estos materiales, define qué contenidos puedes publicar y sustituye los enlaces personales de Dropbox por las referencias que decidas ofrecer.

## Comprobaciones realizadas

La compilación de producción y TypeScript estricto pasan. Se verificaron la integridad y dimensiones de los 246 PNG, la estructura/proporción de los 246 SVG y las 63 páginas documentales. Las pruebas de navegador cubren búsqueda, favoritos, guardado y restauración del cuaderno, importación inválida y duplicada, temporizador, trazado/deshacer, PNG, SVG, impresión calibrada y protección para formas altas. Todas las pantallas caben en anchos de 320, 390, 768 y 1024 píxeles; también se revisó escritorio de 1440 píxeles. La vista autónoma abre y exporta SVG sin conexión. Detalle en `docs/comprobaciones.json`.

Para repetir la comprobación de recursos: `python3 scripts/check_assets.py`. Para regenerar la vista autónoma después de compilar: `python3 scripts/make_preview.py`.

## Mesa digital de Espacios

Plano rectangular con puntos editables, figuras cotejadas, registros antes/después y procedencia explícita. Péndulo con seguimiento opcional de marcador de color por cámara; procesamiento local, sin audio ni guardado de video. Las sesiones y trayectorias se respaldan en JSON. Consultar `docs/ESPACIOS.md` para funcionamiento, pruebas y límites. La cámara física permanece pendiente de prueba; el módulo no detecta BG3 ni certifica reparación energética.
