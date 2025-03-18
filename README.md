# n8n-nodes-dynamicssh  

## SSH (Dynamic) - n8n Node  

🔗 **Repositorio:** [GitHub - DynamicSSH](https://github.com/zcagstudios/n8n-nodes-dynamicssh)  
📦 **npm:** [`n8n-nodes-dynamicssh`](https://www.npmjs.com/package/n8n-nodes-dynamicssh)  

### Descripción  

El nodo **SSH (Dynamic)** permite ejecutar comandos en servidores SSH sin necesidad de crear credenciales predefinidas en n8n. A diferencia del nodo SSH estándar, este nodo permite especificar dinámicamente los parámetros de conexión como **host, usuario, autenticación y comandos**, lo que facilita la conexión a múltiples servidores sin necesidad de crear nodos específicos para cada uno.  

Este nodo es ideal para entornos donde las credenciales de SSH se almacenan en bases de datos y se desean utilizar dinámicamente en los flujos de n8n.

### 🚀 Características  

✅ **Conexión dinámica**: Define los parámetros de SSH en cada ejecución sin necesidad de registrar credenciales en n8n.  
✅ **Compatibilidad con expresiones**: Todos los campos aceptan valores dinámicos por medio de expressions de n8n.  
✅ **Autenticación flexible**: Soporta autenticación con **contraseña o clave privada (con passphrase opcional)**.  
✅ **Ejecución flexible de comandos**: Permite definir **comandos dinámicos, recursos y directorios de trabajo**.  
✅ **Optimización para múltiples conexiones**: Ideal para entornos donde se gestionan múltiples servidores SSH sin necesidad de múltiples nodos.  

---

## 🛠️ Configuración  

El nodo acepta los siguientes parámetros de configuración:  

### 🔹 **Parámetros de conexión**  

| Parámetro        | Descripción |
|-----------------|-------------|
| `Host`         | Dirección IP o dominio del servidor SSH |
| `Port`         | Puerto SSH (por defecto 22) |
| `User`         | Usuario para la conexión SSH |
| `Authentication` | Tipo de autenticación: `password` o `private key` |
| `Password`     | (Opcional) Contraseña del usuario, si se usa autenticación por contraseña |
| `Private Key`  | (Opcional) Clave privada SSH, si se usa autenticación por clave |
| `Passphrase`   | (Opcional) Passphrase si la clave privada está encriptada |

### 🔹 **Parámetros de ejecución**  

| Parámetro       | Descripción |
|-----------------|-------------|
| `Resource`     | Tipo de recurso a ejecutar (por ejemplo, comando) |
| `Operation`    | Tipo de operación a realizar |
| `Command`      | Comando a ejecutar en el servidor |
| `Working Directory` | Directorio en el que se ejecutará el comando |

📌 **Nota:** Todos los campos admiten expresiones (`{{ }}`), lo que permite configurarlos dinámicamente en cada ejecución.  

---

## 📖 Ejemplo de Uso  

### 🔹 Caso de Uso  

Supongamos que tienes una base de datos donde almacenas credenciales de servidores SSH y deseas conectarte dinámicamente a cualquiera de ellos según la información obtenida en tiempo de ejecución.  

1. **Consulta las credenciales SSH en tu base de datos.**  
2. **Extrae los valores y pásalos al nodo `SSH (Dynamic)`.**  
3. **Ejecuta un comando en el servidor remoto sin necesidad de crear múltiples nodos o credenciales en n8n.**  

📌 En lugar de usar múltiples nodos **Switch** y varios nodos SSH tradicionales, con este nodo puedes manejar todas tus conexiones SSH con **un solo nodo dinámico**.  

### 🔹 Flujo de ejemplo  

- `PostgreSQL` → Consulta credenciales SSH  
- `SSH (Dynamic)` → Conéctate dinámicamente y ejecuta un comando  
- `Set` → Formatea la salida  

---

## 🔧 Instalación  

Puedes instalar este nodo directamente desde npm:  

```sh
npm install n8n-nodes-dynamicssh
```

O si estás desarrollando en un entorno local, agrégalo a tu configuración:  

```sh
n8n-node-dev install n8n-nodes-dynamicssh
```

Luego, reinicia tu instancia de n8n para que detecte el nuevo nodo.

---

## 🚀 Contribuir  

Si deseas mejorar este nodo, ¡eres bienvenido!  

1. Clona el repositorio  
   ```sh
   git clone https://github.com/zcagstudios/n8n-nodes-dynamicssh.git
   cd dynamicssh
   ```
2. Instala dependencias  
   ```sh
   npm install
   ```
3. Realiza tus cambios y prueba localmente en n8n  
4. Envía un Pull Request  

---

## 📌 Notas Finales  

Este nodo fue desarrollado para hacer más eficiente la ejecución de comandos SSH en flujos de trabajo dinámicos sin la necesidad de definir credenciales fijas en n8n.  

Si tienes preguntas o sugerencias, puedes abrir un issue en [GitHub](https://github.com/zcagstudios/n8n-nodes-dynamicssh) o compartir en la comunidad de n8n.  

---

🔹 **Autor:** [Tu Nombre o Usuario de GitHub]  
🔹 **Licencia:** MIT  
🔹 **Versión:** 1.0.0  
