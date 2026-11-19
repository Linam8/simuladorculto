# Culto Café · simulador conversacional

El chat usa las 31 fichas de Malasaña de https://micultocafe.netlify.app/ como catálogo.
Las imágenes se cargan desde esa web. La ficha de Syra enlaza una imagen ilustrativa.
Los precios y horarios siguen siendo orientativos y el chat no consulta disponibilidad en directo.

## Probar la demo sin clave

Descomprime el ZIP y ejecuta `python3 -m http.server 8000 --directory public`.
Abre http://localhost:8000. El modo demo interpreta criterios frecuentes y conserva sus filtros durante el chat.

## Activar el agente de IA en Netlify

Importa un repositorio que contenga el proyecto completo. Netlify usa `netlify.toml` para publicar `public` y empaquetar la función `chat`. Configura `OPENAI_API_KEY` como variable de entorno de la función en Netlify y vuelve a desplegar. `OPENAI_MODEL` es opcional. La clave permanece en el servidor.

Para probar localmente con el modelo, ejecuta `npx netlify-cli dev` con la variable de entorno configurada. El modo IA usa la API de OpenAI y llega a modo demo si falla la llamada o falta la clave. Si solo quieres publicar la demo estática por arrastre, sube la carpeta `public`.

Ejemplos para la presentación:

- Busco un sitio tranquilo con Wi-Fi y enchufes para trabajar el sábado.
- ¿Y cuál tiene mejor Wi-Fi?
- Mándame una foto de La Bicicleta Café.
- Reinicia y prueba «Brunch vegano».
