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

Las coordenadas permanecen en localStorage y se incluyen en el respaldo JSON. El visor integrado carga la cartografía de OpenStreetMap solo al pulsar «Mostrar mapa aquí», tras un aviso de transmisión de coordenadas y conexión. Permite desplazamiento, zoom, tres escalas y volver al marcador sin cambiar el registro. No se abre otra pestaña. Al cambiar coordenadas se cierra el visor y se requiere cargarlo de nuevo. Sin ubicación, ofrece un ejemplo público de la Torre Eiffel que no se guarda; las latitudes fuera de la proyección Mercator se conservan pero no se representan. El mapa requiere conexión y disponibilidad del proveedor; no hay solicitudes cartográficas automáticas. Se conservan respaldos v1 sin ubicación. Importaciones con coordenadas inválidas se rechazan sin reemplazar el estado. Solicitudes tardías se descartan al salir del módulo, ingresar coordenadas manuales o importar otro respaldo. La captura física en el teléfono del usuario queda pendiente. Referencia técnica: https://www.w3.org/TR/geolocation/ .
