# Last Mile Delivery System

Sistema de gestión de última milla para optimizar entregas, consolidar cargas y planificar rutas eficientes.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
  - [Desarrollo Local](#desarrollo-local)
  - [Despliegue en Producción](#despliegue-en-producción)
- [Guía de Uso](#guía-de-uso)
  - [Coordinador Logístico](#coordinador-logístico)
  - [Gestor de Flota](#gestor-de-flota)
  - [Planificador de Rutas](#planificador-de-rutas)
  - [Coordinador de Despacho](#coordinador-de-despacho)
  - [Conductor](#conductor)
  - [Administrador del Sistema](#administrador-del-sistema)
- [API Documentation](#api-documentation)
- [Solución de Problemas](#solución-de-problemas)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Descripción General

El Sistema de Gestión de Última Milla es una plataforma completa para administrar el flujo de trabajo de entrega desde la recepción del pedido hasta la entrega al cliente. El sistema incluye gestión de pedidos, consolidación de carga, asignación de vehículos, planificación de rutas, operaciones de despacho y seguimiento de entregas.

## Arquitectura

El sistema utiliza una arquitectura de microservicios con los siguientes componentes:

- **API Gateway**: Punto de entrada único para todas las solicitudes de API
- **Servicios Backend**:
  - Order Service: Gestión de pedidos
  - Load Service: Consolidación de carga
  - Vehicle Service: Gestión de flota
  - Route Service: Planificación de rutas
  - Dispatch Service: Operaciones de despacho
  - Notification Service: Notificaciones a clientes y conductores
  - BPM Service: Visualización de procesos de negocio
  - Auth Service: Autenticación y autorización
- **Interfaces de Usuario**:
  - Web Dashboard: Panel de administración para coordinadores
  - Mobile App: Aplicación para conductores
- **Base de Datos**: PostgreSQL para almacenamiento persistente
- **Caché**: Redis para caché y sesiones

## Requisitos Previos

Para ejecutar el sistema, necesitará:

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Node.js](https://nodejs.org/) (v18+) para desarrollo local
- [npm](https://www.npmjs.com/) (v9+) o [yarn](https://yarnpkg.com/) (v1.22+)
- [PostgreSQL](https://www.postgresql.org/) (v15+) para desarrollo local sin Docker
- [Redis](https://redis.io/) (v7+) para desarrollo local sin Docker

## Instalación

### Desarrollo Local

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/yourusername/last-mile-delivery-system.git
   cd last-mile-delivery-system
   ```

2. **Configurar variables de entorno**

   Copie los archivos de ejemplo `.env.example` para cada servicio:

   ```bash
   # Para cada servicio
   cp api-gateway/.env.example api-gateway/.env
   cp order-service/.env.example order-service/.env
   cp vehicle-service/.env.example vehicle-service/.env
   cp route-service/.env.example route-service/.env
   cp dispatch-service/.env.example dispatch-service/.env
   cp load-service/.env.example load-service/.env
   cp notification-service/.env.example notification-service/.env
   cp bpm-service/.env.example bpm-service/.env
   cp auth-service/.env.example auth-service/.env
   ```

   Edite cada archivo `.env` según sea necesario para su entorno local.

3. **Modo de demostración (sin Docker)**

   Si no tiene Docker disponible, tiene dos opciones:

   **Opción 1: Archivo HTML estático completo**
   ```bash
   # Abra el archivo complete-dashboard.html en su navegador
   open complete-dashboard.html
   ```
   Este archivo contiene todas las secciones del dashboard (Vehículos, Despacho, BPM, etc.) funcionando sin necesidad de backend.

   **Opción 2: Ejecutar la aplicación web (autenticación deshabilitada)**
   ```bash
   cd web-dashboard
   npm install
   npm start
   ```

   La aplicación web se ejecutará con la autenticación deshabilitada para desarrollo, permitiendo acceso directo al dashboard.

4. **Iniciar servicios con Docker Compose** (si Docker está disponible)

   ```bash
   docker-compose up -d
   ```

   Esto iniciará todos los servicios, incluyendo PostgreSQL y Redis.

5. **Verificar que los servicios estén funcionando** (si Docker está disponible)

   ```bash
   docker-compose ps
   ```

   Todos los servicios deberían estar en estado "Up".

6. **Acceder a la aplicación**

   - Dashboard Web: http://localhost:8080 (o abra dashboard-no-login.html para el modo de demostración sin autenticación)
   - API Gateway: http://localhost:3000
   - Documentación de API: http://localhost:3001/api-docs (para Order Service)
   
   **Credenciales de administrador por defecto (solo para modo Docker):**
   - Usuario: admin
   - Correo: admin@lastmile.com
   - Contraseña: Admin123!

### Despliegue en Producción

Para un entorno de producción, se recomienda:

1. **Configurar variables de entorno para producción**

   Asegúrese de configurar variables de entorno seguras para producción, especialmente:
   - Contraseñas de base de datos
   - Claves secretas para JWT
   - Credenciales de servicios externos (Twilio, Firebase, etc.)

2. **Construir imágenes Docker optimizadas**

   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Desplegar en su plataforma preferida**

   El sistema puede desplegarse en:
   - Kubernetes
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances
   - Cualquier plataforma que soporte Docker

4. **Configurar balanceadores de carga y escalado**

   Configure balanceadores de carga y políticas de escalado automático según sus necesidades de tráfico.

## Guía de Uso

### Coordinador Logístico

Como coordinador logístico, usted es responsable de gestionar los pedidos entrantes y asegurar que se procesen correctamente.

#### Gestión de Pedidos

1. **Crear un nuevo pedido**
   - Acceda al Dashboard Web en http://localhost:8080
   - Inicie sesión con sus credenciales
   - Navegue a "Pedidos" > "Nuevo Pedido"
   - Complete el formulario con los detalles del cliente, dirección de entrega y detalles del paquete
   - Haga clic en "Guardar"

2. **Ver y editar pedidos**
   - Navegue a "Pedidos" > "Lista de Pedidos"
   - Utilice los filtros para encontrar pedidos específicos
   - Haga clic en un pedido para ver sus detalles
   - Utilice el botón "Editar" para modificar los detalles del pedido

3. **Revisar pedidos que requieren atención manual**
   - Navegue a "Pedidos" > "Revisión Manual"
   - Revise los pedidos marcados para revisión manual
   - Apruebe o rechace según corresponda

#### Consolidación de Carga

1. **Crear una nueva consolidación**
   - Navegue a "Cargas" > "Nueva Consolidación"
   - Seleccione los pedidos que desea consolidar
   - El sistema verificará automáticamente la compatibilidad
   - Haga clic en "Consolidar" para crear la carga

2. **Ver y gestionar cargas**
   - Navegue a "Cargas" > "Lista de Cargas"
   - Vea el estado y los detalles de cada carga
   - Modifique las cargas según sea necesario

### Gestor de Flota

Como gestor de flota, usted es responsable de administrar los vehículos y asignarlos a las cargas.

#### Gestión de Vehículos

1. **Registrar un nuevo vehículo**
   - Navegue a "Vehículos" > "Nuevo Vehículo"
   - Complete los detalles del vehículo (tipo, capacidad, etc.)
   - Haga clic en "Guardar"

2. **Ver y actualizar vehículos**
   - Navegue a "Vehículos" > "Lista de Vehículos"
   - Vea el estado y la ubicación de cada vehículo
   - Actualice la información según sea necesario

#### Asignación de Vehículos

1. **Asignar vehículos a cargas**
   - Navegue a "Cargas" > "Pendientes de Asignación"
   - Seleccione una carga para asignar
   - Vea los vehículos disponibles y compatibles
   - Seleccione un vehículo y haga clic en "Asignar"

2. **Reasignar vehículos**
   - Navegue a "Cargas" > "Lista de Cargas"
   - Encuentre la carga que necesita reasignación
   - Haga clic en "Reasignar" y seleccione un nuevo vehículo

### Planificador de Rutas

Como planificador de rutas, usted es responsable de crear y optimizar las rutas de entrega.

#### Planificación de Rutas

1. **Crear una nueva ruta**
   - Navegue a "Rutas" > "Nueva Ruta"
   - Seleccione una carga asignada
   - El sistema mostrará todas las paradas en el mapa
   - Reordene las paradas mediante arrastrar y soltar
   - Haga clic en "Guardar Ruta"

2. **Optimizar rutas**
   - Navegue a "Rutas" > "Lista de Rutas"
   - Seleccione una ruta para optimizar
   - Haga clic en "Optimizar" para que el sistema sugiera la secuencia óptima
   - Revise y ajuste según sea necesario
   - Guarde los cambios

### Coordinador de Despacho

Como coordinador de despacho, usted es responsable de enviar vehículos y monitorear las entregas en tiempo real.

#### Operaciones de Despacho

1. **Despachar vehículos**
   - Navegue a "Despacho" > "Rutas Listas"
   - Seleccione una ruta para despachar
   - Revise el resumen de la ruta
   - Haga clic en "Despachar" para enviar al conductor

2. **Monitoreo en tiempo real**
   - Navegue a "Despacho" > "En Progreso"
   - Vea la ubicación en tiempo real de los vehículos en el mapa
   - Haga clic en un vehículo para ver detalles de la ruta y el progreso

3. **Gestionar excepciones**
   - Navegue a "Despacho" > "Alertas"
   - Revise y responda a las alertas de entregas con problemas
   - Tome acciones como reasignar o reprogramar entregas

### Conductor

Como conductor, usted utiliza la aplicación móvil para recibir y ejecutar entregas.

#### Aplicación Móvil

1. **Iniciar sesión**
   - Abra la aplicación móvil
   - Ingrese sus credenciales
   - Verá su tablero con las entregas asignadas

2. **Recibir y ejecutar entregas**
   - Vea los detalles de la ruta asignada
   - Siga las instrucciones de navegación
   - Marque cada entrega como completada después de entregarla
   - Capture confirmación (firma, foto) según sea necesario

3. **Reportar problemas**
   - Si no puede completar una entrega, seleccione "Reportar Problema"
   - Elija el motivo del problema (cliente ausente, dirección incorrecta, etc.)
   - Tome una foto si es necesario
   - Envíe el informe

### Administrador del Sistema

Como administrador del sistema, usted es responsable de supervisar todo el proceso y analizar el rendimiento.

#### Visualización de Procesos BPM

1. **Ver diagramas de proceso**
   - Navegue a "BPM" > "Diagrama de Proceso"
   - Vea el flujo completo del proceso de entrega
   - Los nodos activos se resaltarán según la actividad actual

2. **Analizar métricas de rendimiento**
   - Navegue a "BPM" > "Métricas"
   - Vea indicadores clave de rendimiento por etapa
   - Identifique cuellos de botella y áreas de mejora

## API Documentation

La documentación de la API está disponible para cada servicio:

- Order Service: http://localhost:3001/api-docs
- Vehicle Service: http://localhost:3002/api-docs
- Route Service: http://localhost:3003/api-docs
- Dispatch Service: http://localhost:3004/api-docs
- Load Service: http://localhost:3005/api-docs
- Notification Service: http://localhost:3006/api-docs
- BPM Service: http://localhost:3007/api-docs
- Auth Service: http://localhost:3008/api-docs

## Solución de Problemas

### Problemas Comunes

#### Los servicios no inician correctamente

**Síntoma**: Algunos servicios muestran estado "Exit" en `docker-compose ps`

**Solución**:
1. Verifique los logs del servicio: `docker-compose logs [service-name]`
2. Asegúrese de que la base de datos esté accesible
3. Verifique que las variables de entorno estén configuradas correctamente
4. Reinicie el servicio: `docker-compose restart [service-name]`

#### Problemas de conexión a la base de datos

**Síntoma**: Errores de conexión a PostgreSQL en los logs

**Solución**:
1. Verifique que PostgreSQL esté en ejecución: `docker-compose ps postgres`
2. Verifique las credenciales en los archivos `.env`
3. Intente conectarse manualmente: `docker-compose exec postgres psql -U postgres -d lastmiledelivery`
4. Reinicie el servicio de base de datos: `docker-compose restart postgres`

#### Problemas de autenticación

**Síntoma**: No puede iniciar sesión o recibe errores 401

**Solución**:

**Si está utilizando Docker:**
1. Verifique que el servicio de autenticación esté en ejecución: `docker-compose ps auth-service`
2. Revise los logs del auth-service: `docker-compose logs auth-service`
3. Verifique que las claves JWT estén configuradas correctamente en auth-service/.env
4. Asegúrese de que el archivo auth-service/.env exista y tenga la configuración correcta
5. Verifique que la base de datos tenga el usuario administrador creado:
   ```bash
   docker-compose exec postgres psql -U postgres -d lastmiledelivery -c "SELECT * FROM users WHERE username='admin';"
   ```
6. Si el usuario administrador no existe, puede crearlo manualmente:
   ```bash
   docker-compose exec postgres psql -U postgres -d lastmiledelivery -f /docker-entrypoint-initdb.d/4-auth-init.sql
   ```
7. Intente reiniciar los servicios: `docker-compose restart auth-service api-gateway web-dashboard`

**Si no tiene Docker disponible:**
1. Utilice el modo de demostración abriendo el archivo `dashboard-no-login.html` en su navegador
2. Este modo de demostración simula la funcionalidad básica sin requerir Docker ni autenticación

#### La aplicación web no carga

**Síntoma**: Error al acceder a http://localhost:8080

**Solución**:
1. Verifique que el servicio web-dashboard esté en ejecución
2. Revise los logs: `docker-compose logs web-dashboard`
3. Asegúrese de que el API Gateway esté funcionando
4. Limpie la caché del navegador e intente nuevamente

### Contacto de Soporte

Si continúa experimentando problemas, contacte al equipo de soporte:

- Email: support@lastmiledelivery.example.com
- Teléfono: +1-234-567-8900
- Horario de atención: Lunes a Viernes, 9:00 - 18:00 (GMT-5)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, siga estos pasos:

1. Fork el repositorio
2. Cree una rama para su función (`git checkout -b feature/amazing-feature`)
3. Realice sus cambios
4. Ejecute las pruebas (`npm test`)
5. Commit sus cambios (`git commit -m 'Add some amazing feature'`)
6. Push a la rama (`git push origin feature/amazing-feature`)
7. Abra un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - vea el archivo LICENSE para más detalles.