# Estudia USICAMM

Simulador de práctica para el examen de Admisión Docente USICAMM · Educación Inicial y Preescolar · Ciclo 2026-2027.

> ⚠️ **Disclaimer**: este es un simulador no oficial, no avalado por USICAMM ni por la SEP. Las 520 preguntas son ejercicios de práctica basados en la bibliografía oficial 2026-2027, no réplicas del examen real. Las respuestas son criterio del autor y pueden contener errores. **No garantiza aprobación.**

## Qué incluye

- **520 reactivos** organizados en 28 categorías cubriendo Plan 2022, Programa Sintético Fase 2 y Fase 3, marco normativo (Constitución, LGE, LGDNNA), acuerdos del DOF, fichero de cultura de paz, Vygotsky-Bodrova-Leong, Meece, Díaz-Barriga, Monetti-Molina, OCDE, Montaño Sánchez.
- **4 modos de estudio**: examen (estudio o simulacro cronometrado), flashcards con repetición intra-sesión, repaso por tema, glosario.
- **82 entradas de glosario** (LGE, LGDNNA, NEM, ZDP, PDA, etc.).
- **28 resúmenes por documento fuente** con ideas clave y errores comunes.
- **Plan de estudio sugerido** según tu progreso.
- **Funciona offline** (PWA instalable).
- **Datos locales** únicamente (localStorage) — sin servidor, sin telemetría, sin cuenta.

## Funcionar localmente

Requiere Python 3 (incluido en macOS y Linux por default).

```bash
./start.sh
```

Abre `http://localhost:8000/` en tu navegador. Para detener: `Ctrl+C`.

> No abras `index.html` directo desde el Finder. El navegador bloquea la carga de JSON y el service worker con `file://`.

## Acceso

La app tiene una pantalla de bienvenida con clave compartida. La clave se guarda como hash SHA-256 en `app.js` (constante `CLAVE_HASH`).

**Para cambiar la clave:**
1. Abre la app y entra a la consola del navegador (F12).
2. Ejecuta: `generarHash('mi-nueva-clave').then(h => console.log(h))`
3. Copia el hash resultante.
4. Reemplaza el valor de `CLAVE_HASH` en `app.js`.
5. Guarda y recarga.

## Atajos de teclado

**En examen:**
| Tecla | Acción |
|---|---|
| `1` `2` `3` o `A` `B` `C` | Seleccionar opción |
| `←` `→` | Navegar |
| `M` | Marcar dudosa |
| `Enter` | Avanzar |

**En flashcards:**
| Tecla | Acción |
|---|---|
| `Espacio` o `Enter` | Voltear / "La sabía" |
| `←` | Anterior / "No la sabía" |
| `→` | "La sabía" / Saltar |
| `S` | Saltar |
| `M` | Marcar |
| `Esc` | Salir |

## Validar el banco

```bash
python3 validador.py
```

Detecta:
- Schema y campos obligatorios.
- Distribución A/B/C balanceada.
- Sesgo de longitud de la opción correcta.
- Pistas léxicas.
- Distractores significativamente cortos.
- Cobertura de citas formales.

## Schema de pregunta

```json
{
  "id": 123,
  "fuente": "Plan de Estudio 2022",
  "categoria": "Plan 2022 (NEM)",
  "subcategoria": "Comunidad-territorio",
  "dimension": "escuela_transformacion",
  "tipo": "valoracion",
  "caso": "Texto del caso (puede ser null)",
  "pregunta": "Enunciado del reactivo",
  "opciones": ["Opción 0", "Opción 1", "Opción 2"],
  "respuesta": 1,
  "explicacion": "Por qué la opción correcta es la correcta y por qué las otras no.",
  "cita": "Fuente · sección"
}
```

## Estructura del proyecto

```
estudia-usicamm/
├── index.html           UI del simulador
├── app.js               Lógica
├── styles.css           Estilos
├── sw.js                Service worker (PWA)
├── manifest.json        Manifiesto PWA
├── preguntas.json       Banco de 520 reactivos
├── glosario.json        82 siglas y términos
├── resumenes.json       28 resúmenes por documento fuente
├── validador.py         Script de QA del banco
├── start.sh             Servidor local
├── README.md
└── LICENSE              MIT
```

## Despliegue en GitHub Pages

1. Crear repo en GitHub (público).
2. `git init` y commit inicial (revisa `.gitignore` primero).
3. Push.
4. En el repo: Settings → Pages → Deploy from branch → `main` / root.
5. URL pública: `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

## Privacidad

- Cero servidor, cero telemetría, cero cuentas.
- Tus datos (notas, progreso, exámenes guardados, reportes) viven en `localStorage` de tu navegador.
- Si limpias el navegador o usas otro dispositivo, empiezas de cero.

## Reset

Para borrar todo tu progreso: Dashboard → "Borrar todo mi progreso", o limpia el localStorage del sitio en preferencias del navegador.

## Reportar errores en preguntas

Botón **⚠️ Reportar** en cada pregunta. Los reportes se guardan localmente y puedes exportarlos como JSON desde el Dashboard.

## Licencia

MIT — ver [LICENSE](LICENSE).
