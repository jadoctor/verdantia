# 📝 Estándar de Estructura de Blog — Verdantia

## Flujo de Generación

```
ENTRADAS:
├── Especie/Labor (contexto botánico de la BBDD)
├── Prompt del sistema (esta plantilla, fijo)
└── Indicaciones del usuario (campo libre)

SALIDA:
├── JSON estructurado con bloques modulares
├── 3 imágenes IA (pipeline estándar: watermark + WebP + SEO + datosadjuntos)
└── Registro en tabla `blog` + `datosadjuntos`
```

## Bloques Obligatorios del Blog

Cada artículo generado DEBE contener estos 8 bloques en este orden:

| # | Bloque | Campo JSON | Descripción |
|---|--------|-----------|-------------|
| 1 | **Encabezado** | `titulo`, `resumen`, `tags` | Foto izquierda + título + badges + autor + fecha |
| 2 | **Ficha Rápida** | `ficha_rapida[]` | Grid 2×3 de datos clave (icono + label + valor) |
| 3 | **Introducción** | `introduccion` | Max 100 palabras, gancho emocional |
| 4 | **Sección + Imagen** | `secciones[0]` | H2 + texto + imagen IA a la derecha |
| 5 | **Caja de Consejos** | `consejos` | Tips numerados, errores comunes o trucos |
| 6 | **Sección + Imagen** | `secciones[1]` | H2 + texto + imagen IA a la izquierda (invertido) |
| 7 | **CTA** | `cta` | Llamada a la acción con 2 botones |
| 8 | **Footer** | (automático) | Autor (del sistema), tags, especie vinculada |

## Estructura JSON que Gemini debe devolver

```json
{
  "titulo": "Título SEO atractivo",
  "slug": "url-amigable",
  "resumen": "2 líneas para la tarjeta del blog",
  "tags": ["#tag1", "#tag2", "#tag3"],
  "ficha_rapida": [
    { "icono": "🌡️", "label": "Temp. Óptima", "valor": "18-25°C" },
    { "icono": "🗓️", "label": "Siembra", "valor": "Abr-Jun" },
    { "icono": "🌱", "label": "Germinación", "valor": "5-8 días" },
    { "icono": "📏", "label": "Marco", "valor": "100×80cm" },
    { "icono": "🕐", "label": "Cosecha", "valor": "45-65 días" },
    { "icono": "💧", "label": "Riego", "valor": "Abundante" }
  ],
  "introduccion": "Texto gancho de max 100 palabras...",
  "secciones": [
    {
      "titulo_h2": "🌱 Cómo Sembrar",
      "contenido_markdown": "Texto con H3, negritas, listas...",
      "imagen_posicion": "derecha"
    },
    {
      "titulo_h2": "🍳 En la Cocina",
      "contenido_markdown": "Texto con recetas, tips...",
      "imagen_posicion": "izquierda"
    }
  ],
  "consejos": {
    "titulo": "💡 3 Errores Fatales que Todo Principiante Comete",
    "items": [
      "**Regar las hojas** — Provoca oídio",
      "**No cosechar a tiempo** — Pierde sabor con +30cm",
      "**Plantar demasiado junto** — Mínimo 1 metro"
    ]
  },
  "cta": {
    "titulo": "¿Listo para cultivar?",
    "subtitulo": "Añade esta especie a tu huerto virtual",
    "boton_primario": "🌱 Añadir a Mi Huerto",
    "boton_secundario": "📄 Descargar Ficha PDF"
  },
  "imagenes": [
    {
      "prompt_en": "Professional photo of...",
      "titulo_seo": "Título SEO español max 60 chars",
      "descripcion_seo": "Descripción SEO español max 120 chars"
    }
  ]
}
```

## Reglas de Contenido

1. **Sin paja**: Párrafos de máximo 3 líneas
2. **Negritas**: Conceptos clave siempre en negrita
3. **Datos concretos**: Cifras, temperaturas, días, medidas
4. **Tono**: Profesional pero cercano, como un agrónomo hablándote en el huerto
5. **Mínimo 2 secciones** con imagen, máximo 4
6. **Ficha rápida**: Siempre con 6 datos, adaptados a la especie/labor
7. **Tags**: Mínimo 4, máximo 8

## Reglas de Diseño (Renderizado)

- Header: foto 200×200 izquierda + texto derecha (sin hero full-width)
- Ficha rápida: grid 3 columnas, fondo verde suave
- Secciones: alternar imagen derecha/izquierda (grid 50/50)
- Caja consejos: fondo ámbar, borde izquierdo naranja
- CTA: gradiente verde Verdantia, botones blancos
- Footer: avatar real del autor, tags como chips
