# Guía documental y asistente · 12 octubre 2026

## Resultado documental

Se recuperaron los PDF originales de Back to a Future for Mankind y libro karim1 desde Dropbox. El segundo es un fragmento fotografiado de **Hidden Reality: The BioGeometry Physics of Quality**, identificable en el encabezado visible de la página PDF 8 (páginas impresas 82–83). No es Secrets of Sacred Design. Su edición no puede confirmarse sin portada/página legal.

| Documento | Páginas del archivo PDF | Estado |
|---|---:|---|
| BioGeometry Signatures | 224 | Extracción por página; revisión de secciones prácticas y catálogo |
| Back to a Future for Mankind | 1.015 | Extracción por página; lectura selectiva de instrumentos, cuadrículas y glosario |
| Hidden Reality, fragmento llamado libro karim1 | 43 | Fotografías de dobles páginas; OCR deteriorado; identidad comprobada por encabezado |
| BioGeometry BioSignatures Emitter | 2 | Instrucciones y composición visual |
| The BioGeometry Horizontal & Vertical Pendulum Set, ©2015 | 29 | Manual oficial; revisión de calibración y observación de lugares |

Se indexa el archivo completo disponible de cada documento. Esto no equivale a una lectura editorial completa de todos los libros. La paginación digital de Back to a Future es distinta de la edición impresa. El fragmento de Hidden Reality empieza en un texto ya iniciado y termina con una frase incompleta; no permite afirmar cobertura de todo el libro.

## Base privada

`scripts/index_source_documents.py` extrae cada página con su ordinal PDF, conserva el texto original, normaliza espacios y divide fragmentos sin cruzar páginas. Registra hash de archivo, cobertura y revisión pendiente. Rechaza guardar el corpus dentro del repositorio para evitar incluir textos íntegros en el frontend o en recursos públicos.

Las figuras deben seguir usando el catálogo cotejado y sus escaneos; los 163 marcadores `.png.md` del ZIP no contienen dibujos. Las transcripciones sin grabación verificada y los resúmenes derivados quedan fuera de instrucciones operativas.

Las fichas de `guide-knowledge.json` son paráfrasis revisadas con fuentes y páginas. La confianza documental describe la correspondencia con el texto, no la eficacia científica de sus afirmaciones.

## Rutas del asistente

- **Aprender:** el libro Signatures distingue rutas práctica, conceptual y espiritual (PDF 9). Usar esa elección para ajustar profundidad y conservar la atribución al autor.
- **Espacios:** identificar instrumento/modelo y accesorios → definir lugar y referencia de brújula → documentar preparación → registrar punto y movimiento bruto → revisar consistencia → documentar intervención elegida por el operador → comparar bajo condiciones registradas.
- **Emisor:** explicar fondo/foto/firmas → elegir manualmente referencias del catálogo → colocar foto → añadir/mover/retirar figuras → comprobar solapamientos → preparar impresión → consultar mantenimiento de la fuente elegida.

En cada etapa la respuesta debe incluir: siguiente acción, explicación, dato faltante, fuente y límite. La guía propone registros repetidos como control de documentación, no como procedimiento de Karim si el texto no lo especifica.

## Decisiones verificadas

1. Manual, PDF 19: el péndulo **vertical del juego descrito** usa como referencia 7 cm desde el cuerpo, no desde el tornillo, y un cotejo de colores. No aplicar a cualquier péndulo vertical.
2. Manual, PDF 16–17: el horizontal usa otra preparación; las comprobaciones de O, I, UV y −G son separadas. No trasladar al vertical ni a las varillas.
3. FAQ oficial: BG16 e IKUP tienen geometrías y procedimientos distintos; la formación de uso no se sustituye por una cuerda universal.
4. Manual, PDF 20: la verificación propuesta de corrección separa la comprobación vertical de V−G de la horizontal de BG3. Tener sólo el péndulo vertical no permite declarar completado todo el procedimiento del juego.
5. Manual, PDF 20: los accesorios amarillo/rojo unidos al péndulo no son las varillas de cobre del operador. La plataforma debe preguntar por accesorios antes de describir ajustes de cuadrículas.
6. Manual, PDF 23: el registro recomendado incluye lugar, fecha, hora, relación con norte, instrumento y calibración. Sus comentarios sobre tablas no validan una tabla pendular genérica ni permiten identificar la de Kain sin fuente.
7. Signatures, PDF 194–195 y emisor PDF 1: la foto central y las firmas junto a ella corresponden al recorrido descrito por la fuente. No se documenta una posición obligatoria de cada figura sobre órganos de la foto.
8. Signatures, PDF 78 y 188–189: practicar inicio, dirección y continuidad; la flecha es guía, no parte del trazo. La vectorización no reconstruye automáticamente el orden de cruces.
9. Signatures, PDF 185: Clearing Body Earth Radiation se describe como uso temporal personal; no debe presentarse como corrección permanente de la casa.
10. El PDF del emisor pide quitar polvo diariamente; otros textos citados previamente proponen otro mantenimiento. Mostrar la fuente y versión elegida, sin mezclarlas como una instrucción universal.

## Requisitos antes de activar generación AI

- Ejecutar recuperación y generación en servidor. Nunca enviar libros íntegros, credenciales ni fotografías desde el cliente a un proveedor por defecto.
- Filtrar por documento/modelo/contexto y revisión. Los fragmentos extraídos pero no revisados no pueden sostener ajustes operativos automáticos.
- Validar que cada cita generada corresponde a un identificador recuperado y una página real; la existencia de la página no basta: el pasaje debe apoyar la afirmación.
- No convertir GPS, brújula, cámara, varillas o un giro en sensor objetivo de BG3, diagnóstico, ausencia de radón, seguridad eléctrica o curación.
- No seleccionar una firma por enfermedad ni emitir porcentajes de reparación. La consulta médica se distingue del estudio documental.
- El asistente lee el estado mínimo de la etapa; cambios en diseños/registros necesitan una acción explícita del usuario y opción de deshacer.
- Configurar proveedor, autenticación, límite de peticiones y presupuesto antes de exponer el endpoint; si no hay configuración, informar que la guía documental está disponible y que la conversación AI no está activada.

## Evaluación mínima

Preguntas comprobadas: ubicación de foto, retirar figuras (función del editor), flecha de inicio, longitud de referencia para el modelo vertical del manual, diferencia entre vertical/horizontal/BG16, campos de registro recomendados. Preguntas sin soporte: curar una enfermedad, medir BG3 con GPS, elegir figura por un giro, dimensión terapéutica de una impresión, identificar edición de Hidden Reality sin portada. Debe responder con la referencia correcta o abstenerse con una explicación concreta.

La extracción, fichas y especificación están preparadas. No se ha integrado ni desplegado todavía un modelo AI conversacional.

## Fuentes web cotejadas

- https://www.biogeometry.ca/biogeometry-faq
- https://www.biogeometry.ca/_files/ugd/35c39f_705ecd0126124ee1937ab50c560a094a.pdf
- https://biogeometryeurope.com/product/the-biogeometry-physics-of-quality-dr-ibrahim-karim/

Las afirmaciones energéticas se registran como planteamientos de BioGeometry; el cotejo documental no constituye validación clínica o física.
