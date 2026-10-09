# Revisión de recuperación · 9 de octubre de 2026

## Material localizado

Se inventariaron dos subcarpetas de Bio_Geometria en Dropbox: **10.237 archivos y 53 carpetas**. Los 10.043 archivos PNG incluyen recortes, copias y versiones; no representan 10.043 firmas diferentes. Se detectó además una aplicación Next.js con biblioteca, taller y estructura de autenticación/base de datos; no se ha migrado su servidor a esta aplicación.

Los dos ZIP de Bolt aportados son idénticos, SHA-256 `ae43cd02a4a8ed77e212990706325d5dff46040c7f8bfb7a49603268573b5afe`.

El ZIP de fuentes contiene 225 documentos Markdown: 62 con texto sustantivo y 163 referencias a imágenes sin los binarios correspondientes. Contiene transcripciones, textos de libros y elaboraciones propias. No se utilizó como demostración científica.

El ZIP `biogeometria-redisenada.zip` cambia cuatro archivos visuales y algunos elementos de configuración. Conserva el catálogo roto, las imágenes inválidas y funciones simuladas. Su propia nota indica que no había podido instalar ni compilar. Se trató exclusivamente como contexto.

## Fallos del proyecto anterior

- Cinco supuestas imágenes eran archivos de 29 bytes con un marcador de contenido binario; otras dos faltaban. Las rutas tampoco correspondían con las extensiones.
- Los identificadores del catálogo y los buscados por el motor diagnóstico no coincidían: no se obtenían recomendaciones reales.
- Las estadísticas de pacientes, sesiones y mejora eran constantes inventadas. Las predicciones ML y los cálculos energéticos de ubicación eran simulaciones.
- Varios apartados eran pantallas vacías. No había un servidor que respaldara las funciones clínicas aparentes.
- El PDF de firmas incluido en la copia antigua estaba truncado a 4 MiB. El recuperado de Dropbox abre correctamente: 6.379.914 bytes y 224 páginas.
- Los 246 recortes estaban atribuidos al libro equivocado. Proceden de **BioGeometry Signatures**, no de **Back to a Future for Mankind**.

## Fuente comprobada

PDF de BioGeometry Signatures: SHA-256 `657c331a226d25f24becbf06e34a406dcb53f3ae935f6fac986716233260d5b3`.

Se conservaron los SHA-256 individuales de los PNG en `public/catalogue.json`. Hay 147 coincidencias automáticas con solapamiento normalizado de al menos 0,7; esto no confirma sus títulos. Únicamente las nueve filas siguientes cuentan con cotejo manual de imagen y título:

| Recorte | Nombre mostrado | Página PDF |
|---|---|---:|
| page_89_seg_0 | Mano · 1 | 89 |
| page_89_seg_1 | Cuello y hombro · 1 | 89 |
| page_89_seg_2 | Mano · 2 | 89 |
| page_89_seg_3 | Hombro · 2 | 89 |
| page_89_seg_4 | Hombro · 1 | 89 |
| page_90_seg_0 | Codo · 1 | 90 |
| page_90_seg_1 | Codo · 2 | 90 |
| page_90_seg_2 | Antebrazo · 1 | 90 |
| page_90_seg_3 | Artritis · 1 | 90 |

El título original “Arthiritis” contiene esa errata en la fuente; se conserva en el campo documental. El recorte de la página 86 representa una tira eléctrica y no una firma individual.

## Qué significa mejorar el dibujo

Separar la tinta del fondo, conservar orientación y relación de aspecto, ofrecer comparación con el original y permitir exportación/impresión. No significa alterar la firma, inferir un recorrido no documentado ni inventar propiedades. El trazo de usuario se exporta por separado del dibujo documental.

La comprobación de solapamiento de los SVG con la máscara de tinta limpiada dio 1,0 en los 246 recortes. Es una comprobación interna del contorno rasterizado a la resolución original. No garantiza equivalencia del escaneo íntegro, lectura correcta del título, propiedades físicas de las curvas ni efecto terapéutico.

## Pendientes concretos

1. Cotejar editorialmente los 237 recortes restantes y corregir segmentaciones o títulos cuando sea necesario. Las imágenes extraídas pueden incluir elementos que no sean firmas individuales.
2. Elegir cuáles de los 62 textos sustantivos aportados se incorporarán como contenido propio, con atribución y revisión de afirmaciones.
3. Publicar en el proyecto `aplicacion-biogeometria` del equipo `leviathan1` en Vercel. El proyecto fue identificado; el acceso y la publicación siguen pendientes.
4. Decidir si se necesita cuenta y sincronización entre dispositivos. El cuaderno actual es local, con respaldo JSON.

No se ha realizado una validación clínica de BioGeometría. La entrega reconstruye una herramienta de observación, dibujo y documentación, sin prescripción ni diagnóstico automático.

## Taller práctico

El taller incluye instrucciones específicas para observar, comparar el original y dibujar. La impresión permite elegir A4 o Carta, muestra las dimensiones reales y ajusta el límite de altura a cada hoja. La hoja imprimible incluye espacio para fecha y observación, junto con una regla de 100 mm para comprobar la escala.

## Primera mejora de curvas · nueve variantes

Las nueve referencias cotejadas disponen de una variante opcional «Curvas». «Limpio» sigue mostrando el contorno anterior y «Original» conserva el escaneo. La superposición rosa permite comparar ambos contornos. La exportación SVG y la impresión utilizan la variante seleccionada; el modo Trazar conserva la guía documental anterior.

Se ajustaron los bordes a curvas Bézier cúbicas con movimiento máximo inferior a un píxel del recorte. Se comprobó el solapamiento de tinta contra el SVG anterior, renderizando ambos a cuatro veces la resolución. El solapamiento de tinta varía entre 87,18 % y 98,51 %; es sensible a cambios del borde de líneas finas y no debe interpretarse como porcentaje de fidelidad geométrica. El límite de desplazamiento del contorno es la comprobación geométrica independiente. La comparación de componentes y huecos excluye residuos menores de un píxel original de área. Se conservaron sin suavizar cinco contornos cuyo ajuste cambiaba esa estructura. Los valores y hashes están en `revision-curvas.json`.

Esto mejora la representación del borde; no recupera detalle ausente del escaneo ni sustituye un redibujo manual definitivo. Las variantes permanecen en revisión visual y no se les asigna una nueva validación documental o terapéutica.
