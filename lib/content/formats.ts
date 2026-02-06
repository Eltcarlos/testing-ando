import { ContentFormat } from '@/types/editorial';
import { List, Route, FileText, Book, MessageSquare, Newspaper, BookOpen, Scale, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Complete configuration for a content format
 */
export interface FormatConfig {
  value: ContentFormat;
  label: string;
  labelEs: string;
  description: string;
  detailedDescription: string;
  icon: LucideIcon;
  wordCountRange: [number, number];
  estimatedReadTime: string;
  promptTemplate: string;
  examples: string[];
  whenToUse: string;
  seoTips: string;
}

/**
 * Centralized format configuration - Single source of truth
 * All format metadata, AI prompts, and UI config live here
 */
export const FORMAT_CONFIG: Record<ContentFormat, FormatConfig> = {
  listicle: {
    value: 'listicle',
    label: 'Listicle',
    labelEs: 'Lista',
    description: '5, 7, 10 puntos numerados',
    detailedDescription: 'Artículo estructurado en lista numerada. Ideal para consejos prácticos, estrategias, o pasos que el lector puede aplicar rápidamente.',
    icon: List,
    wordCountRange: [800, 1200],
    estimatedReadTime: '4-6 min',
    examples: [
      '7 estrategias para aumentar ventas en temporada baja',
      '10 herramientas digitales que todo emprendedor necesita',
      '5 errores comunes al contratar empleados'
    ],
    whenToUse: 'Cuando quieras compartir múltiples consejos, estrategias o ejemplos de forma escaneable y fácil de recordar.',
    seoTips: 'Incluye números en el título (7, 10, 15). Usa subtítulos claros para cada punto. Optimiza para featured snippets.',
    promptTemplate: `
Estructura:
- Título con número específico (ej: "7 estrategias para...", "10 herramientas esenciales...")
- Intro enganchadora (2-3 oraciones) que explique por qué es importante el tema
- Lista numerada con entre 5-10 puntos
- Cada punto debe tener:
  * Subtítulo descriptivo en negrita
  * 3-4 oraciones explicando el concepto
  * Ejemplo concreto aplicable a PyMEs mexicanas cuando sea posible
- Cierre con reflexión final o call-to-action práctico
- Longitud: 800-1200 palabras

Estilo:
- Tono profesional pero cercano, tutea al lector
- Párrafos cortos y escaneables
- Usa bullets o viñetas dentro de cada punto si es necesario
- Incluye datos o estadísticas cuando refuercen el punto
`.trim(),
  },

  how_to: {
    value: 'how_to',
    label: 'How-To / Tutorial',
    labelEs: 'Cómo Hacer',
    description: 'Paso a paso práctico',
    detailedDescription: 'Guía práctica que enseña cómo realizar una tarea específica. Estructura secuencial con pasos claros y accionables.',
    icon: Route,
    wordCountRange: [1000, 1500],
    estimatedReadTime: '5-8 min',
    examples: [
      'Cómo calcular el punto de equilibrio de tu negocio',
      'Paso a paso: Cómo crear una campaña en Facebook Ads',
      'Cómo negociar con proveedores y conseguir mejores precios'
    ],
    whenToUse: 'Cuando necesites enseñar un proceso específico paso a paso que el lector puede seguir inmediatamente.',
    seoTips: 'Inicia con "Cómo..." o "Paso a paso:". Usa encabezados numerados (Paso 1, Paso 2). Incluye imágenes o screenshots si es posible.',
    promptTemplate: `
Estructura:
- Título claro tipo "Cómo..." o "Paso a paso para..."
- Intro breve (2-3 párrafos):
  * Qué van a lograr con este tutorial
  * Para quién es útil
  * Qué necesitan antes de empezar (requisitos previos)
- Pasos numerados y secuenciales (típicamente 5-8 pasos)
- Cada paso debe incluir:
  * Título claro del paso
  * Instrucciones específicas y accionables
  * Tips o advertencias donde aplique (usa "⚠️ Importante:" o "💡 Tip:")
  * Ejemplo concreto cuando sea posible
- Sección final: "Resultado esperado" o "Próximos pasos"
- Longitud: 1000-1500 palabras

Estilo:
- Instrucciones claras y directas
- Verbos en imperativo (Calcula, Define, Analiza)
- Anticipar dudas comunes
- Lenguaje accesible sin jerga innecesaria
`.trim(),
  },

  opinion: {
    value: 'opinion',
    label: 'Opinión / Post',
    labelEs: 'Opinión',
    description: 'Artículo corto (3-5 párrafos)',
    detailedDescription: 'Artículo de opinión breve y directo. Comparte una perspectiva única sobre un tema relevante del mundo empresarial.',
    icon: FileText,
    wordCountRange: [300, 500],
    estimatedReadTime: '2-3 min',
    examples: [
      'Por qué los negocios pequeños deben pensar en grande',
      'El error que cometen las PyMEs al querer crecer rápido',
      'La digitalización no es opcional: es supervivencia'
    ],
    whenToUse: 'Para compartir una opinión fuerte, reflexión o comentario sobre tendencias, noticias o mitos en el mundo de los negocios.',
    seoTips: 'Título punchy y controversial. Usa preguntas retóricas. Optimiza para engagement (shares y comentarios).',
    promptTemplate: `
Estructura:
- Título punchy y directo (puede ser controversial o provocador)
- 3-5 párrafos máximo (cada uno de 3-5 oraciones)
- Enfoque en UN SOLO mensaje clave
- Sin secciones formales ni subtítulos (##)
- Puede incluir pregunta retórica al inicio o final
- Cierre con reflexión o llamado a la acción
- Longitud: 300-500 palabras

Estilo:
- Voz personal y auténtica
- Puede ser provocador pero siempre profesional
- Apoyar opinión con experiencia o datos
- Tono conversacional, como si hablaras con un amigo emprendedor
- Evitar lenguaje demasiado formal o académico
`.trim(),
  },

  case_study: {
    value: 'case_study',
    label: 'Caso de Estudio',
    labelEs: 'Caso de Estudio',
    description: 'Análisis detallado con ejemplos',
    detailedDescription: 'Análisis profundo de un caso real o ejemplo concreto. Muestra el problema, la solución y los resultados de forma estructurada.',
    icon: Book,
    wordCountRange: [1000, 1500],
    estimatedReadTime: '5-8 min',
    examples: [
      'Cómo una tortillería en Monterrey triplicó sus ventas con delivery',
      'Caso de estudio: PyME textil que digitalizó su inventario y redujo pérdidas 40%',
      'De local físico a e-commerce: la transformación de una zapatería familiar'
    ],
    whenToUse: 'Cuando quieras demostrar conceptos con ejemplos reales y mostrar resultados tangibles que inspiren al lector.',
    seoTips: 'Incluye resultados en el título ("triplicó ventas", "redujo costos 40%"). Usa datos específicos y métricas.',
    promptTemplate: `
Estructura:
- Título claro que indique el beneficio o resultado (ej: "Cómo X logró Y")
- Intro (2-3 párrafos):
  * Contexto del negocio o situación
  * El problema o desafío principal
  * Promesa de la solución
- 4-6 secciones con subtítulos (##) que cuenten la historia:
  * Situación inicial / El problema
  * Análisis de causas
  * La solución implementada
  * Proceso de implementación
  * Resultados obtenidos (con datos específicos)
  * Lecciones aprendidas
- Cada sección debe tener ejemplos concretos y específicos
- Conclusión con próximos pasos o recomendaciones aplicables
- Longitud: 1000-1500 palabras

Estilo:
- Narrativo pero profesional
- Datos específicos y métricas (%, $, tiempo)
- Mostrar antes/después cuando sea posible
- Hacer el caso relatable para PyMEs mexicanas
- Incluir quotes imaginarios del dueño/gerente si ayuda a la narrativa
`.trim(),
  },

  interview: {
    value: 'interview',
    label: 'Entrevista / Q&A',
    labelEs: 'Entrevista',
    description: 'Preguntas y respuestas con expertos',
    detailedDescription: 'Formato de entrevista con preguntas específicas y respuestas detalladas de un experto o emprendedor exitoso.',
    icon: MessageSquare,
    wordCountRange: [800, 1200],
    estimatedReadTime: '4-6 min',
    examples: [
      '5 preguntas a un contador sobre impuestos para PyMEs',
      'Entrevista: Cómo creció su negocio de 2 a 20 empleados',
      'Experto en marketing digital responde tus dudas'
    ],
    whenToUse: 'Para compartir conocimiento experto de forma accesible o contar la historia de un emprendedor exitoso.',
    seoTips: 'Usa "Entrevista:", "Preguntamos a..." en el título. Optimiza cada pregunta como posible featured snippet.',
    promptTemplate: `
Estructura:
- Título tipo "Entrevista:", "5 preguntas a...", "Conversamos con..."
- Intro (2-3 párrafos):
  * Presentación del entrevistado (experiencia, credenciales)
  * Contexto de por qué es relevante esta entrevista
  * Qué aprenderá el lector
- 5-8 preguntas con sus respuestas:
  * Pregunta clara y directa
  * Respuesta sustancial (3-5 párrafos)
  * Cada respuesta debe incluir ejemplos o consejos prácticos
- Cierre con reflexión final o mensaje del entrevistado
- Longitud: 800-1200 palabras

Formato de preguntas:
**Pregunta 1: [Pregunta completa]**

Respuesta del experto explicando con detalle, ejemplos concretos y consejos accionables...

Estilo:
- Preguntas que el emprendedor realmente se hace
- Respuestas conversacionales pero informativas
- Evitar respuestas genéricas; buscar insights únicos
- Balancear teoría con práctica aplicable
`.trim(),
  },

  news: {
    value: 'news',
    label: 'Noticia / Actualización',
    labelEs: 'Noticia',
    description: 'Actualización breve y directa',
    detailedDescription: 'Noticia breve sobre cambios regulatorios, tendencias del mercado o actualizaciones relevantes para emprendedores.',
    icon: Newspaper,
    wordCountRange: [200, 400],
    estimatedReadTime: '1-2 min',
    examples: [
      'Nuevas regulaciones fiscales 2025: Lo que debes saber',
      'IMSS anuncia cambios en seguridad social para PyMEs',
      'Tendencia: El auge del e-commerce en México'
    ],
    whenToUse: 'Para comunicar noticias, actualizaciones regulatorias o tendencias emergentes que los emprendedores deben conocer.',
    seoTips: 'Usa año o fecha en título. Palabras clave: "Nuevo", "Cambios", "Actualización". Optimiza para Google News.',
    promptTemplate: `
Estructura:
- Título noticioso y claro (incluye año o mes si es relevante)
- Lead (1-2 oraciones): Lo más importante primero (qué, quién, cuándo)
- 3-4 párrafos cortos:
  * Contexto de la noticia
  * Detalles importantes
  * Impacto para PyMEs mexicanas
  * Qué deben hacer los emprendedores (acción recomendada)
- Cierre con próximos pasos o dónde obtener más información
- Longitud: 200-400 palabras

Estilo:
- Objetivo y directo
- Información verificable
- Evitar opiniones personales
- Enfocarse en el "¿y esto qué significa para mi negocio?"
- Párrafos ultra cortos (2-3 oraciones máximo)
`.trim(),
  },

  guide: {
    value: 'guide',
    label: 'Guía Completa',
    labelEs: 'Guía',
    description: 'Guía exhaustiva con múltiples secciones',
    detailedDescription: 'Guía comprehensiva que cubre un tema a profundidad. Recurso de referencia con múltiples secciones, ejemplos y herramientas.',
    icon: BookOpen,
    wordCountRange: [1500, 2500],
    estimatedReadTime: '8-12 min',
    examples: [
      'Guía completa de nómina para pequeños negocios en México',
      'Todo lo que necesitas saber sobre facturación electrónica',
      'Guía definitiva: Cómo crear un plan de negocios efectivo'
    ],
    whenToUse: 'Para temas complejos que requieren explicación detallada y sirven como recurso de consulta permanente.',
    seoTips: 'Usa "Guía completa", "Todo sobre", "Guía definitiva". Crea tabla de contenidos. Optimiza para long-tail keywords.',
    promptTemplate: `
Estructura:
- Título tipo "Guía completa de...", "Todo sobre...", "Guía definitiva..."
- Intro (3-4 párrafos):
  * Por qué es importante el tema
  * Qué cubre esta guía
  * Para quién es esta guía
- 6-10 secciones principales con subtítulos (##):
  * Cada sección debe ser autocontenida pero fluir lógicamente
  * Incluir subsecciones (###) cuando sea necesario
  * Usar listas, ejemplos, y tips en cada sección
- Recursos adicionales o herramientas recomendadas
- Conclusión con resumen de puntos clave
- Longitud: 1500-2500 palabras

Estilo:
- Exhaustivo pero organizado
- Usar tabla de contenidos implícita (mencionar secciones en intro)
- Balance entre profundidad y claridad
- Incluir ejemplos prácticos mexicanos
- Citas a fuentes oficiales cuando aplique (SAT, IMSS, etc.)
`.trim(),
  },

  comparison: {
    value: 'comparison',
    label: 'Comparación / Review',
    labelEs: 'Comparación',
    description: 'Comparativa de opciones o herramientas',
    detailedDescription: 'Comparación objetiva entre diferentes opciones, productos, servicios o estrategias para ayudar en la toma de decisiones.',
    icon: Scale,
    wordCountRange: [800, 1200],
    estimatedReadTime: '4-6 min',
    examples: [
      'Sistema POS vs. Caja registradora: ¿Cuál conviene a tu negocio?',
      'Comparativa: Las 5 mejores plataformas de e-commerce para PyMEs',
      'Empleados vs. Freelancers: Qué es mejor para tu startup'
    ],
    whenToUse: 'Cuando el lector necesita decidir entre múltiples opciones y requiere criterios objetivos de comparación.',
    seoTips: 'Usa "vs.", "Comparativa:", "Mejor opción". Crea tablas comparativas. Optimiza para intención de compra.',
    promptTemplate: `
Estructura:
- Título con "vs.", "Comparativa:", o "Las mejores..."
- Intro (2-3 párrafos):
  * El dilema o decisión que enfrenta el lector
  * Criterios de comparación que usarás
  * Breve adelanto de la conclusión
- Sección por cada opción comparada (típicamente 2-5 opciones):
  * Nombre y descripción breve
  * Pros (2-4 puntos)
  * Contras (2-4 puntos)
  * Mejor para: (tipo de negocio o situación)
  * Precio/Inversión aproximada (si aplica)
- Tabla comparativa (opcional pero recomendada)
- Veredicto final: recomendación basada en diferentes escenarios
- Longitud: 800-1200 palabras

Estilo:
- Objetivo e imparcial
- Datos específicos (precios, características, límites)
- Evitar favoritismo sin justificación
- Reconocer que diferentes opciones sirven para diferentes necesidades
- Lenguaje claro y directo
`.trim(),
  },

  infographic: {
    value: 'infographic',
    label: 'Infográfico / Datos',
    labelEs: 'Infográfico',
    description: 'Contenido visual con estadísticas clave',
    detailedDescription: 'Artículo basado en datos y estadísticas presentadas de forma visual y digerible. Ideal para insights numéricos.',
    icon: BarChart3,
    wordCountRange: [400, 700],
    estimatedReadTime: '3-4 min',
    examples: [
      '10 estadísticas que todo emprendedor debe conocer en 2025',
      'En números: El crecimiento del e-commerce en México',
      'Infográfico: Cuánto cuesta realmente abrir un negocio'
    ],
    whenToUse: 'Para presentar datos, estadísticas o información numérica de forma atractiva y memorable.',
    seoTips: 'Usa "estadísticas", "en números", "datos". Incluye año. Optimiza para image search y Pinterest.',
    promptTemplate: `
Estructura:
- Título tipo "X estadísticas...", "En números:", "Infográfico:"
- Intro breve (2 párrafos):
  * Por qué estos datos son importantes
  * Fuente de la información (si aplica)
- 5-10 datos/estadísticas presentados visualmente:
  * Cada stat en su propia mini-sección
  * Número destacado con contexto
  * Explicación breve (2-3 oraciones) de qué significa
  * Implicación práctica para el lector
- Conclusión: Qué nos dicen estos números en conjunto
- Longitud: 400-700 palabras

Formato de cada stat:
**📊 [Número o porcentaje]**
[Título del dato]

Explicación breve del contexto y significado...

**💡 Lo que esto significa para ti:** [Implicación práctica]

Estilo:
- Números precisos y verificables
- Contexto para cada dato (no solo números sueltos)
- Visual incluso en texto (usa emojis, negritas, espaciado)
- Conectar datos con decisiones de negocio
- Fuentes confiables (INEGI, estudios, reportes oficiales)
`.trim(),
  },
};

/**
 * Array of all format values for iteration
 */
export const ALL_FORMATS = Object.values(FORMAT_CONFIG);

/**
 * Get format configuration by value
 */
export function getFormatConfig(format?: string | null): FormatConfig {
  const safeFormat = (format && FORMAT_CONFIG[format as ContentFormat]) ? (format as ContentFormat) : 'listicle';
  return FORMAT_CONFIG[safeFormat];
}

/**
 * Get Spanish label for a format
 */
export function getFormatLabel(format?: string | null): string {
  if (!format) return 'Artículo';
  const config = FORMAT_CONFIG[format as ContentFormat];
  return config?.labelEs || 'Artículo';
}

/**
 * Get icon component for a format
 */
export function getFormatIcon(format: ContentFormat): LucideIcon {
  return FORMAT_CONFIG[format].icon;
}

/**
 * Get AI prompt template for content generation
 */
export function getFormatPrompt(format: ContentFormat): string {
  return FORMAT_CONFIG[format].promptTemplate;
}

/**
 * Get word count range for a format
 */
export function getFormatWordCount(format: ContentFormat): [number, number] {
  return FORMAT_CONFIG[format].wordCountRange;
}

/**
 * Format options for UI components (compatible with existing implementations)
 */
export const formatOptions = ALL_FORMATS.map(config => ({
  value: config.value,
  label: config.label,
  description: config.description,
  icon: config.icon,
}));
