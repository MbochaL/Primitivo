// Configuración de Metro para el monorepo: Metro debe vigilar la raíz del workspace
// y resolver dependencias tanto desde apps/web como desde el node_modules raíz.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Vigilar todo el monorepo para que Metro detecte cambios en los paquetes @primitivo/*.
// Con node-linker=hoisted las dependencias viven en el node_modules raíz; la resolución
// jerárquica por defecto de Metro las encuentra, así que no hace falta tocar el resolver.
config.watchFolders = [workspaceRoot];

module.exports = config;
