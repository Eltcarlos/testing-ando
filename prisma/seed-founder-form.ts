import { PrismaClient, QuestionType } from '@prisma/client';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed script for creating the default Founder Form with questions from PDF
 * "Cuestionario para empresas fundadoras - Crece Mi Negocio"
 */

async function seedFounderForm() {
  console.log('🌱 Seeding Founder Form...');

  // Use MongoDB client directly to avoid transaction requirements
  const mongoClient = new MongoClient(process.env.DATABASE_URL!);

  try {
    await mongoClient.connect();
    const db = mongoClient.db();
    const collection = db.collection('founder_forms');

    // Check if form already exists and delete it if it does (to allow re-seeding)
    const existingForm = await collection.findOne({ slug: 'empresas-fundadoras' });
    if (existingForm) {
      console.log('⚠️  Found existing founder form. Deleting to re-seed...');
      await collection.deleteOne({ slug: 'empresas-fundadoras' });
    }

    // Create the founder form with all 7 sections and questions
    const founderFormData = {
      name: 'Cuestionario para Empresas Fundadoras',
      description: 'Formulario oficial para empresas fundadoras de Crece Mi Negocio - COPARMEX',
      slug: 'empresas-fundadoras',
      status: 'active',
      version: 1,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        allowSaveDraft: true,
        showProgressBar: true,
        submitMessage: '¡Gracias! Tu información ha sido enviada exitosamente. El equipo de Crece Mi Negocio se pondrá en contacto contigo pronto.',
      },
      questions: [
        // ==================== SECTION 1: Identidad y Credenciales ====================
        {
          order: 1,
          section: 'Identidad y Credenciales',
          sectionOrder: 1,
          type: QuestionType.short_text,
          label: 'Nombre Comercial',
          description: 'Nombre con el que se conoce tu empresa',
          required: true,
          options: [],
          validation: {
            minLength: 2,
            maxLength: 100,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 2,
          section: 'Identidad y Credenciales',
          sectionOrder: 2,
          type: QuestionType.short_text,
          label: 'Razón Social',
          description: 'Nombre legal registrado de tu empresa',
          required: true,
          options: [],
          validation: {
            minLength: 2,
            maxLength: 150,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 3,
          section: 'Identidad y Credenciales',
          sectionOrder: 3,
          type: QuestionType.long_text,
          label: 'Descripción corta (Elevator Pitch)',
          description: 'En una frase, ¿qué hacen? ¿Qué narrativa buscan impulsar en Crece Mi Negocio?',
          required: true,
          options: [],
          validation: {
            minLength: 20,
            maxLength: 500,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 4,
          section: 'Identidad y Credenciales',
          sectionOrder: 4,
          type: QuestionType.multi_select,
          label: 'Certificaciones y Alianzas',
          description: '¿Pertenecen a alguna comisión de COPARMEX?',
          required: false,
          options: [
            { value: 'comision_juridica', label: 'Comisión Jurídica' },
            { value: 'comision_fiscal', label: 'Comisión Fiscal' },
            { value: 'comision_comercio', label: 'Comisión de Comercio' },
            { value: 'comision_innovacion', label: 'Comisión de Innovación y Tecnología' },
            { value: 'comision_emprendedores', label: 'Comisión de Emprendedores' },
            { value: 'comision_mipymes', label: 'Comisión de MIPyMES' },
            { value: 'comision_capital_humano', label: 'Comisión de Capital Humano' },
            { value: 'otra', label: 'Otra comisión' },
            { value: 'ninguna', label: 'No pertenecemos a ninguna comisión' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 5,
          section: 'Identidad y Credenciales',
          sectionOrder: 5,
          type: QuestionType.multi_select,
          label: 'Ubicación y Cobertura - Estados',
          description: '¿En qué estados de México tienen presencia?',
          required: true,
          options: [
            { value: 'aguascalientes', label: 'Aguascalientes' },
            { value: 'baja_california', label: 'Baja California' },
            { value: 'baja_california_sur', label: 'Baja California Sur' },
            { value: 'campeche', label: 'Campeche' },
            { value: 'chiapas', label: 'Chiapas' },
            { value: 'chihuahua', label: 'Chihuahua' },
            { value: 'cdmx', label: 'Ciudad de México' },
            { value: 'coahuila', label: 'Coahuila' },
            { value: 'colima', label: 'Colima' },
            { value: 'durango', label: 'Durango' },
            { value: 'guanajuato', label: 'Guanajuato' },
            { value: 'guerrero', label: 'Guerrero' },
            { value: 'hidalgo', label: 'Hidalgo' },
            { value: 'jalisco', label: 'Jalisco' },
            { value: 'mexico', label: 'Estado de México' },
            { value: 'michoacan', label: 'Michoacán' },
            { value: 'morelos', label: 'Morelos' },
            { value: 'nayarit', label: 'Nayarit' },
            { value: 'nuevo_leon', label: 'Nuevo León' },
            { value: 'oaxaca', label: 'Oaxaca' },
            { value: 'puebla', label: 'Puebla' },
            { value: 'queretaro', label: 'Querétaro' },
            { value: 'quintana_roo', label: 'Quintana Roo' },
            { value: 'san_luis_potosi', label: 'San Luis Potosí' },
            { value: 'sinaloa', label: 'Sinaloa' },
            { value: 'sonora', label: 'Sonora' },
            { value: 'tabasco', label: 'Tabasco' },
            { value: 'tamaulipas', label: 'Tamaulipas' },
            { value: 'tlaxcala', label: 'Tlaxcala' },
            { value: 'veracruz', label: 'Veracruz' },
            { value: 'yucatan', label: 'Yucatán' },
            { value: 'zacatecas', label: 'Zacatecas' },
            { value: 'nacional', label: 'Cobertura Nacional' },
            { value: 'internacional', label: 'Cobertura Internacional' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 6,
          section: 'Identidad y Credenciales',
          sectionOrder: 6,
          type: QuestionType.long_text,
          label: 'Ciudades específicas',
          description: 'Menciona las ciudades específicas donde operan',
          required: false,
          options: [],
          validation: {
            maxLength: 500,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 2: Mapeo de Intenciones ====================
        {
          order: 7,
          section: 'Mapeo de Intenciones',
          sectionOrder: 1,
          type: QuestionType.long_text,
          label: 'Top 5-10 intenciones en la plataforma',
          description: 'Lista de 5 a 10 intenciones específicas que tengan en la plataforma. Ejemplo: "Tengo un bufete de abogados y quiero aparecer en las primeras búsquedas", "Quiero promocionar mis soluciones de TI"',
          required: true,
          options: [],
          validation: {
            minLength: 50,
            maxLength: 2000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 8,
          section: 'Mapeo de Intenciones',
          sectionOrder: 2,
          type: QuestionType.long_text,
          label: 'Descripción y detalle de iniciativas prioritarias',
          description: 'Describe tus iniciativas más prioritarias y cómo las podemos mapear en la plataforma',
          required: true,
          options: [],
          validation: {
            minLength: 50,
            maxLength: 2000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 9,
          section: 'Mapeo de Intenciones',
          sectionOrder: 3,
          type: QuestionType.long_text,
          label: 'Palabras Clave de la Industria',
          description: 'Términos técnicos que sus clientes usan. Ejemplo: "NOM035", "REPSE", "Factoraje", "CFDI 4.0"',
          required: true,
          options: [],
          validation: {
            minLength: 10,
            maxLength: 1000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 10,
          section: 'Mapeo de Intenciones',
          sectionOrder: 4,
          type: QuestionType.long_text,
          label: '¿En qué situaciones SÍ quieres que 29 recomiende tu empresa?',
          description: 'Ejemplos concretos de frases del usuario. Ejemplo: "Quiero exportar a EUA", "Quiero automatizar mi WhatsApp de ventas"',
          required: true,
          options: [],
          validation: {
            minLength: 30,
            maxLength: 1500,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 11,
          section: 'Mapeo de Intenciones',
          sectionOrder: 5,
          type: QuestionType.long_text,
          label: '¿En qué situaciones NO quieres que se recomiende?',
          description: 'Ejemplo: empresas demasiado pequeñas, sectores que no atiendes, tickets muy bajos, etc.',
          required: true,
          options: [],
          validation: {
            minLength: 20,
            maxLength: 1000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 12,
          section: 'Mapeo de Intenciones',
          sectionOrder: 6,
          type: QuestionType.multi_select,
          label: 'Nivel de formalización que mejor atienden',
          description: 'Selecciona los niveles de formalización de empresas que mejor atienden',
          required: true,
          options: [
            { value: 'informal', label: 'Informal - Empresas sin registro formal' },
            { value: 'en_proceso', label: 'En proceso de formalización' },
            { value: 'formalizada', label: 'Formalizada - Con registro completo' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 13,
          section: 'Mapeo de Intenciones',
          sectionOrder: 7,
          type: QuestionType.multi_select,
          label: 'Tipo de impacto que buscan generar',
          description: 'Alineado al ICP de Crece mi Negocio',
          required: true,
          options: [
            { value: 'crecimiento_ventas', label: 'Crecimiento de ventas' },
            { value: 'reduccion_costos', label: 'Reducción de costos' },
            { value: 'profesionalizacion', label: 'Profesionalización de gestión' },
            { value: 'expansion', label: 'Expansión y escalamiento' },
            { value: 'transformacion_digital', label: 'Transformación digital' },
            { value: 'cumplimiento_legal', label: 'Cumplimiento legal y fiscal' },
            { value: 'financiamiento', label: 'Acceso a financiamiento' },
            { value: 'innovacion', label: 'Innovación y desarrollo' },
            { value: 'exportacion', label: 'Exportación e internacionalización' },
            { value: 'capital_humano', label: 'Desarrollo de capital humano' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 14,
          section: 'Mapeo de Intenciones',
          sectionOrder: 8,
          type: QuestionType.long_text,
          label: 'Palabras clave y temas para el RAG',
          description: 'Términos con los que deberían asociarse. Ejemplo: "facturación electrónica", "NOM", "exportación", "automatización de ventas", etc.',
          required: true,
          options: [],
          validation: {
            minLength: 10,
            maxLength: 1000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 3: Activos de Conocimiento ====================
        {
          order: 15,
          section: 'Activos de Conocimiento',
          sectionOrder: 1,
          type: QuestionType.long_text,
          label: 'Top 10 Preguntas Frecuentes (FAQs)',
          description: '¿Qué preguntan los usuarios de Crece mi Negocio sobre tu empresa? Esto permite que "29" responda dudas técnicas usando la voz del experto.',
          required: true,
          options: [],
          validation: {
            minLength: 100,
            maxLength: 3000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 16,
          section: 'Activos de Conocimiento',
          sectionOrder: 2,
          type: QuestionType.file,
          label: 'Catálogo de Servicios/Productos',
          description: 'PDF o documento estructurado con alcances claros de tus servicios o productos',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
            maxFileSize: 10485760, // 10MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 17,
          section: 'Activos de Conocimiento',
          sectionOrder: 3,
          type: QuestionType.long_text,
          label: 'Enlaces a contenido educativo',
          description: 'Links a blogs, webinars, guías que pueda usar 29 como contexto',
          required: false,
          options: [],
          validation: {
            maxLength: 2000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 4: Diferenciación y Filtros ====================
        {
          order: 18,
          section: 'Diferenciación y Filtros',
          sectionOrder: 1,
          type: QuestionType.long_text,
          label: 'Perfil de Cliente Ideal (ICP)',
          description: '¿A quién NO atienden? Ejemplo: "No atendemos empresas con menos de 5 empleados" o "Solo sector industrial". Esto evita malas recomendaciones.',
          required: true,
          options: [],
          validation: {
            minLength: 20,
            maxLength: 1000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 19,
          section: 'Diferenciación y Filtros',
          sectionOrder: 2,
          type: QuestionType.long_text,
          label: 'Propuesta Única de Valor',
          description: '¿Por qué elegirlos a ustedes sobre la competencia? Ejemplo: "Somos los únicos con garantía de cero multas"',
          required: true,
          options: [],
          validation: {
            minLength: 30,
            maxLength: 800,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 5: Actionables ====================
        {
          order: 20,
          section: 'Actionables',
          sectionOrder: 1,
          type: QuestionType.short_text,
          label: 'Deep Link - WhatsApp de ventas',
          description: 'Link directo a WhatsApp de ventas (formato: https://wa.me/52XXXXXXXXXX)',
          required: false,
          options: [],
          validation: {
            maxLength: 200,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 21,
          section: 'Actionables',
          sectionOrder: 2,
          type: QuestionType.short_text,
          label: 'Deep Link - Agendar cita',
          description: 'Link a Calendly u otra herramienta para agendar citas',
          required: false,
          options: [],
          validation: {
            maxLength: 200,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 22,
          section: 'Actionables',
          sectionOrder: 3,
          type: QuestionType.short_text,
          label: 'Deep Link - Lead Magnet',
          description: 'Link a descarga de E-book, plantilla u otro material descargable',
          required: false,
          options: [],
          validation: {
            maxLength: 200,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 23,
          section: 'Actionables',
          sectionOrder: 4,
          type: QuestionType.long_text,
          label: 'Promoción Exclusiva para la Comunidad',
          description: '¿Ofrecen algún descuento o beneficio por venir de Crece Mi Negocio? Ejemplo: "Primera asesoría gratis" o "15% de descuento"',
          required: false,
          options: [],
          validation: {
            maxLength: 500,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 6: Marca y Materiales ====================
        {
          order: 24,
          section: 'Marca y Materiales',
          sectionOrder: 1,
          type: QuestionType.file,
          label: 'Logotipo - Versión horizontal clara',
          description: 'Logo en alta resolución, fondo claro/transparente, orientación horizontal',
          required: true,
          options: [],
          validation: {
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
            maxFileSize: 5242880, // 5MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 25,
          section: 'Marca y Materiales',
          sectionOrder: 2,
          type: QuestionType.file,
          label: 'Logotipo - Versión cuadrada clara',
          description: 'Logo en alta resolución, fondo claro/transparente, orientación cuadrada',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
            maxFileSize: 5242880, // 5MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 26,
          section: 'Marca y Materiales',
          sectionOrder: 3,
          type: QuestionType.file,
          label: 'Logotipo - Versión oscura (opcional)',
          description: 'Logo para fondos oscuros, si aplica',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
            maxFileSize: 5242880, // 5MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 27,
          section: 'Marca y Materiales',
          sectionOrder: 4,
          type: QuestionType.file,
          label: 'Manual de marca',
          description: 'Lineamientos básicos: colores, tipografía, tono de comunicación',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['application/pdf'],
            maxFileSize: 10485760, // 10MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 28,
          section: 'Marca y Materiales',
          sectionOrder: 5,
          type: QuestionType.short_text,
          label: 'Claim o frase de marca',
          description: 'Ejemplo: "automatizamos tus ventas por WhatsApp"',
          required: false,
          options: [],
          validation: {
            maxLength: 150,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 29,
          section: 'Marca y Materiales',
          sectionOrder: 6,
          type: QuestionType.short_text,
          label: 'Texto promocional corto (máx. 140 caracteres)',
          description: 'Para Home / mosaico de logos y listados en comunidad',
          required: true,
          options: [],
          validation: {
            maxLength: 140,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 30,
          section: 'Marca y Materiales',
          sectionOrder: 7,
          type: QuestionType.long_text,
          label: 'Texto descriptivo largo',
          description: 'Para ficha completa de la empresa en la plataforma',
          required: true,
          options: [],
          validation: {
            minLength: 100,
            maxLength: 2000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 31,
          section: 'Marca y Materiales',
          sectionOrder: 8,
          type: QuestionType.file,
          label: 'Material descargable',
          description: 'Brochure PDF, one-pager, checklist, etc.',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            maxFileSize: 10485760, // 10MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 32,
          section: 'Marca y Materiales',
          sectionOrder: 9,
          type: QuestionType.file,
          label: 'Imágenes de producto/servicio',
          description: 'Mockups, fotos de equipo, imágenes representativas',
          required: false,
          options: [],
          validation: {
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/webp'],
            maxFileSize: 10485760, // 10MB
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // ==================== SECTION 7: Permisos y Reglas ====================
        {
          order: 33,
          section: 'Permisos y Reglas',
          sectionOrder: 1,
          type: QuestionType.multi_select,
          label: 'Autorización de uso - Ubicaciones',
          description: 'Autorizan que su logo y nombre se usen en:',
          required: true,
          options: [
            { value: 'home', label: 'Home de la plataforma' },
            { value: 'marketplace', label: 'Comunidad/Marketplace' },
            { value: 'agente_29', label: 'Conversaciones del agente 29' },
            { value: 'contenido_educativo', label: 'Contenido educativo y blog' },
            { value: 'redes_sociales', label: 'Redes sociales de Crece Mi Negocio' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 34,
          section: 'Permisos y Reglas',
          sectionOrder: 2,
          type: QuestionType.single_select,
          label: 'Etiqueta como Empresa Fundadora',
          description: '¿Cómo prefieren ser identificados?',
          required: true,
          options: [
            { value: 'fundadora', label: 'Empresa Fundadora' },
            { value: 'patrocinador_a', label: 'Patrocinador Nivel A' },
            { value: 'patrocinador_b', label: 'Patrocinador Nivel B' },
            { value: 'patrocinador_c', label: 'Patrocinador Nivel C' },
            { value: 'aliado_estrategico', label: 'Aliado Estratégico' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 35,
          section: 'Permisos y Reglas',
          sectionOrder: 3,
          type: QuestionType.single_select,
          label: 'Tono de comunicación preferido',
          description: '¿Cómo quieren ser nombrados?',
          required: true,
          options: [
            { value: 'formal', label: 'Formal - Usted, lenguaje profesional' },
            { value: 'cercano', label: 'Cercano - Tú, lenguaje accesible' },
            { value: 'mixto', label: 'Mixto - Según el contexto' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 36,
          section: 'Permisos y Reglas',
          sectionOrder: 4,
          type: QuestionType.single_select,
          label: 'Etiquetado de recomendaciones patrocinadas',
          description: '¿Desean que se etiquete la recomendación como "patrocinada" cuando aplique?',
          required: true,
          options: [
            { value: 'si', label: 'Sí, etiquetar como "Patrocinado"' },
            { value: 'no', label: 'No, presentar como recomendación orgánica' },
            { value: 'segun_contexto', label: 'Según lo defina el contrato' },
          ],
          validation: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          order: 37,
          section: 'Permisos y Reglas',
          sectionOrder: 5,
          type: QuestionType.long_text,
          label: 'Límites de segmentación contractual',
          description: 'Categorías, estados, tipos de empresa que pueden recibir sus recomendaciones según su contrato',
          required: false,
          options: [],
          validation: {
            maxLength: 1000,
          },
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Add unique IDs to all questions that don't have one
    founderFormData.questions = founderFormData.questions.map((q: any) => ({
      ...q,
      id: q.id || randomUUID(),
    }));

    const result = await collection.insertOne(founderFormData);

    console.log(`✅ Founder form created: ${founderFormData.name} (${founderFormData.slug})`);
    console.log(`   - ${founderFormData.questions.length} questions across 7 sections`);
    console.log(`   - Status: ${founderFormData.status}`);
    console.log(`   - ID: ${result.insertedId}`);
  } finally {
    await mongoClient.close();
  }
}

async function main() {
  try {
    await seedFounderForm();
    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
