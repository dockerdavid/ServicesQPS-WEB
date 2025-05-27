import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Módulos a crear
const modules = [
  'dashboard',
  'calendar',
  'communities',
  'companies',
  'costs',
  'extras',
  'services',
  'statuses',
  'types',
  'users',
];

// Función para capitalizar la primera letra de un string
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Función para crear un archivo con contenido básico (si no existe)
const createFile = (filePath, content = '') => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    // console.log(`Archivo creado: ${filePath}`);
  } else {
    // console.log(`Archivo ya existe, ignorando: ${filePath}`);
  }
};

// Función para crear la estructura de un módulo
const createModuleStructure = (moduleName) => {
  const capitalizedModuleName = capitalize(moduleName); // Capitalizar el nombre del módulo
  const modulePath = path.join(__dirname, 'src', 'modules', moduleName);

  // Crear la carpeta del módulo (si no existe)
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath, { recursive: true });
    // console.log(`Carpeta creada: ${modulePath}`);
  } else {
    // console.log(`Carpeta ya existe, ignorando: ${modulePath}`);
  }

  // Crear los archivos básicos del módulo (si no existen)
  const files = [
    {
      name: `${capitalizedModuleName}EditView.vue`,
      content: `<template><div>${capitalizedModuleName} Edit View (Formulario)</div></template>`,
    },
  ];

  files.forEach((file) => {
    const filePath = path.join(modulePath, file.name);
    createFile(filePath, file.content);
  });
};

// Crear la estructura para todos los módulos
modules.forEach((moduleName) => {
  createModuleStructure(moduleName);
});

console.log('Estructura generada con éxito.');