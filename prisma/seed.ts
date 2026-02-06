import {
  PrismaClient,
  CourseCategory,
  CourseLevel,
  CourseStatus,
  LessonType,
  Currency,
} from "@prisma/client";
import { courses } from "../data/courses";

const prisma = new PrismaClient();

// Map old category names to Prisma enums
function mapCategory(category: string): CourseCategory {
  const categoryMap: Record<string, CourseCategory> = {
    Finanzas: CourseCategory.finance,
    "Marketing Digital": CourseCategory.digital_marketing,
    Operaciones: CourseCategory.operations,
    "Recursos Humanos": CourseCategory.human_capital,
    "Legal y Fiscal": CourseCategory.legal,
    Ventas: CourseCategory.sales,
    Liderazgo: CourseCategory.human_capital,
    Tecnología: CourseCategory.technology,
    Administración: CourseCategory.operations,
  };
  return categoryMap[category] || CourseCategory.operations;
}

// Map old difficulty levels to Prisma enums
function mapLevel(difficulty: string): CourseLevel {
  const levelMap: Record<string, CourseLevel> = {
    Principiante: CourseLevel.basic,
    Intermedio: CourseLevel.intermediate,
    Avanzado: CourseLevel.advanced,
  };
  return levelMap[difficulty] || CourseLevel.basic;
}

// Map sponsors to entities
function mapEntity(sponsor: string): string {
  if (sponsor.toLowerCase().includes("coparmex")) return "COPARMEX";
  if (sponsor.toLowerCase().includes("santander")) return "Sponsor A";
  if (sponsor.toLowerCase().includes("bbva")) return "Sponsor A";
  if (sponsor.toLowerCase().includes("banco")) return "Sponsor A";
  if (sponsor.toLowerCase().includes("bimbo")) return "Sponsor B";
  if (sponsor.toLowerCase().includes("cemex")) return "Sponsor B";
  if (sponsor.toLowerCase().includes("telmex")) return "Sponsor B";
  if (sponsor.toLowerCase().includes("microsoft")) return "Sponsor B";
  if (sponsor.toLowerCase().includes("liverpool")) return "Aliado";
  return "Aliado";
}

// Generate status based on index (for variety)
function getStatus(index: number, isFeatured: boolean): CourseStatus {
  if (index <= 7) return CourseStatus.published;
  if (index === 8) return CourseStatus.draft;
  if (index === 9) return CourseStatus.draft;
  return CourseStatus.published;
}

// Default content categories for editorial feature
const defaultCategories = [
  {
    slug: 'ventas',
    label: 'Ventas',
    icon: 'TrendingUp',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Cómo cerrar más ventas en frío',
      '5 objeciones comunes y cómo manejarlas',
      'Scripts de seguimiento que sí funcionan',
      'Cómo calcular tu costo de adquisición de clientes',
      'Técnicas de upselling para PyMEs',
      'Cómo armar un pitch de 30 segundos',
      'Errores que alejan a tus prospectos',
      'Cómo pedir referidos sin ser incómodo',
    ],
  },
  {
    slug: 'finanzas',
    label: 'Finanzas',
    icon: 'Wallet',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Cómo leer un estado de resultados',
      'Flujo de efectivo: la métrica que salva negocios',
      'Cuándo y cómo subir precios',
      'Cómo calcular tu punto de equilibrio',
      'Separar finanzas personales y del negocio',
      'Indicadores financieros que debes revisar cada mes',
      'Cómo prepararte para una auditoría del SAT',
      'Financiamiento para PyMEs: opciones reales',
    ],
  },
  {
    slug: 'operaciones',
    label: 'Operaciones',
    icon: 'Settings',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Cómo documentar procesos sin morir en el intento',
      'Control de inventario para no expertos',
      'Métricas de productividad que sí importan',
      'Cómo delegar efectivamente',
      'Checklist para abrir/cerrar tu negocio cada día',
      'Cómo manejar proveedores difíciles',
      'Reducir costos sin afectar calidad',
      'Automatizaciones simples que ahorran horas',
    ],
  },
  {
    slug: 'legal-fiscal',
    label: 'Legal y Fiscal',
    icon: 'FileText',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Qué es el CFDI 4.0 y cómo te afecta',
      'Obligaciones fiscales básicas de una PyME',
      'Cómo registrar tu marca en el IMPI',
      'Contratos que todo negocio debe tener',
      'Qué hacer si recibes una carta del SAT',
      'REPSE: qué es y quién debe registrarse',
      'Diferencias entre persona física y moral',
      'Cómo facturar correctamente',
    ],
  },
  {
    slug: 'rrhh',
    label: 'Recursos Humanos',
    icon: 'Users',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Cómo reducir rotación de personal',
      'Onboarding efectivo en 5 pasos',
      'Cómo dar feedback difícil',
      'Estructura de compensación para PyMEs',
      'Obligaciones patronales con el IMSS',
      'Cómo hacer entrevistas que sí funcionen',
      'Cultura organizacional con poco presupuesto',
      'Cómo manejar conflictos entre empleados',
    ],
  },
  {
    slug: 'liderazgo',
    label: 'Liderazgo',
    icon: 'Target',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Cómo llevar un consejo de administración',
      'Reuniones efectivas: menos tiempo, más resultados',
      'Cómo tomar decisiones difíciles',
      'El rol del fundador vs el rol del director',
      'Cómo comunicar malas noticias al equipo',
      'Planeación estratégica simplificada',
      'Cómo manejar el estrés de ser empresario',
      'Mentoría: cómo encontrar y aprovechar un mentor',
    ],
  },
  {
    slug: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Marketing digital con $5,000 pesos al mes',
      'Cómo crear contenido sin ser experto',
      'Google My Business: guía completa',
      'Redes sociales: cuál elegir para tu negocio',
      'Cómo pedir reseñas a tus clientes',
      'Email marketing para principiantes',
      'Cómo diferenciarte de la competencia',
      'Errores comunes en publicidad de PyMEs',
    ],
  },
  {
    slug: 'tecnologia',
    label: 'Tecnología',
    icon: 'Laptop',
    isDefault: true,
    createdBy: 'system@coparmex.org',
    topics: [
      'Herramientas gratuitas para digitalizar tu negocio',
      'Cómo elegir un sistema de punto de venta',
      'Ciberseguridad básica para PyMEs',
      'CRM: qué es y por qué lo necesitas',
      'Automatizar WhatsApp Business',
      'Cómo evaluar si necesitas una app',
      'Respaldos: protege la información de tu negocio',
      'Inteligencia artificial práctica para PyMEs',
    ],
  },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Seed content categories (new feature)
  console.log(" Seeding content categories...");

  try {
    const categoriesWithTimestamps = defaultCategories.map(cat => ({
      ...cat,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await prisma.categories.createMany({
      data: categoriesWithTimestamps,
    });
    console.log(` Seeded ${result.count} new categories\n`);
  } catch (error) {
    console.log(' Categories may already exist, skipping...\n');
  }

  // Clear existing courses
  console.log("Clearing existing courses...");
  try {
    await prisma.course.deleteMany();
    console.log("Cleared existing courses\n");
  } catch (error) {
    console.log("Note: deleteMany requires MongoDB replica set. Skipping course deletion.\n");
  }

  // Seed courses
  console.log("📚 Seeding courses...");
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const status = getStatus(i, course.isFeatured || false);

    try {
      // Create modules from lessons (group into 3 modules)
      const lessonsPerModule = Math.ceil(course.lessons.length / 3);
      const modules = [];

      for (let moduleIdx = 0; moduleIdx < 3; moduleIdx++) {
        const moduleTitles = [
          "Introducción al Curso",
          "Desarrollo de Habilidades",
          "Aplicación Práctica",
        ];
        const moduleDescriptions = [
          "Comienza tu aprendizaje con los conceptos fundamentales",
          "Profundiza en técnicas y metodologías",
          "Aplica lo aprendido en casos reales",
        ];

        const startIdx = moduleIdx * lessonsPerModule;
        const endIdx = Math.min(
          startIdx + lessonsPerModule,
          course.lessons.length
        );
        const moduleLessons = course.lessons.slice(startIdx, endIdx);

        if (moduleLessons.length > 0) {
          modules.push({
            id: `${course.id}-module-${moduleIdx + 1}`,
            title: moduleTitles[moduleIdx],
            description: moduleDescriptions[moduleIdx],
            order: moduleIdx + 1,
            lessons: moduleLessons.map((lesson, lessonIdx) => ({
              id: lesson.id,
              title: lesson.title,
              type:
                moduleIdx === 2 && lessonIdx % 2 === 0
                  ? LessonType.quiz
                  : moduleIdx === 1 && lessonIdx % 3 === 0
                  ? LessonType.article
                  : LessonType.video,
              contentUrl: `https://example.com/video/${lesson.id}`,
              duration: `${lesson.duration} min`,
              order: lessonIdx + 1,
            })),
          });
        }
      }

      await prisma.course.create({
        data: {
          title: course.title,
          description: course.description,
          category: mapCategory(course.category),
          level: mapLevel(course.difficulty),
          instructor: {
            name: course.instructor.name,
            bio: course.instructor.bio,
            avatar: course.instructor.avatar || null,
          },
          entity: mapEntity(course.sponsoredBy || "COPARMEX"),
          thumbnail: course.thumbnail,
          duration: `${course.duration} horas`,
          language: "es",
          price: {
            isFree: true,
            amount: null,
            currency: Currency.mxn,
          },
          prerequisites: course.requirements || [],
          tags: course.tags || [],
          modules,
          status,
          featured: course.isFeatured,
          isNew: course.isNew,
          metrics: {
            views: course.studentsEnrolled * Math.floor(Math.random() * 3 + 2),
            enrollments: course.studentsEnrolled,
            completions: Math.floor(
              course.studentsEnrolled * (0.5 + Math.random() * 0.3)
            ),
            completionRate: Math.floor(50 + Math.random() * 30),
            averageRating: course.rating,
            totalRatings: course.totalRatings,
            averageTimeToComplete: `${Math.floor(
              course.duration * 0.8 + Math.random() * course.duration * 0.4
            )} días`,
          },
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          publishedAt:
            status === CourseStatus.published ? course.createdAt : null,
        },
      });

      successCount++;
      console.log(`   Created: ${course.title}`);
    } catch (error) {
      errorCount++;
      console.error(`  Failed: ${course.title}`, error);
    }
  }

  console.log(`\n📊 Seed summary:`);
  console.log(`    Successfully created: ${successCount} courses`);
  if (errorCount > 0) {
    console.log(`   Failed: ${errorCount} courses`);
  }

  // Print counts by status
  const [published, draft, archived] = await Promise.all([
    prisma.course.count({ where: { status: CourseStatus.published } }),
    prisma.course.count({ where: { status: CourseStatus.draft } }),
    prisma.course.count({ where: { status: CourseStatus.archived } }),
  ]);

  console.log(`\n📈 Courses by status:`);
  console.log(`   📗 Published: ${published}`);
  console.log(`   📝 Draft: ${draft}`);
  console.log(`   📦 Archived: ${archived}`);

  console.log("\n🎉 Database seed completed!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
