# Investigación: Formato real de los reactivos USICAMM (ADEB 2026-2027)

Documento de referencia para diseñar el banco de preguntas del simulador.
Base: análisis de las 4 imágenes en `examples/` + guías oficiales USICAMM-SEP publicadas + características conocidas del proceso ADEB.

## 1. Contexto del examen

- **Nombre oficial**: Valoración de Conocimientos y Aptitudes — Admisión a Educación Básica (ADEB).
- **Operador**: Unidad del Sistema para la Carrera de las Maestras y los Maestros (USICAMM/SEP).
- **Modalidad analizada**: Educación Inicial / Preescolar.
- **Ciclo**: 2026-2027.
- **Condiciones**: examen en línea, opción múltiple, una sola respuesta correcta por reactivo.

## 2. Tipologías de reactivos

USICAMM clasifica los reactivos en estas tipologías canónicas:

### 2.1 Cuestionamiento directo
Una pregunta directa (interrogativa o instrucción imperativa) con 3 opciones de respuesta.
- Ejemplo de IMG-WA0008: *"¿Cuál es la situación escolar que promueve la democracia, no solo como un régimen político, sino como una forma de vida?"* + 3 opciones.

### 2.2 Caso situacional con identificación
Se presenta un caso breve del aula / CTE / familia, y se pide identificar un concepto, fin, principio o procedimiento aplicable.
- Patrón: *"[caso]. Identifique [el fin / el principio / la noción / el concepto] al que se hace referencia."*
- Ejemplo IMG-WA0009: campaña de concientización con valores → "Identifique el fin de la educación al que se hace referencia."

### 2.3 Valoración / juicio profesional
Caso descriptivo + pregunta sobre cuál valoración o interpretación es la más consistente / correcta / pertinente con el documento o teoría.
- Ejemplo IMG-WA0026: caso de reuniones docentes que solo distribuyen tareas → "¿Cuál valoración es más consistente con el planteamiento del documento?"

### 2.4 Completamiento de enunciados
Enunciado con uno o más espacios en blanco; las opciones contienen las palabras/frases que completan correctamente.

### 2.5 Ordenamiento
Lista de pasos / etapas / elementos que deben colocarse en una secuencia lógica.
Las opciones presentan distintos órdenes (1-3-2-4, 2-1-4-3, etc.).

### 2.6 Multireactivo
Un estímulo común (caso largo, fragmento de texto, registro de observación) seguido de 2 a 4 preguntas que se responden a partir de ese mismo estímulo.

## 3. Reglas de formato (confirmadas en imágenes)

| Aspecto | Valor |
|---|---|
| Opciones por reactivo | **3** (A, B, C) |
| Una sola respuesta correcta | Sí |
| Estructura del reactivo oficial | Base + Opciones + Respuesta correcta + Argumentación |
| Cita de fuente al final de la argumentación | Sí (ej. "LGE. Reforma del 7 de junio de 2024…") |

## 4. Características de los distractores en los reactivos reales

Los distractores **NO son absurdos**. Reflejan errores conceptuales típicos de un docente:

1. **Confusión entre teorías**: una opción Vygotskiana correcta vs. una piagetiana/conductista que parece razonable pero corresponde a otra tradición.
2. **Visión parcial**: una opción que recoge solo una parte del concepto y omite el resto (ej. "manipulación de objetos" sin "mediación social" en Vygotsky).
3. **Práctica desactualizada**: una opción que reflejaba un enfoque anterior pero ya no corresponde a la NEM (ej. lo "memorístico", lo "estandarizado", la "selectividad").
4. **Sobre-extensión / sobre-restricción**: una opción demasiado amplia (incluye lo que no aplica) o demasiado estrecha (deja fuera elementos clave).
5. **Mezcla correcta + error sutil**: la opción describe parcialmente lo correcto pero introduce un matiz incorrecto.

## 5. Patrones lingüísticos

### Verbos de instrucción frecuentes (en el cuerpo del reactivo)
- *Identifique…*
- *¿Cuál es…?* / *¿Cuáles son…?*
- *¿Qué corresponde a…?*
- *¿Cómo debe proceder…?*
- *Conforme a / De acuerdo con / Según [autor o documento]…*
- *Seleccione la opción que…*

### Lenguaje de los casos
- Tercera persona, registro formal-pedagógico.
- Nombres ficticios pero realistas ("la maestra Lucía", "el colectivo docente", "Tania de 4 años").
- Contextos del sistema educativo mexicano: CTE, NEM, Plan 2022, programa analítico, fases, comunidad escolar.

### Errores a evitar en la redacción
- **Pistas sintácticas**: la opción correcta suele ser sintácticamente más completa o larga → los reactivos reales mantienen longitud y registro similares en las 3 opciones.
- **Repetición léxica**: si la pregunta menciona "andamiaje" y solo una opción usa la palabra, eso es una pista.
- **Negaciones dobles** o conectores ambiguos.

## 6. Áreas / dimensiones del perfil docente USICAMM

El examen evalúa según el perfil profesional docente publicado por USICAMM. Las dimensiones (relevantes para etiquetar nuestras preguntas) son:

1. **Una maestra/maestro que se asume como agente formativo**: ética, marcos normativos (artículo 3°, LGE, LGDNNA), perfil profesional, NEM como horizonte de sentido.
2. **Una maestra/maestro que conoce a sus alumnos**: desarrollo infantil (Vygotsky, Meece, Bodrova-Leong), diversidad, inclusión, derechos de la niñez, bienestar emocional.
3. **Una maestra/maestro con pensamiento didáctico**: Plan 2022, programa sintético, programa analítico, planeación didáctica (Monetti), evaluación formativa (Díaz Barriga), aprendizaje (OCDE).
4. **Una maestra/maestro que reconoce la escuela como espacio de transformación**: CTE, mejora continua, comunidad de aprendizaje, familias y comunidad, vida saludable, cultura de paz, entornos seguros, acoso escolar, violencia sexual.

## 7. Hallazgos del banco anterior (preguntas.json) que vamos a corregir

| Hallazgo | Acción |
|---|---|
| 4 opciones (A-D) en lugar de 3 | Migrar todo a 3 opciones (A, B, C). |
| 84% de las respuestas correctas en índice 0 | Distribución balanceada (~33% por índice). |
| Opción correcta más larga / completa que las distractoras | Igualar longitud y registro de las 3 opciones. |
| Distractores absurdos (memorización para PISA, jerarquía meritocrática) | Distractores plausibles que reflejen errores conceptuales típicos. |
| Una sola tipología (caso + pregunta) | Diversificar: 40% directo, 30% caso, 15% valoración, 10% completamiento, 5% ordenamiento. |
| Casos siempre con educadora/directora como protagonista | Variar protagonistas (niños, familias, CTE, situaciones de aula reales). |
| Explicaciones sin cita formal de fuente | Cada explicación termina con cita formal puntual (artículo, página, autor/año). |
| Cobertura: solo fuentes 1-5 (5 de 36) | Cubrir las 28 fuentes relevantes (excluyendo "Fase 1": 18, 19, 21, 22, 25, 35). |
| Sin etiqueta de tipología ni dimensión | Schema nuevo con `tipo` y `dimension` para análisis y filtrado. |

## 8. Schema nuevo del JSON

```jsonc
{
  "id": 1,                          // entero único
  "fuente": "01",                   // número del PDF en context.md (string 2 dígitos)
  "categoria": "Vygotsky y desarrollo infantil",
  "dimension": "conoce_alumnos",    // ver §6: agente_formativo | conoce_alumnos | pensamiento_didactico | escuela_transformacion
  "tipo": "caso",                   // directo | caso | valoracion | completamiento | ordenamiento
  "caso": "...",                    // null si tipo=directo
  "pregunta": "...",                // base del reactivo
  "opciones": ["A", "B", "C"],      // siempre exactamente 3
  "respuesta": 0,                   // índice 0-2
  "explicacion": "...",             // argumentación pedagógica
  "cita": "Bodrova y Leong (2004), pp. 8-14."  // referencia bibliográfica formal corta
}
```

## 9. Fuentes a procesar (28 de 36)

Excluidas (Fase 1 según context.md):
- 18 Continuidad de los cuidados amorosos. Fase 1
- 19 Cuidarme para aprender a cuidarte. Fase 1
- 21 La importancia de una planeación integral y narrativa. Fase 1
- 22 Observar desde la sensibilidad 0-3 años. Fase 1
- 25 Prácticas de educación y cuidado. Fase 1
- 35 Programa sintético de la Fase 1

Sin texto extraíble (PDFs escaneados, requieren OCR o consulta del texto legal):
- 5 Acuerdo alimentos saludables (DOF 2024)
- 13 Acuerdo 14/12/23 protocolo de acoso escolar
- 16 Acuerdo 05/04/24 lineamientos CTE
- 29 Acuerdo 17/05/25 violencia sexual

Para los Acuerdos del DOF se usará el texto público de la versión oficial.

## 10. Distribución objetivo del nuevo banco

Meta: **300 preguntas finales** distribuidas para cubrir el examen real.

| Bloque | Fuentes | Preguntas objetivo |
|---|---|---|
| Marco normativo y NEM | 2, 3, 4, 32 | ~50 |
| Plan 2022 / Programas sintéticos / analítico | 23, 26, 33, 34, 36 | ~50 |
| Desarrollo infantil y aprendizaje | 1, 6, 9 | ~40 |
| Planeación y evaluación | 7, 24, 33, 34 | ~30 |
| CTE y mejora continua | 16, 20, 30 | ~25 |
| Convivencia, paz y acoso escolar | 11, 12, 13, 14, 15, 27, 29 | ~50 |
| Familias y comunidad | 8 | ~15 |
| Bienestar emocional | 17 | ~15 |
| Vida saludable | 5, 31 | ~15 |
| Otros (multireactivos integradores) | varios | ~10 |
