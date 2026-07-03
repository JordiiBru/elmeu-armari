# Plan — Rediseñar la vista de combinaciones (`OutfitBottomSheet` + `OutfitGroupCard`)

Autor del plan: Cosmo. Ejecutor: otro modelo. Idioma UI: catalán (mantener).
Rama base: `main`. Rama de trabajo sugerida: `feature/cosmo-outfit-ux-redesign`.

## 1. Contexto y estado actual

Flujo actual (leer antes de tocar nada):
- `src/components/OutfitBuilder.tsx` — selector de temporada + grid de prendas. Al tocar una prenda abre el bottom sheet.
- `src/components/OutfitBottomSheet.tsx` — cabecera con la prenda elegida y lista paginada (10) de `OutfitGroupCard`.
- `src/components/OutfitCard.tsx` (`OutfitGroupCard`) — cada tarjeta muestra:
  1. Los círculos de las prendas que forman la combinación (avatar + `CATEGORY_LABELS`).
  2. Debajo, **todas** las paletas Sanzo Wada que casan con esa combinación, cada una en su fila con swatches pequeños, nombre truncado y botón "Desar".
- Motor: `src/lib/outfits/engine.ts`. Devuelve `OutfitGroup { garments, palettes: PaletteMatch[], bestDistance }`, ordenado por número de piezas asc y `bestDistance` asc.

### Diagnóstico UX (esto es lo que hay que arreglar)

1. **Ruido visual, sobrecarga**: cada combinación puede tener 5–20 paletas debajo. La pantalla se convierte en una lista larguísima de swatches minúsculos. Jordi no distingue una fila de otra a golpe de ojo.
2. **Poco "outfit-feeling"**: la prenda se representa como un círculo de 28 px del color dominante. No se percibe como un conjunto real, más bien como una tabla de datos.
3. **Densidad de decisión alta**: el usuario tiene que decidir *combinación × paleta* en cada fila. Cada tarjeta obliga a mirar N paletas para saber si vale la pena guardar. La granularidad de "Desar per paleta" es demasiado fina para el valor real.
4. **Redundancia**: la misma combinación de prendas aparece una sola vez pero con muchas paletas — el "cost cognitiu" es alto y el aporte marginal por paleta extra es bajo tras las 2–3 primeras (más ordenadas por distancia).
5. **Falta jerarquía / progressive disclosure**: no hay "info principal grande + detalle opcional". Todo pesa igual.
6. **No hay filtro / control** en el bottom sheet: no puedes decir "solo 3 piezas" o "solo esta paleta favorita". La única salida es scroll infinito con "Mostra més".
7. **Nombre de paleta**: truncado, gris claro, casi invisible. Se pierde el aspecto emocional/narrativo (que es lo bonito de Sanzo Wada).

## 2. Objetivo del rediseño

- **Reducir clicks y scroll** para llegar de "he tocado esta prenda" a "veo un outfit y lo guardo".
- **Enseñar menos por defecto y más bajo demanda** (progressive disclosure): un botón / gesto claro de "Mostra més paletes" y "Mostra més combinacions".
- **Aumentar el "outfit-feeling"**: la vista principal debe parecer un look, no una tabla.
- **Mantener el motor sin cambios** (`engine.ts`, `color-matching.ts`, tipos). Solo cambia la capa de presentación y el paginado en cliente.

## 3. Diseño propuesto

### 3.1 Arquitectura visual del bottom sheet

```
┌─────────────────────────────────────┐
│  Header (prenda seleccionada)       │
│  [swatches horizontales grandes]    │
│  Categoría · Fit · Talla · Notas  ✕│
├─────────────────────────────────────┤
│  Barra de filtros (chips)           │
│  [ Totes ] [ 2 peces ] [ 3 peces ]  │
│  (aparecen solo si hay >1 tamaño)   │
├─────────────────────────────────────┤
│  Combo 1  ← tarjeta "outfit hero"   │
│  ─────────────────────────────      │
│  ┌──────┐  Samarreta                │
│  │      │  Fit slim · Talla M       │
│  └──────┘                           │
│  ┌──────┐  Pantalons                │
│  │      │  Fit regular · Talla 32   │
│  └──────┘                           │
│                                     │
│  Paleta principal:                  │
│  ▮▮▮▮▮  Windsor Rose                │
│  ────────────────────────           │
│  [ Desar aquest outfit ]  [+2 més ▾]│
├─────────────────────────────────────┤
│  Combo 2 ...                        │
└─────────────────────────────────────┘
                                     [ Mostra més combinacions ]
```

Cambios concretos:

- **Header**: quedarse como está pero swatches un poco más altos (h-20 en mobile) para reforzar la prenda seleccionada.
- **Barra de filtros (nueva)**: chips con el número de piezas del combo (2, 3, 4…) y "Totes". Estado local. Solo se muestra si existen combos con distinto número de piezas. Filtro puramente cliente sobre el array ya cargado.
- **Tarjeta "outfit hero"** (el gran cambio, sustituye a `OutfitGroupCard`):
  - Renderizar las prendas del combo verticalmente (top → bottom, orden aproximado por categoría: SHIRT/SWEATER → PANTS → JACKET → ACCESSORY). Cada fila = swatch **grande** (h-16 w-16 rounded, con `flex-1` si hay múltiples colors dentro de la prenda) + label a la derecha (`CATEGORY_LABELS`, `FIT_LABELS`, talla, notes si existe).
  - Este bloque es el "outfit". Debe parecer un look editorial minimalista, no una tabla.
  - Debajo, **una única "paleta principal"** — la primera de `group.palettes` (que ya viene ordenada por `totalDistance` asc). Swatches h-6, nombre en tamaño normal (no gris claro), sin truncar (`break-words`).
  - Botón primario "**Desar aquest outfit**" (usa la paleta principal). Un solo click para el caso 90%.
  - Botón secundario "**+N més**" o "**Altres paletes ▾**" (donde N = `group.palettes.length - 1`) — solo aparece si N > 0. Al expandir, muestra las otras paletas debajo con el layout compacto actual (swatches pequeños, nombre, "Desar"). Colapsado por defecto.
- **Paginado global**: mantener el botón "Mostra més combinacions" al final, con `PAGE_SIZE = 6` (bajar de 10, porque cada tarjeta es más grande).

### 3.2 Interacciones

- **Un tap** en "Desar aquest outfit" → guarda con paleta principal (state `savedKeys` ya existe). Feedback: swap del botón a "Desat ✓", disabled.
- **Un tap** en "+N més paletes" → expande inline (no navega, no abre otro sheet). Estado local a la tarjeta. Reversible.
- **Chips de filtro**: cambian el subset visible sin refetch, sin reset del scroll.
- **Escape / backdrop click**: sigue cerrando el sheet.

### 3.3 Motivación por decisión

- *Por qué un botón "Desar aquest outfit" y no per-paleta como ahora*: la primera paleta ya es la mejor (menor `totalDistance`). En el 80% de los casos, guardar con esa es lo correcto. Reducimos de N botones a 1 sin perder capacidad avanzada (queda tras el "+N més").
- *Por qué chips por número de piezas*: es la dimensión discriminante más clara para Jordi (un look de 2 piezas es distinto en intención de uno de 4). Evita tener que scrollear buscando.
- *Por qué layout vertical top → bottom*: refuerza la lectura de arriba abajo natural de un outfit (torso → piernas → accesorio). Es más "shoppable" y menos "spreadsheet".
- *Por qué PAGE_SIZE 6*: cada tarjeta pasa de ~24 px vert por paleta acumulada a ~180 px fija. 6 llenan la pantalla móvil sin scroll infinito agresivo.

## 4. Cambios concretos por fichero

### 4.1 `src/components/OutfitCard.tsx` — reescribir

- Renombrar `OutfitGroupCard` a `OutfitHeroCard` (o mantener nombre y reescribir). Aceptar el mismo prop `group: OutfitGroup`, `onSave: (paletteId: number) => void`, `savedPaletteIds: Set<number>`.
- Ordenar `group.garments` visualmente por categoría antes de renderizar. Sugerencia de orden:
  ```ts
  const CATEGORY_ORDER: Category[] = ["SHIRT", "SWEATER", "JACKET", "PANTS", "ACCESSORY", "SHOES"];
  ```
  Estable, usar índice como fallback si no está en la lista.
- Render swatch grande por prenda (respetar múltiples colors: mostrar todos con `flex-1`, contenedor `h-16` `rounded` `overflow-hidden`).
- Sección paleta principal: `pm = group.palettes[0]`. Nombre en `text-sm text-gray-700` (no `text-xs text-gray-400`). Marcar los `unmatchedColors` con `opacity-40 border-dashed` (como ahora).
- Botón "Desar aquest outfit" → llama `onSave(pm.palette.id)`. Estado disabled si `savedPaletteIds.has(pm.palette.id)`. Etiqueta "Desat ✓" cuando desat.
- Si `group.palettes.length > 1`: botón "+{N} més paletes ▾" con `useState` local para expandir. Cuando expandido, listar `group.palettes.slice(1)` con `PaletteRow` (mantener el componente actual).

### 4.2 `src/components/OutfitBottomSheet.tsx` — pequeños ajustes

- `PAGE_SIZE = 6`.
- Añadir filtro por número de piezas antes de renderizar la lista:
  ```ts
  const [pieceFilter, setPieceFilter] = useState<number | null>(null);
  const availablePieceCounts = useMemo(
    () => Array.from(new Set(groups.map(g => g.garments.length))).sort(),
    [groups]
  );
  const visibleGroups = pieceFilter == null
    ? groups
    : groups.filter(g => g.garments.length === pieceFilter);
  ```
- Renderizar chips solo si `availablePieceCounts.length > 1`. Label: `"Totes"`, `"{n} peces"`.
- Cuidado: si el filtro deja lista vacía y `hasMore`, mostrar mensaje "No hi ha combinacions de N peces carregades" + botón "Carregar més" (no cambiar el filtro auto).

### 4.3 `src/lib/prendas/labels.ts`

Añadir cadena catalana si no existen (verificar antes):
- `outfit.saveThis`: "Desar aquest outfit"
- `outfit.saved`: "Desat"
- `outfit.morePalettes`: `(n) => `${n} paletes més``
- `outfit.filterAll`: "Totes"
- `outfit.filterPieces`: `(n) => `${n} peces``
- `outfit.showMoreCombos`: "Mostra més combinacions"

Si el proyecto no tiene sistema de strings centralizado, dejar strings inline en el componente (mantener el estilo actual del repo).

### 4.4 `src/components/OutfitBuilder.tsx`

Sin cambios funcionales. Ajustar el texto de ayuda a: `"{n} peces · toca una per veure outfits"`.

## 5. Fuera de scope (NO hacer en este PR)

- Cambios en `engine.ts` o algoritmo de matching.
- Persistir preferencia de filtro entre sesiones.
- Drag-and-drop / builder manual.
- Compartir outfit por URL.
- Miniaturas reales de la prenda (no hay imágenes en el modelo, solo colores).

Estos merecen PRs separados si Jordi los pide.

## 6. Validación previa al push

- `pnpm lint` limpio.
- `pnpm build` (Next) sin errores TypeScript.
- Probar en el navegador (mobile viewport, 375 px) el flujo completo:
  1. Ir a `/outfits`.
  2. Elegir temporada, tocar prenda.
  3. Comprobar que se ven combos con layout hero.
  4. Filtrar por piezas.
  5. Expandir "+N més paletes".
  6. Guardar con "Desar aquest outfit" → botón pasa a "Desat ✓".
  7. Guardar una paleta alternativa desde el expandido.
  8. "Mostra més combinacions" carga el siguiente batch.
- Verificar accesibilidad básica: `aria-label` en el ✕ (ya existe), botones con texto real (no solo icono), foco tras cerrar sheet vuelve a la prenda.

## 7. Preguntas para Jordi (bloqueantes solo si aplica)

1. ¿El orden vertical propuesto (SHIRT → SWEATER → JACKET → PANTS → ACCESSORY → SHOES) es el que quieres, o prefieres otro? *Default si no responde: el de arriba.*
2. ¿La paleta principal debe ser la de menor `totalDistance` (default) o la que él marcó como favorita en algún sitio? *Default: menor distancia.*
3. ¿El filtro de piezas debería recordarse entre aperturas del sheet? *Default: no, reset cada vez.*

Si estas respuestas no llegan, aplicar los defaults marcados y seguir.

## 8. Entrega

- Un PR único: `feat(outfits): rediseny bottom sheet amb outfit hero + filtres`.
- Body del PR: describir los 3 pilares (hero card, filtros por piezas, progressive disclosure de paletas) con captura antes/después si es posible.
- No tocar `engine.ts`, `types.ts`, `service.ts`, `repository.ts` salvo justificado.
