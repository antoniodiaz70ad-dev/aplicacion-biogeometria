# Mesa digital de investigación · Espacios

Primera versión funcional, con datos locales y respaldo JSON. La tabla exacta vista por el usuario sigue sin identificar. Este módulo no reproduce una tabla histórica ni un emisor energético.

## Recorrido

1. Abrir Espacios y definir nombre, ancho, fondo y orientación norte del lugar.
2. Tocar el plano o pulsar Añadir punto. Editar nombre y posición porcentual con controles accesibles.
3. Elegir una de las nueve figuras cotejadas y la fase antes/después.
4. Indicar procedencia: observación personal, péndulo o instrumento con valor y unidad.
5. Documentar instrumento/calibración, condiciones, intervención, orientación y resultado. Guardar sesión.
6. Comparar registros del mismo punto, figura y procedencia. Una diferencia numérica solo se presenta cuando coinciden instrumento y unidad; no acredita causalidad.
7. Exportar un respaldo. La importación válida sustituye el espacio con confirmación; archivos inválidos conservan los datos. Eliminar un punto pide confirmación y elimina sus sesiones asociadas.

Las dimensiones mantienen el aspecto del rectángulo. Norte se introduce manualmente; no se accede a ubicación. Cambiar medidas conserva las coordenadas porcentuales de los puntos. No hay pacientes, diagnósticos ni lecturas de ejemplo precargadas.

## Seguimiento del péndulo

Requiere cámara compatible en HTTPS o localhost, permiso explícito del usuario y un marcador de color contrastado. La cámara fija observa desde una posición consistente, con fondo uniforme y buena iluminación.

Activar cámara, tocar el marcador (o centrarlo y elegir el color central), comprobar el círculo rosa y registrar hasta 20 segundos. El algoritmo busca regiones conectadas de color y rechaza dos regiones similares de tamaño comparable. Si pierde el marcador, esa muestra no se registra. La duración y trayectoria deben revisarse antes de guardar.

La trayectoria emplea una imagen de 320 × 240 píxeles. Se guardan posiciones y tiempos; no se guardan imágenes, audio o video ni se transmiten a un servidor. El sentido del giro corresponde a la imagen; depende de orientación y reflejo de cámara. No existe conversión a BG3, campos electromagnéticos, propiedades del lugar o eficacia de una figura.

Cambiar punto, figura, fase o procedencia, o salir de Espacios, desmonta el componente y detiene la cámara. Apagar cámara durante una captura descarta esa captura. Guardar una sesión incorpora la trayectoria terminada y limpia la captura pendiente.

## Comprobaciones

Compilación TypeScript/Vite; algoritmo con marcadores sintéticos (incluido rechazo de dos regiones), giros horario/antihorario y oscilación. Flujo de navegador con video sintético: captura, guardado de trayectoria, apagado al navegar, datos locales, exportación, rechazo de importación inválida, recuperación al recargar y pantallas de 320, 390, 768, 1024 y 1440 píxeles. Eliminación del punto con cancelación y aceptación.

No se ha probado todavía una cámara física ni el seguimiento con un péndulo real. No se ha desplegado esta versión.

## Ubicación geográfica

Captura puntual mediante la API de geolocalización del navegador, iniciada exclusivamente por el usuario. Se guardan latitud, longitud, precisión estimada, fecha y procedencia dentro del inmueble; el plano interior conserva coordenadas porcentuales y norte manual. La ubicación del navegador puede proceder de GPS, redes u otros proveedores. No se deducen posiciones interiores, BG3 ni anomalías. También admite coordenadas manuales, sin precisión declarada.

Las coordenadas permanecen en localStorage y se incluyen en el respaldo JSON. El visor 2D integrado (Leaflet 1.9.4, sin WebGL) carga la cartografía de OpenStreetMap solo al pulsar «Mostrar mapa aquí», tras un aviso de transmisión de coordenadas y conexión. Permite desplazamiento, zoom, tres escalas y volver al marcador sin cambiar el registro. No se abre otra pestaña. Al cambiar coordenadas se cierra el visor y se requiere cargarlo de nuevo. Sin ubicación, ofrece un ejemplo público de la Torre Eiffel que no se guarda; las latitudes fuera de la proyección Mercator se conservan pero no se representan. El círculo, cuando existe precisión del dispositivo, usa ese radio estimado en metros; no representa energía ni anomalías. No se genera círculo para coordenadas manuales. El mapa requiere conexión y disponibilidad del proveedor; no hay solicitudes cartográficas automáticas. Se conservan respaldos v1 sin ubicación. Importaciones con coordenadas inválidas se rechazan sin reemplazar el estado. Solicitudes tardías se descartan al salir del módulo, ingresar coordenadas manuales o importar otro respaldo. La captura física en el teléfono del usuario queda pendiente. Referencia técnica: https://www.w3.org/TR/geolocation/ .


## Protocolo guiado del estado inicial — lugares-v1

Primera entrega del flujo: preparación, selección del punto interior y tres observaciones del operador. No exige una figura del catálogo. Distingue BG16, horizontal, vertical y neutro/IKUP; muestra referencias específicas y no precarga una longitud universal. Registra operador, modelo, longitud utilizada, ajustes, referencias y controles, comprobación, condiciones y dispositivos existentes. Las tres repeticiones son un control propuesto por la plataforma.

La comprobación inconsistente o no realizada permite guardar movimientos, pero fuerza todas las interpretaciones a «Indeterminado». Ningún sentido del giro produce una clasificación automática. Cambiar instrumento limpia sus ajustes y las repeticiones; cambiar punto limpia las repeticiones. Una referencia o ajuste editado exige volver a indicar la comprobación.

El paso interior admite selección, creación y edición de puntos, con distancias X/Y en metros desde la esquina superior izquierda. El registro conserva una copia de nombre, posición, dimensiones, norte y ubicación geográfica disponible al guardarse. Editar el plano o retirar después la ubicación actual no modifica esa copia histórica; queda incluida en el JSON. No se generan cuadrículas energéticas a partir del GPS.

Los registros se añaden como `baselines` opcional dentro de los respaldos v1 existentes. Los respaldos anteriores siguen siendo válidos. La validación rechaza registros incompletos, referencias a puntos inexistentes, longitudes inválidas, movimientos no admitidos, cualidades incompatibles con el instrumento e interpretaciones determinadas cuando falla la comprobación. Borrar un punto elimina también sus registros iniciales, tras confirmación. Los formularios aún no guardados se pierden al salir; los registros guardados permanecen en ese navegador, no se sincronizan entre dispositivos.

### Verificación

`npm run build` verifica TypeScript y construcción. `tests/baseline-flow.cjs` recorre preparación, BG16 sin longitud obligatoria, tres repeticiones, fallo indeterminado, conservación del plano histórico, recarga, exportación/importación, rechazo de respaldo inconsistente, compatibilidad v1, eliminación vinculada y anchos 320/390/768/1024/1440. Para ejecutarlo, instalar Playwright con Chromium y usar `node tests/baseline-flow.cjs` tras el build. Admite `PLAYWRIGHT_MODULE`, `CHROMIUM_MODULE` o `CHROMIUM_EXECUTABLE` para entornos con dependencias externas. Comprobado también el flujo anterior de sesiones, cámara con vídeo sintético y detención de la captura; esto no prueba una cámara física ni valida BG3.


## Recorrido único y varillas de cobre

Espacios abre en Lugar → Instrumento → Puntos → Observaciones → Revisión. Nombre, dimensiones y orientación manual se configuran al inicio; GPS y mapa quedan en un desplegable opcional. Las sesiones anteriores, figuras, comparación y cámara siguen disponibles en «Herramientas adicionales», cerrado inicialmente. La captura sólo se monta cuando ese bloque está abierto; cerrarlo detiene la captura por desmontaje.

«Varillas de cobre» guarda respuesta propia, sin longitud de cuerda ni clasificación BG3: cruce, apertura, sin cambio o indeterminado. Cada repetición exige describir el recorrido realmente realizado. Estos controles documentan observaciones radiestésicas; no confirman cruces energéticos, agua, fallas ni una figura curativa. La validación rechaza movimientos de péndulo en registros de varillas, recorridos ausentes y una cualidad incompatible. Los registros anteriores siguen siendo válidos.

La revisión previa muestra datos del lugar, instrumento, ajustes, comprobación y tres respuestas. Permite corregir antes de guardar; guardar añade un único registro y muestra confirmación. Después se puede observar otro punto o cambiar instrumento. Editar coordenadas, dimensiones u orientación limpia las observaciones aún no guardadas. El botón «Aún no hice la comprobación» declara la ausencia de controles y obliga a interpretación indeterminada; no simula una calibración. Eliminar un punto está también disponible en el paso Puntos y conserva la confirmación y eliminación vinculada.

La prueba `tests/baseline-flow.cjs` se actualizó para cubrir el recorrido único, revisión/corrección, varillas y trayectorias obligatorias, compatibilidad de respaldos y adaptación en cinco anchos. Las instrucciones de calibración del péndulo conservan sus fuentes previas; las indicaciones para varillas se identifican como propuesta de registro de la plataforma.
