
# 🚀 Finanza360 - Ecosistema Financiero Inteligente

Finanza360 es una aplicación de gestión financiera de clase mundial que utiliza Inteligencia Artificial (Google Gemini) para proporcionar insights profundos sobre tu salud económica. Diseñada específicamente para usuarios que manejan múltiples monedas (USD/VES) y necesitan separar sus finanzas personales de flujos laborales o de terceros.

## ✨ Características Principales

- **🤖 IA Gemini Integration**: Análisis en tiempo real de patrones de gasto, detección de anomalías y chat financiero interactivo.
- **🏦 Gestión Multimoneda**: Soporte nativo para USD y VES con sincronización automática de tasa de cambio (BCV) mediante búsqueda en tiempo real de la IA.
- **📦 Segmentación de Fondos (3 Cubetas)**:
  - **Personal**: Tu riqueza neta real.
  - **Pote de Trabajo**: Control de anticipos y gastos corporativos sin mezclar con tu dinero.
  - **Custodia (Terceros)**: Registro de dinero que posees pero no te pertenece (ahorros de familiares, etc.).
- **📈 Portafolio de Inversión**: Seguimiento de acciones, criptomonedas y renta fija con actualización de precios vía IA.
- **📱 Responsive First**: Optimizado para una experiencia fluida tanto en computadoras de escritorio como en dispositivos móviles.

## 🛠️ Tecnologías

- **Frontend**: React 19 (ES Modules)
- **Styling**: Tailwind CSS
- **IA**: Google GenAI SDK (Gemini 3 Flash Preview)
- **Gráficos**: Recharts
- **Iconos**: Lucide React

## 🚀 Despliegue en Vercel

Esta aplicación está lista para ser desplegada en Vercel con un solo clic.

### Pasos:
1. Sube este código a un repositorio de **GitHub**.
2. Conecta tu repositorio en **Vercel**.
3. **CRÍTICO**: Configura la variable de entorno `API_KEY` en el panel de Vercel con tu API Key de Google AI Studio.

## 🔑 Configuración de API KEY

Para que las funciones de IA y sincronización de tasa funcionen, necesitas una llave de API de Google Gemini:
1. Ve a [Google AI Studio](https://aistudio.google.com/).
2. Crea una nueva API Key.
3. En desarrollo local, asegúrate de que el entorno la proporcione, o en producción, añádela como `API_KEY`.

---
*Desarrollado con enfoque en estética, privacidad local y potencia analítica.*
