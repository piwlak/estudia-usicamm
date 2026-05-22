#!/usr/bin/env python3
"""
Validador de calidad del banco de preguntas USICAMM.

Detecta posibles sesgos y problemas que el examinado podría explotar
sin saber el contenido:

  1. Opción correcta significativamente más larga que las distractoras.
  2. Distribución desbalanceada de la respuesta correcta (A/B/C).
  3. Repetición de palabras clave entre la pregunta y SOLO la opción correcta.
  4. Distractores demasiado cortos en comparación con la correcta.
  5. Schema incompleto (campos faltantes).
  6. Citas vacías o sospechosas.
  7. Distribución por categoría / dimensión / tipo / fuente.

Uso:  python3 validador.py
"""

import json
import re
import sys
from collections import Counter, defaultdict
from statistics import mean, stdev

ARCHIVO = 'preguntas.json'
CAMPOS_OBLIGATORIOS = ['id', 'fuente', 'categoria', 'dimension', 'tipo',
                       'pregunta', 'opciones', 'respuesta', 'explicacion']
PALABRAS_VACIAS = {
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
    'a', 'y', 'o', 'u', 'e', 'que', 'en', 'con', 'por', 'para', 'sin', 'sobre',
    'es', 'son', 'ser', 'estar', 'haber', 'se', 'su', 'sus', 'lo', 'le', 'les',
    'no', 'sí', 'mas', 'pero', 'como', 'cuando', 'donde', 'cual', 'cuales',
    'qué', 'cómo', 'cuándo', 'dónde', 'cuál', 'según', 'desde', 'hasta',
    'también', 'entre', 'esto', 'esta', 'estos', 'estas', 'ese', 'esa',
    'eso', 'esos', 'esas', 'aquel', 'aquella', 'aquello'
}


def palabras_clave(texto):
    """Devuelve las palabras significativas de un texto (sin stopwords)."""
    tokens = re.findall(r'\b[a-záéíóúñü]{4,}\b', texto.lower())
    return {t for t in tokens if t not in PALABRAS_VACIAS}


def main():
    with open(ARCHIVO, encoding='utf-8') as f:
        qs = json.load(f)

    print(f'Validando {len(qs)} preguntas en {ARCHIVO}…\n')
    print('=' * 70)

    problemas = []
    advertencias = []

    # 1. Schema completo
    print('\n📋 Schema y campos obligatorios')
    for q in qs:
        for campo in CAMPOS_OBLIGATORIOS:
            if campo not in q:
                problemas.append(f"Q{q.get('id', '?')}: falta campo '{campo}'")
        opciones = q.get('opciones', [])
        if len(opciones) != 3:
            problemas.append(f"Q{q['id']}: tiene {len(opciones)} opciones (deberían ser 3)")
        if 'respuesta' in q and not (0 <= q['respuesta'] < len(opciones)):
            problemas.append(f"Q{q['id']}: respuesta={q['respuesta']} fuera de rango")
    if not problemas:
        print('  ✓ Todas las preguntas cumplen el schema.')

    # 2. Distribución de respuesta correcta
    print('\n🎯 Distribución de la respuesta correcta')
    dist = Counter(q['respuesta'] for q in qs)
    total = len(qs)
    for k in sorted(dist):
        letra = chr(65 + k)
        pct = 100 * dist[k] / total
        marca = '⚠️ ' if pct > 40 or pct < 25 else '✓ '
        print(f'  {marca}{letra}: {dist[k]} ({pct:.1f}%)')
        if pct > 40 or pct < 25:
            advertencias.append(f'Distribución de respuesta {letra} está en {pct:.1f}% (ideal: 30-37%)')

    # 3. Longitud de opciones
    print('\n📏 Longitud de la opción correcta vs distractoras')
    casos_correcta_larga = []
    for q in qs:
        longs = [len(o) for o in q['opciones']]
        correcta = longs[q['respuesta']]
        otras = [longs[i] for i in range(len(longs)) if i != q['respuesta']]
        prom_otras = mean(otras) if otras else 0
        # Sospechoso si la correcta es >40% más larga que el promedio de otras
        if otras and correcta > prom_otras * 1.4 and (correcta - prom_otras) > 30:
            casos_correcta_larga.append((q['id'], correcta, round(prom_otras), q.get('categoria', '')))
    pct_largas = 100 * len(casos_correcta_larga) / total
    print(f'  Preguntas donde la correcta es >40% más larga: {len(casos_correcta_larga)} ({pct_largas:.1f}%)')
    if pct_largas > 20:
        advertencias.append(f'{pct_largas:.1f}% de las preguntas tienen correcta sospechosamente larga (>20% es alto)')
    for cid, c, p, cat in casos_correcta_larga[:5]:
        print(f'    - Q{cid} ({cat}): correcta={c}, prom otras={p}')
    if len(casos_correcta_larga) > 5:
        print(f'    … {len(casos_correcta_larga) - 5} más')

    # 4. Repetición léxica entre pregunta y única correcta
    print('\n🔍 Pistas léxicas (palabras clave compartidas con la correcta)')
    casos_pista = []
    for q in qs:
        pkw = palabras_clave(q['pregunta'] + ' ' + (q.get('caso') or ''))
        if not pkw:
            continue
        kw_por_opcion = [palabras_clave(o) for o in q['opciones']]
        # Palabras de la pregunta presentes solo en la correcta y no en otras
        kw_correcta = kw_por_opcion[q['respuesta']]
        kw_otras = set().union(*[kw_por_opcion[i] for i in range(len(kw_por_opcion)) if i != q['respuesta']])
        compartidas_solo = (pkw & kw_correcta) - kw_otras
        if len(compartidas_solo) >= 2:
            casos_pista.append((q['id'], list(compartidas_solo)[:5], q.get('categoria', '')))
    pct_pistas = 100 * len(casos_pista) / total
    print(f'  Preguntas con ≥2 palabras clave compartidas solo con la correcta: {len(casos_pista)} ({pct_pistas:.1f}%)')
    if pct_pistas > 15:
        advertencias.append(f'{pct_pistas:.1f}% de las preguntas pueden dar pistas léxicas')
    for cid, kws, cat in casos_pista[:5]:
        print(f'    - Q{cid} ({cat}): {", ".join(kws)}')

    # 5. Distractores muy cortos
    print('\n🧪 Distractores significativamente cortos')
    distractor_corto = []
    for q in qs:
        longs = [len(o) for o in q['opciones']]
        correcta = longs[q['respuesta']]
        otras = [longs[i] for i in range(len(longs)) if i != q['respuesta']]
        if otras and min(otras) * 2 < correcta and correcta > 80:
            distractor_corto.append(q['id'])
    print(f'  Preguntas con un distractor que mide menos de la mitad que la correcta: {len(distractor_corto)}')

    # 6. Citas vacías
    print('\n📚 Citas formales')
    sin_cita = [q['id'] for q in qs if not q.get('cita')]
    if sin_cita:
        problemas.append(f'{len(sin_cita)} preguntas sin cita formal')
        print(f'  ⚠️ {len(sin_cita)} preguntas sin cita: {sin_cita[:10]}')
    else:
        print('  ✓ Todas las preguntas tienen cita formal.')

    # 7. Distribución general
    print('\n📊 Distribución general')
    print('  Tipos:')
    for t, n in Counter(q['tipo'] for q in qs).most_common():
        print(f'    {t}: {n}')
    print('  Dimensiones:')
    for d, n in Counter(q['dimension'] for q in qs).most_common():
        print(f'    {d}: {n}')
    print(f'  Categorías: {len(set(q["categoria"] for q in qs))}')
    print(f'  Fuentes: {len(set(q["fuente"] for q in qs))}')

    # 8. IDs duplicados
    ids_dup = [k for k, v in Counter(q['id'] for q in qs).items() if v > 1]
    if ids_dup:
        problemas.append(f'IDs duplicados: {ids_dup}')

    # Resumen
    print('\n' + '=' * 70)
    print(f'\n📌 Resumen')
    print(f'  Total de preguntas: {total}')
    print(f'  Problemas (bloqueantes): {len(problemas)}')
    print(f'  Advertencias: {len(advertencias)}')

    if problemas:
        print('\n❌ Problemas:')
        for p in problemas:
            print(f'  - {p}')
    if advertencias:
        print('\n⚠️ Advertencias:')
        for a in advertencias:
            print(f'  - {a}')
    if not problemas and not advertencias:
        print('\n✅ Banco de preguntas en buen estado.')

    return 0 if not problemas else 1


if __name__ == '__main__':
    sys.exit(main())
