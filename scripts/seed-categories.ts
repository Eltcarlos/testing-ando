import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CategoryCSVRow {
  _id: string;
  slug: string;
  label: string;
  icon: string;
  isDefault: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string; // Para las columnas de topics[n]
}

interface CategoryData {
  id: string;
  slug: string;
  label: string;
  icon: string;
  isDefault: boolean;
  createdBy: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

async function loadCategoriesFromCSV(csvPath: string): Promise<CategoryData[]> {
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CategoryCSVRow[];

  return records.map((row) => {
    // Extraer los topics de las columnas topics[0], topics[1], etc.
    const topics: string[] = [];
    let topicIndex = 0;
    
    while (row[`topics[${topicIndex}]`]) {
      const topic = row[`topics[${topicIndex}]`].trim();
      if (topic) {
        topics.push(topic);
      }
      topicIndex++;
    }

    return {
      id: row._id,
      slug: row.slug,
      label: row.label,
      icon: row.icon,
      isDefault: row.isDefault.toLowerCase() === 'true',
      createdBy: row.createdBy,
      topics,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  });
}

async function seedCategories() {
  try {
    console.log('🚀 Iniciando seed de categorías...');

    // Ruta al archivo CSV - primero intenta en el directorio scripts, luego en Downloads
    let csvPath = path.join(process.cwd(), 'scripts', 'coparmex.categories.csv');
    
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(process.env.HOME || '', 'Downloads', 'coparmex.categories.csv');
    }
    
    // Verificar si el archivo existe
    if (!fs.existsSync(csvPath)) {
      throw new Error(
        `Archivo CSV no encontrado.\n` +
        `Buscado en:\n` +
        `  - ${path.join(process.cwd(), 'scripts', 'coparmex.categories.csv')}\n` +
        `  - ${csvPath}\n\n` +
        `Por favor, copia el archivo coparmex.categories.csv al directorio scripts/`
      );
    }

    console.log(`📂 Leyendo categorías desde: ${csvPath}`);
    const categories = await loadCategoriesFromCSV(csvPath);
    
    console.log(`📊 Se encontraron ${categories.length} categorías para insertar`);

    // Eliminar categorías por defecto existentes (opcional)
    const deleteResult = await prisma.categories.deleteMany({
      where: { isDefault: true },
    });
    console.log(`🗑️  Se eliminaron ${deleteResult.count} categorías por defecto existentes`);

    // Insertar las nuevas categorías
    let insertedCount = 0;
    
    for (const category of categories) {
      try {
        await prisma.categories.create({
          data: {
            id: category.id,
            slug: category.slug,
            label: category.label,
            icon: category.icon,
            isDefault: category.isDefault,
            createdBy: category.createdBy,
            topics: category.topics,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          },
        });
        insertedCount++;
        console.log(`✅ Categoría insertada: ${category.label} (${category.slug})`);
      } catch (error: any) {
        console.error(`❌ Error al insertar categoría ${category.label}:`, error.message);
      }
    }

    console.log(`\n✨ Seed completado! ${insertedCount}/${categories.length} categorías insertadas`);
    
    // Mostrar resumen
    console.log('\n📋 Resumen de categorías:');
    categories.forEach((cat) => {
      console.log(`  - ${cat.label}: ${cat.topics.length} temas`);
    });

  } catch (error) {
    console.error('💥 Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
