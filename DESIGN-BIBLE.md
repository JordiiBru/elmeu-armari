# Design Bible — elmeu-armari

Este documento es la dirección artística de la aplicación. **No es un refactor de CSS.**
Cualquier agente que toque el frontend debe leer este documento **antes** de escribir código, y volver a él después de cada fase.

Convive con `CLAUDE.md` (convenciones técnicas) y `AGENTS.md` (avisos de stack). Este documento cubre **cómo debe sentirse el producto**. Los otros dos cubren **cómo debe implementarse**.

---

## 0. Manifiesto visual

La aplicación debe transmitir, en este orden, estas sensaciones:

- extremadamente cuidada
- elegante
- premium
- refinada
- lenta en el buen sentido
- minimalista
- editorial
- sofisticada
- táctil
- con personalidad propia

**No es** un SaaS. **No es** un clon de Linear, Apple, Arc, Notion, Vercel o Stripe. No copies su lenguaje visual. El objetivo es que un desconocido, al abrirla, piense: *"esto lo ha diseñado un estudio independiente"*.

### Referencias emocionales (no de estilo)

Cuando dudes, no busques inspiración en "productos digitales premium". Busca en:

- **Kinfolk** — silencio visual, espacios que respiran, restricción cromática, dignidad del vacío.
- **MUJI** — materialidad calma, funcionalidad sin decoración, la belleza de lo inevitable.
- **Aesop** — elegancia editorial, tipografía como personaje, apotecario moderno.
- **Porsche (comunicación gráfica, no coches)** — precisión tipográfica, rigor de grid, disciplina cromática.
- **Cereal / Apartamento** — fotografía y composición: márgenes generosos, jerarquía atrevida, un solo protagonista por página.

No copies. Absorbe la **emoción**. Si una decisión de diseño no encaja en ninguna de esas cinco referencias, probablemente esté mal.

### Regla del filtro de tiempo

**Diseñamos para dentro de diez años, no para 2026.** Si una decisión se explica solo como "así se ve moderno hoy", es incorrecta. Glassmorphism, gradientes coloridos, sombras dramáticas, neumorphism, blobs, brutalismo, Framer Motion decorativa — nada de eso entra.

---

## 1. Filosofía de sistema

### Diseña un sistema, no pantallas

Cada primitiva debe existir **una sola vez** y usarse en todos los sitios que la necesitan. Las pantallas son la composición de primitivas, no el lugar donde se decide un color.

### Cada elemento debe tener un motivo

Si un elemento no responde a "¿qué comunica esto?", se elimina. Ningún adorno gratuito, ningún efecto llamativo, ninguna decoración por moda.

### Todo debe sentirse inevitable

La sensación buscada es que la interfaz **no podría haber sido diseñada de otra forma**. No hay alternativas mejores porque cada decisión responde a una restricción tipográfica, cromática o de motion.

### No dupliques estilos

Cero clases Tailwind repetidas más de dos veces en el codebase. Si aparecen una tercera vez, se extraen a componente o a token.

### La identidad existente se mantiene y se eleva

Editorial · Japandi · MUJI · Sanzo Wada · catálogo museográfico. Estas cinco palabras son la brújula. Cualquier decisión que las contradiga es incorrecta, aunque técnicamente sea correcta.

---

## 2. Design tokens

Todos los componentes usan **exclusivamente tokens semánticos**. Cero hex en JSX. Cero colores nombrados en Tailwind (`gray-500`, `neutral-300`). Los tokens se definen en `src/app/globals.css` bajo `@theme` de Tailwind v4.

### Tokens de superficie

| Token | Rol |
|---|---|
| `background` | Fondo base de la app (cream MUJI actual como punto de partida). |
| `surface` | Contenedores estáticos sobre background (secciones, headers de página). |
| `elevated` | Cards, paneles inline con elevación semántica. |
| `floating` | Popovers, dropdowns custom. |
| `overlay` | Backdrop de modales/sheets (semitransparente sobre foreground). |

### Tokens tipográficos

| Token | Rol |
|---|---|
| `text-primary` | Texto principal (foreground). |
| `text-secondary` | Texto de apoyo, metainformación. |
| `text-muted` | Texto terciario (contadores, hints, pistas). Debe seguir cumpliendo AA. |
| `text-inverse` | Texto sobre superficies invertidas (raro, para casos puntuales). |

### Tokens de borde

| Token | Rol |
|---|---|
| `border` | Hairline por defecto (divisores, inputs). |
| `border-strong` | Hairline con más presencia (tab activa, focus, seleccionado). |
| `border-subtle` | Hairline apenas visible (agrupaciones secundarias). |

### Tokens de acento

| Token | Rol |
|---|---|
| `accent` | Único color de énfasis del sistema. Se usa con cuentagotas. Puede derivarse del propio foreground o de una tinta editorial. **No un morado SaaS.** |
| `success` | Feedback positivo. Debe convivir con la paleta cream — evita verde chillón. |
| `warning` | Advertencia. Tono cálido, mostaza apagado. |
| `danger` | Destructivo. Terracota oscuro, no rojo puro. |

### Tokens interactivos

| Token | Rol |
|---|---|
| `interactive` | Estado por defecto de un elemento accionable. |
| `interactive-hover` | Delta sutil, no color plano diferente. |
| `interactive-pressed` | Compresión visual + oscurecimiento mínimo. |
| `focus-ring` | Anillo de focus visible pero editorial. |
| `disabled` | Opacidad + no cursor. Nunca "gris feo". |

### Tokens de profundidad (sombras y capas)

| Token | Rol |
|---|---|
| `shadow-1` | Micro-elevación (cards en hover, tab activa). ~0–1px de blur, muy baja opacidad. |
| `shadow-2` | Elevación media (popovers, dropdowns). |
| `shadow-3` | Elevación alta (sheets, modales). Puede combinarse con un hairline en vez de más blur. |

**Ninguna sombra debe leerse como "sombra".** Debe leerse como "esto está encima". Si la ves, es demasiado.

### Modo oscuro

Se define en el mismo sistema (no invertido: **grafito cálido** con la misma temperatura del cream, no gris frío). Todo componente debe funcionar en ambos modos sin ajustes locales. Ningún `dark:*` inline: se resuelve en los tokens.

### Regla dorada

Si escribes un color en JSX o Tailwind, has hecho algo mal. Vuelve a los tokens.

---

## 3. Tipografía

**No se cambian las fuentes.** Fraunces (serif de display), Inter Tight (sans body), Geist Mono (mono). La escala sí se rehace.

### Escala tipográfica (matemática, no arbitraria)

Basada en una razón única (`major-third` o `perfect-fourth` — a decidir en Fase 1). Cada token tiene tamaño, line-height, letter-spacing y peso fijos.

| Token | Familia | Uso |
|---|---|---|
| `display` | serif | Portadas, hero de home. |
| `hero` | serif | H1 de páginas principales. |
| `title-xl` | serif | Títulos grandes de sección. |
| `title` | serif | Títulos de sheet/modal. |
| `subtitle` | serif italic | Subtítulos poéticos. |
| `body` | sans | Texto corriente. |
| `small` | sans | Metainformación, contadores. |
| `caption` | sans | Microcaps con tracking definido (un único valor: no 0.15em / 0.2em / 0.25em). |
| `mono` | mono | Solo hex y datos técnicos. |

Prohibido:
- `text-[10px]`, `text-[11px]`, `tracking-[0.25em]` inline.
- Pesos ad-hoc (`font-medium` para "un poco de énfasis"). Cada token tiene su peso.
- Mezclar italic serif y microcaps sin motivo.

---

## 4. Espaciado

Escala única, progresión constante. Ejemplo: `2, 4, 8, 12, 16, 24, 32, 48, 64, 96` (a fijar en Fase 1). Nada elegido "a ojo". Ningún `gap-y-10` sin justificación en escala.

Reglas:
- Layouts respiran. Los márgenes generosos son parte de la identidad.
- Nunca desperdicio: si un espacio no comunica pausa o jerarquía, se reduce al siguiente escalón.
- El gutter lateral es un token (`gutter-page`), no `px-6 md:px-10` inline por página.

---

## 5. Profundidad y capas

Hoy la app es plana como papel. Queremos **profundidad sin sombras dramáticas**. Herramientas permitidas, en orden de preferencia:

1. Cambio de superficie (`background` → `surface` → `elevated`).
2. Hairline visible (`border` o `border-strong`).
3. Micro-sombra (`shadow-1` a `shadow-3`).
4. Contraste tipográfico.
5. Superposición geométrica.

Capas semánticas (cada una un nivel visual claro):

- `background` (0)
- `content` (0.5 — no eleva, agrupa)
- `card` (1)
- `floating` (2 — popovers)
- `overlay` (3 — backdrop)
- `modal` / `sheet` (4)

Un elemento en capa 3 nunca debe leerse como capa 1. Un modal siempre debe leerse como modal, sin necesidad de sombra fuerte.

---

## 6. Bordes

Los hairlines son parte de la identidad **y se mantienen**. Pero:

- Cada borde tiene un significado (divide, contiene, enfoca, activa).
- No todo puede ser un hairline. Si el mismo hairline funciona como divisor de sección, indicador de tab activa, borde de input y subrayado hover, se ha perdido significado. Distribuir entre `border`, `border-strong`, `border-subtle`.
- Cero border-radius por defecto (esquinas afiladas es identidad). Excepciones documentadas: swipe handle, dots separadores, avatares si aparecen.

---

## 7. Botones y acciones

Sistema completo. **Prohibido** escribir `<button className="font-serif italic ...">` en pantallas. Todo botón sale del componente `<Button>` (o su hermano `<IconButton>`).

Variantes obligatorias:

| Variante | Uso |
|---|---|
| `primary` | Acción principal. Máxima jerarquía. Nunca ambigua. Cada pantalla tiene **como mucho una**. |
| `secondary` | Acción alternativa. |
| `ghost` | Acción menor con presencia. |
| `text` | Acción tipo link (el actual "guardar peça"). Solo cuando la acción no es la principal. |
| `danger` | Destructiva. Diferenciada visualmente sin ser roja chillona. |
| `icon` | Solo icono. Target táctil ≥ 44px. |
| `floating` | Sticky footer / FAB editorial. |

Estados obligatorios en cada variante: `default`, `hover`, `pressed`, `focus-visible`, `disabled`, `loading`.

El botón "guardar peça" del `AddForm` actual pasa a ser `primary`, con presencia real.

---

## 8. Inputs y formularios

Los `<select>` nativos **se eliminan**. Todo componente de formulario es propio:

- `Input`
- `Textarea`
- `Combobox` (sustituye `<select>`)
- `Select` (variante compacta del combobox)
- `Checkbox`
- `Switch`
- `SegmentedControl` (sustituye grupos de tags-filtro cuando corresponda)
- `ColorPicker` (evoluciona el actual)
- `FileDropzone` (sustituye el "afegir foto" + preview cuadrado)

Todos comparten:
- Hairline como identidad base.
- Label microcaps un único tamaño (`caption`).
- Estados error/success/warning con hairline coloreado por token semántico, nunca fondo rojo.
- Focus ring que respeta `focus-ring`.

Los formularios se agrupan visualmente por bloques (identidad · aspecto · uso · notas), no como una lista vertical infinita. El submit primario **siempre visible** en el flujo (sticky en móvil si hace falta).

---

## 9. Iconografía

**Cero glifos Unicode (`←`, `×`, `˅`, `+`, `→`)** en el producto final. Se sustituyen por un único set icónico. Recomendación: **Phosphor Thin** o **Lucide con `stroke-width: 1.25`**. Un solo peso, una sola alineación, un solo grid.

Reglas:
- Un icono no comunica solo — siempre acompaña texto o tiene `aria-label`.
- Ningún icono decorativo.
- Los iconos animan con el mismo lenguaje que el resto de la interfaz (ver §10).

---

## 10. Motion design

**El punto más importante.** No queremos más animaciones. Queremos **mejores** animaciones. Cada movimiento comunica.

### Un lenguaje único de movimiento

Todas las animaciones comparten:

- **Un solo set de duraciones**: `instant` (~100ms), `fast` (~180ms), `base` (~260ms), `slow` (~420ms), `deliberate` (~600ms). Nada de duraciones sueltas.
- **Dos easings**: `ease-out` estándar para transiciones simples; `spring-editorial` (curva tipo iOS ya existente) para elementos con "masa" (sheets, cards en hover).
- Masa, velocidad y desaceleración consistentes: dos elementos entrando a la vez deben sentirse del mismo material.

### Momentos cubiertos por el sistema

- Entrada de página (100–200ms, fade + micro translate).
- Cambio entre tabs (indicador que **desliza**, no reaparece).
- Hover (delta mínimo, no elevación dramática).
- Focus (ring aparece con `fast`, no salta).
- Tap (compresión física antes de soltar).
- Selección (feedback inmediato, sin retraso).
- Guardar / eliminar / éxito (respuesta editorial breve).
- Modal / sheet (entrada spring, salida `base`).
- Toast (aparece y desaparece con dignidad).
- Cambio de filtros (panel con `interpolate-size`, ya presente).
- Estado de carga (skeleton editorial, no spinner).
- Estado vacío (aparece con calma, no vacío duro).
- Errores (sin sacudida, sin rojo saturado — hairline + microcopy).

### Microinteracciones buscadas

Detalles que el usuario descubre con el uso:

- Los botones anticipan el click con un ligerísimo cambio de opacidad al hover.
- Las cards tienen peso — al hover flotan `1–2px`, al soltar caen.
- Las imágenes aparecen con transición de opacidad (crossfade) al cargar, nunca "pop".
- Los contadores cambian con `tabular-nums` y transición suave (no re-render brusco).
- Las tabs deslizan el indicador con `spring-editorial`.
- Las paletas se expanden como papel — origen coherente, no aparición desde `display:none`.
- Los sheets parecen apoyarse — sombra leve donde tocan la superficie, no flotan en el aire.

Nada espectacular. Todo extremadamente refinado. Si un usuario dice "wow qué animación", es demasiado.

### `prefers-reduced-motion`

Obligatorio. Todo movimiento tiene fallback estático coherente. Cero animación de scroll bloqueante.

---

## 11. Pantallas — dirección específica

### Home (`/`)

- Sigue pareciendo una portada.
- **Cuenta una historia**: el usuario debe entender inmediatamente qué hace la app, qué contiene, qué tiene guardado, qué puede hacer ahora.
- Añadir vida (últimas piezas / paleta reciente / cifra viva del catálogo), no ruido.
- La navegación se mantiene editorial y centrada.

### `/armari`

- Es la mejor pantalla del producto.
- Grid editorial, no galería genérica.
- Cada pieza tiene presencia — las fotografías son protagonistas.
- Hover físico. Selección inmediata. Ordenación real (fecha, color, uso).
- Filtros conservan el lenguaje actual pero apoyados en `SegmentedControl` cuando sean excluyentes.
- Tabs con indicador que desliza.

### `/paleta`

- Catálogo museográfico. Sanzo Wada como protagonista.
- Añadir agrupación cromática (familia, warm/cool) sin romper la calma.
- El sheet debe respirar mejor con paletas anchas.

### Formularios (`/add`, `/edit/[id]`)

- Cero sensación de burocracia.
- Agrupar visualmente por bloques.
- Submit primario imposible de ignorar.
- Drag & drop de foto. Preview digno.

### `/stats`

- Menos sutil de leer, más útil de un vistazo.
- Cifras con jerarquía real.
- Sin renunciar al lenguaje hairline.

### `/settings`

- Renombrar a "arxiu" si solo hace backup, o expandir para justificar el nombre actual.

### Estados vacíos (todos)

- Bonitos. Nunca frustración.
- Ofrecen siempre el siguiente paso claro.
- Microcopy con voz — la misma voz que el resto de la app.

### Feedback

- La app **nunca queda callada**. Guardar, eliminar, importar, exportar, crear outfit — todo produce respuesta visual elegante.
- Toasts editoriales, no notificaciones SaaS.
- `confirm()` nativo se elimina.

---

## 12. Accesibilidad

No negociable:

- Contraste AA en todos los pares (texto secundario incluido). Si un token no cumple, se ajusta el token, no el uso.
- Focus visible en todo elemento accionable, respetando `focus-ring`.
- Targets táctiles ≥ 44×44 px.
- Navegación completa por teclado (tabs, sheets, modales, combobox).
- `prefers-reduced-motion` respetado en todo movimiento.
- `aria-*` correcto en sheets, tabs, comboboxes.

---

## 13. Rendimiento

- Toda animación GPU-friendly: `transform` y `opacity` siempre que sea posible.
- Cero re-layouts en animaciones.
- `content-visibility: auto` conservado en grids largos.
- `next/image` con `priority` selectivo (ya presente en `PieceThumb`).
- Cero librerías de animación pesadas. Si hace falta motion library, usar una ligera (motion.dev de `framer-motion` con imports selectivos) y solo si un `transition` CSS no basta.
- No añadir dependencias UI (Radix, Shadcn) sin discusión explícita.

---

## 14. Restricciones que no se rompen

- Convenciones técnicas de `CLAUDE.md` y `AGENTS.md` (Next 16.2, React 19, Prisma driver adapter, RSC-first, sin `useEffect` para data).
- Labels de dominio siempre en `src/lib/prendas/labels.ts`.
- UI copy siempre en `src/lib/prendas/ui-strings.ts` — cero catalán inline en JSX.
- Regex de nombres de foto (allowlist de seguridad) se mantiene.
- Repository → service → components inviolable.
- `npm run check` verde antes de PR.
- PRs de un solo commit limpio.

---

## 15. Fases de trabajo

Cada fase entrega un PR independiente. Antes de pasar a la siguiente fase, se ejecuta la **gate de fase** (lista de preguntas binarias). Si alguna respuesta es "no", no se avanza.

### Fase 1 — Design tokens

Definir en `globals.css` todos los tokens semánticos de §2, en modo claro y oscuro. Escala tipográfica (§3) y espacial (§4) como custom properties.

**Gate:**
- ¿Existe un token semántico para cada uso listado en §2?
- ¿Cero hex en JSX en toda la app? (`grep` limpio)
- ¿Cero `text-[Npx]` y `tracking-[N]` inline?
- ¿Existe modo oscuro y toda la app funciona en él?
- ¿Todos los pares texto/fondo cumplen AA?

### Fase 2 — Primitivas base

`Stack`, `Cluster`, `Grid`, `PageContainer`, `SectionHeader`, tipografía tokenizada como componentes (`<Text variant="body">`, `<Heading level="hero">`).

**Gate:**
- ¿Puede una pantalla nueva construirse sin escribir un solo `flex flex-col gap-*` a mano?
- ¿La tipografía de todas las pantallas existentes pasa por `<Text>` / `<Heading>`?

### Fase 3 — Botones

Componente `<Button>` con todas las variantes de §7. Migración de todos los botones existentes.

**Gate:**
- ¿Existe `<button>` crudo en JSX fuera de `Button.tsx`? Debe ser cero.
- ¿Toda pantalla tiene una y solo una acción `primary`?
- ¿Todos los estados (hover/pressed/focus/disabled/loading) implementados y visibles?

### Fase 4 — Inputs

Componentes de §8. Eliminación de `<select>` nativos. Refactor de `AddForm` y `EditForm`.

**Gate:**
- ¿Cero `<select>`, `<input type="text/search/file">` nativos en JSX fuera de los componentes primitivos?
- ¿Formularios agrupados en bloques semánticos?
- ¿Estados de error/success visibles y accesibles?

### Fase 5 — Cards

`GarmentCard`, `OutfitCard`, `SavedGroupCard`, `PaletteCard` — todas reescritas sobre primitivas y tokens. Estados hover/focus físicos.

**Gate:**
- ¿Todas las cards comparten sistema hover coherente?
- ¿Las fotos aparecen con transición al cargar?
- ¿Cero clases Tailwind duplicadas entre cards?

### Fase 6 — Sheets, modales, popovers

Refactor de `GarmentModal`, `OutfitBottomSheet`, `PaletteSheet` sobre un único componente `<Sheet>` / `<Modal>` con variantes. `<Toast>` nuevo. `<Popover>` para menús.

**Gate:**
- ¿`confirm()` nativo eliminado del código?
- ¿Guardar/eliminar/importar producen toast editorial?
- ¿Escape, click fuera, swipe-to-close funcionan uniformemente?

### Fase 7 — Grid del armario y filtros

Rediseño del grid `/armari`, presencia de piezas, ordenación real, indicador de tabs deslizante.

**Gate:**
- ¿Grid comunica presencia editorial (no galería)?
- ¿Indicador de tab desliza con `spring-editorial`?
- ¿Filtros usan `SegmentedControl` donde aplica?

### Fase 8 — Home y micro-narrativa

Home cuenta historia (piezas recientes, cifras vivas, atajos claros) sin perder identidad de portada.

**Gate:**
- ¿La primera visita comunica qué hace la app sin explicación?
- ¿La segunda visita muestra estado actual del armario?

### Fase 9 — Motion completa

Sistema unificado de motion. Todo movimiento pasa por los tokens de duración/easing. Iconografía reemplaza glifos.

**Gate:**
- ¿Cero glifo Unicode en JSX?
- ¿Todas las animaciones comparten las cinco duraciones canónicas?
- ¿`prefers-reduced-motion` respetado en toda la app?
- ¿Cero jank observable en Safari Mac y iOS Safari?

### Fase 10 — Pulido final

Estados vacíos, mensajes de error, skeletons editoriales, revisión de contraste completo, auditoría de accesibilidad con teclado.

**Gate:**
- ¿Toda pantalla tiene estado vacío diseñado?
- ¿Navegación completa por teclado en todos los flujos?
- ¿Bundle no ha crecido más del 15% respecto al inicio?
- ¿Lighthouse Accessibility ≥ 95?

---

## 16. Cómo decidir cuando dudes

Cuando dudes entre dos opciones, pregúntate en este orden:

1. ¿Cuál es más silenciosa?
2. ¿Cuál se mantendría igual de elegante en 2036?
3. ¿Cuál cabría en un editorial de Kinfolk?
4. ¿Cuál añade menos elementos?
5. ¿Cuál respeta más los tokens?

La respuesta correcta es normalmente la misma en las cinco preguntas. Si no lo es, algo está mal en la premisa.
