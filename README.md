# Dashboard de Resultados ATI (Astro + Tailwind + React)

Visualizador gráfico para resultados de encuesta escolar, con vista consolidada y vista por grado.

## Stack

- Astro
- Tailwind CSS
- React (Astro Islands)
- Recharts

## Requisitos

- Node.js 20+
- npm

## Ejecutar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Actualizar datos desde Excel

El dashboard consume `src/data/survey-data.json`.

Para regenerarlo desde el Excel original:

```bash
./scripts/extract_survey_data.py
```

Opcionalmente puedes indicar origen y destino:

```bash
./scripts/extract_survey_data.py "Formulario sin título (Respuestas).xlsx" src/data/survey-data.json
```

## Reglas aplicadas

- No se muestra `Marca temporal`.
- No se muestran `Comentarios`.
- Se muestran resultados por grado y de toda la escuela.
- Si una respuesta menciona varios grados, se contabiliza en cada grado indicado.
# encuesta-ati
