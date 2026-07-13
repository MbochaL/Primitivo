// Configuración de Metro para el monorepo: Metro debe vigilar la raíz del workspace
// y resolver dependencias tanto desde apps/web como desde el node_modules raíz.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Vigilar todo el monorepo y resolver dependencias desde el node_modules raíz (pnpm hoist).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
