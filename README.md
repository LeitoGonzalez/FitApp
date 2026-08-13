# FitApp

Web app mobile-first para registrar entrenamientos en el gimnasio. Oscura, táctil y sin backend: todo vive en el LocalStorage del navegador.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- lucide-react

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Pensada para el celular: en desktop usá las DevTools en vista móvil.

```bash
npm run build
npm start
```

## Qué hace

| Pestaña | Uso |
| --- | --- |
| **Hoy** | Elegís la rutina, cargás peso / reps / RIR y marcás la serie. Peso y reps son obligatorios para el tilde verde. RIR puede ser 0 o vacío. |
| **Rutinas** | Plantillas + catálogo de ejercicios. Las rutinas eligen ejercicios existentes (no se tipea el nombre a mano). |
| **Historial** | Sesiones por fecha, notas, comparación vs. la vez anterior y **Copiar sesión** (Markdown al portapapeles). |
| **Progreso** | Curva por ejercicio: mejor peso o volumen (`peso × reps`). |

También hay **exportar / importar backup** (JSON) al final del Historial. El import reemplaza todos los datos del dispositivo.

## Datos

No hay servidor ni cuenta. La clave en LocalStorage es `fitapp-data-v1`.

Si borrás los datos del sitio, se pierde el historial. Usá el backup JSON si cambiás de celular.

## Deploy

Proyecto listo para [Vercel](https://vercel.com): importá el repo y dejá los defaults de Next.js.
