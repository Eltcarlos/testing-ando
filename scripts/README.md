# Scripts de Seed

## Seed de Categorías

Este script carga las categorías por defecto desde un archivo CSV a la base de datos MongoDB.

### Uso

```bash
pnpm db:seed:categories
```

### Archivo CSV

El script busca el archivo `coparmex.categories.csv` en las siguientes ubicaciones (en orden):
1. `scripts/coparmex.categories.csv` (recomendado)
2. `~/Downloads/coparmex.categories.csv`

### Formato del CSV

El archivo CSV debe tener las siguientes columnas:
- `_id`: ID único de la categoría
- `slug`: Slug único para URLs
- `label`: Nombre de la categoría
- `icon`: Nombre del ícono (de lucide-react)
- `isDefault`: `true` para categorías por defecto
- `createdBy`: Email del creador (ej: `system@coparmex.org`)
- `topics[0]` a `topics[n]`: Temas de la categoría
- `createdAt`: Fecha de creación (ISO 8601)
- `updatedAt`: Fecha de actualización (ISO 8601)

### Comportamiento

- **Elimina** todas las categorías por defecto existentes (`isDefault: true`)
- **Inserta** las nuevas categorías del CSV
- Cada categoría incluye sus temas asociados

### Ejemplo de Categorías Cargadas

Las categorías incluidas son:
- **Ventas** - 8 temas sobre ventas y prospección
- **Finanzas** - 8 temas sobre finanzas para PyMEs
- **Operaciones** - 8 temas sobre operaciones y procesos
- **Legal y Fiscal** - 8 temas sobre cumplimiento legal
- **Recursos Humanos** - 8 temas sobre gestión de personal
- **Liderazgo** - 8 temas sobre liderazgo empresarial
- **Marketing** - 8 temas sobre marketing digital
- **Tecnología** - 8 temas sobre herramientas digitales

### Notas

- Las categorías por defecto (`isDefault: true`) están disponibles para todos los usuarios
- Cada categoría tiene un slug único que se usa en las URLs
- Los íconos son de la librería [lucide-react](https://lucide.dev/)
