---
title: 'Generación automática de formularios a partir de archivos de configuración'
description: 'Generar formularios de pantalla, incluida su conexión REST, automáticamente a partir de archivos de configuración – un caso de éxito de un proyecto Angular.'
date: 2024-04-19
updated: 2024-06-15
key: bildschirmmasken-aus-konfigurationsdateien
category: success-story
tags: [Angular, REST, Generación de código]
---

Imagine que un cliente tiene grandes planes para una interfaz gráfica de usuario (GUI). Esta GUI debe ayudar a los agentes de atención al cliente y a los administradores a gestionar una gran cantidad de registros. Suena a una tarea enorme, ¿verdad? Sin embargo, el cliente tenía un problema: no disponía de desarrolladores frontend y quería ahorrar tiempo y dinero.

## El escenario (muy simplificado)

Nuestro público objetivo son los agentes de atención al cliente, que tienen que editar datos de clientes, pedidos y entregas. Cada una de estas áreas tiene su propio formulario. Suena a mucho trabajo, ¿verdad? ¿Hay que implementar cada formulario por separado? ¿Y la conexión con el backend? ¡No! Usaremos archivos de configuración, y casi todo funcionará automáticamente.

## La respuesta: archivos de configuración

La idea es sencilla, pero potente: generar los formularios a partir de archivos de configuración. Estos archivos contienen atributos como el nombre, los permisos, los endpoints y los criterios de filtrado de búsqueda. ¡Y voilà! Con esta información, la pantalla se crea automáticamente. Parece casi magia, ¿verdad?

## ¿Por qué es un éxito?

- **Ahorro de tiempo y dinero:** Imagine que hubiera que implementar cada formulario por separado. Una pesadilla, ¿no? ¡No para nuestro cliente! Gracias a la generación automática, ahorró tiempo y dinero.
- **Extensibilidad:** Ahora, personas que no son desarrolladoras pueden añadir nuevos formularios. ¡Basta con añadir los archivos de configuración y listo!
- **Automatización:** Todo se genera automáticamente, también la conexión con el backend REST. ¿El esfuerzo de mantenimiento y de pruebas? ¡Reducido drásticamente!
- **Funciones extra:** Nuestro cliente se benefició de i18n (AOT), y el generador se extrajo a una librería propia.

Código en GitHub: [christoph-sens/flexible-ui-cool](https://github.com/christoph-sens/flexible-ui-cool)

## Ejemplo

A partir de este archivo de configuración se genera el formulario de abajo.

```json
{
  "model": "customer",
  "apiEndpoint": "api/customers/",
  "permissions": "CRUD",
  "identifier": "customerId",
  "attributes": [
    { "name": "customerId", "type": "String" },
    { "name": "firstName", "type": "String" },
    { "name": "lastName", "type": "String" },
    { "name": "street", "type": "String" },
    { "name": "plz", "type": "number" },
    { "name": "city", "type": "String" },
    { "name": "phone", "type": "number" },
    { "name": "status", "type": "enum" },
    { "name": "mail", "type": "String" },
    { "name": "birthday", "type": "date", "isReadOnly": true }
  ]
}
```

![El formulario generado a partir del archivo de configuración: búsqueda, resultados de búsqueda y vista de detalle de clientes.](../../../assets/blog/bildschirmmaske.png)
