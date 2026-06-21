// Genera el cliente TypeScript desde el spec OpenAPI del backend.
// Flujo: swaggo (Swagger 2.0) -> swagger2openapi (OpenAPI 3) -> openapi-typescript-codegen.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertObj } from 'swagger2openapi';
import { generate } from 'openapi-typescript-codegen';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const swaggerPath = resolve(pkgRoot, '../../apps/api/docs/swagger.json');
const outputDir = resolve(pkgRoot, 'src/generated');

if (!existsSync(swaggerPath)) {
  console.error(`[generate:client] No se encontró el spec en ${swaggerPath}`);
  console.error('[generate:client] Generá primero el spec del backend:');
  console.error('[generate:client]   cd apps/api && swag init -g cmd/api/main.go');
  process.exit(1);
}

const swagger = JSON.parse(readFileSync(swaggerPath, 'utf8'));

const { openapi } = await convertObj(swagger, { patch: true, warnOnly: true });

await generate({
  input: openapi,
  output: outputDir,
  httpClient: 'fetch',
  useOptions: true,
  exportSchemas: true,
});

console.log(`[generate:client] Cliente TS generado en ${outputDir}`);
