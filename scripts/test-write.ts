// scripts/test-write.ts
import * as fs from 'fs';
import * as path from 'path';

console.log("🧪 Iniciando prueba de escritura...");

// 1. Definir ruta
const outputDir = path.join(process.cwd(), 'src', 'data');
const outputPath = path.join(outputDir, 'video-db.json');

console.log(`📂 Intentando escribir en: ${outputDir}`);

try {
  // 2. Crear carpeta si no existe
  if (!fs.existsSync(outputDir)) {
    console.log("   Carpeta no existe. Creándola...");
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 3. Escribir un archivo de prueba
  const dummyData = [{ videoId: "test", transcript: "Hola mundo" }];
  fs.writeFileSync(outputPath, JSON.stringify(dummyData, null, 2));

  console.log(`✅ ¡ÉXITO! Archivo creado.`);
  console.log(`👉 Revisa ahora si existe: ${outputPath}`);

} catch (error) {
  console.error("❌ ERROR CRÍTICO AL ESCRIBIR:", error);
}