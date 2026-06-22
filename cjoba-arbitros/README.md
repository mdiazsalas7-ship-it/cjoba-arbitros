# Árbitro Virtual · App de árbitros de baloncesto

App web para formar y apoyar a árbitros de baloncesto, basada en el reglamento FIBA 2024 (OBR).
Tres áreas:

- **Estudios** — el reglamento completo (50 artículos, 195 sub-artículos) con buscador.
- **Juegos** — trivia con marcador, 49 preguntas basadas en el reglamento.
- **Interactiva** — jugadas dudosas de la comunidad, conectadas a Firestore.

Stack: **Vite + React + React Router + Firebase**. Pensada para móvil. Despliegue en **Vercel**.

> Aviso: los textos del reglamento son resúmenes redactados con palabras propias, **no** el
> texto literal de FIBA. Verifica cada dato contra el OBR 2024 oficial antes de usar la app
> para formar o certificar.

---

## 1. Probar en tu computadora (opcional)

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 18 o superior).

```bash
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173).

## 2. Subir a GitHub

```bash
git init
git add .
git commit -m "Primera versión de la app de árbitros"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cjoba-arbitros.git
git push -u origin main
```

(Crea antes el repositorio vacío `cjoba-arbitros` en github.com.)

## 3. Desplegar en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. **Add New → Project** y elige el repositorio `cjoba-arbitros`.
3. Vercel detecta Vite automáticamente. No cambies nada:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy**. En un par de minutos tendrás una URL pública.

Cada vez que hagas `git push`, Vercel vuelve a desplegar solo.

## 4. Activar la comunidad (Firestore)

Las áreas de Estudios y Juegos funcionan sin configurar nada: los datos van dentro de la app.
El área Interactiva intenta usar **Firestore**; si no está activo, las jugadas se muestran solo
en la sesión actual. Para guardarlas de verdad:

1. En [console.firebase.google.com](https://console.firebase.google.com) abre el proyecto **cjoba-app**.
2. **Build → Firestore Database → Create database** (empieza en modo de prueba).
3. Cuando vayas a lanzar en serio, cambia las Reglas de Seguridad. Un punto de partida razonable:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /casos/{doc} {
         allow read: if true;
         allow create: if request.resource.data.titulo is string
                       && request.resource.data.titulo.size() > 0;
         allow update, delete: if false;
       }
       match /opiniones/{doc} {
         allow read: if true;
         allow create: if request.resource.data.texto is string
                       && request.resource.data.texto.size() > 0;
         allow update, delete: if false;
       }
     }
   }
   ```

4. Para las fotos de las jugadas, activa **Storage** (ya lo tienes) y pon estas reglas en
   Storage → Rules para permitir subir imágenes a la carpeta `casos/`:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /casos/{img} {
         allow read: if true;
         allow write: if request.resource.size < 8 * 1024 * 1024
                      && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```

   Esto deja leer las jugadas a cualquiera y crear nuevas con título, pero impide borrarlas o
   modificarlas sin un sistema de cuentas. Cuando añadas autenticación, endurece estas reglas.

> La `apiKey` que aparece en `src/firebase.js` **no es un secreto**: en apps web de Firebase va
> en el cliente a propósito y solo identifica el proyecto. Quien protege tus datos son las Reglas
> de Seguridad de arriba.

## Estructura

```
src/
  data/          contenido del reglamento (reglas, subarticulos, trivia, casos)
  pages/         Estudios, Juegos, Interactiva
  firebase.js    conexión con Firebase
  App.jsx        navegación entre las tres áreas
  index.css      diseño
```

Para actualizar el contenido del reglamento, edita los archivos de `src/data/` y vuelve a hacer push.

## 5. Activar el inicio de sesión (Google)

1. En la consola de Firebase → **Build → Authentication → Get started**.
2. En **Sign-in method**, habilita **Google** y guarda.
3. En **Authentication → Settings → Authorized domains**, añade tu dominio de Vercel
   (por ejemplo `arbitro-virtual.vercel.app`) y `localhost` para pruebas.

### Roles e instructores
Al entrar por primera vez, cada persona se crea en Firestore en la colección **`usuarios`**
con `rol: "arbitro"`. Para convertir a alguien en **instructor** (puede marcar respuestas como
verificadas): en Firestore, abre `usuarios/{su-uid}` y cambia el campo `rol` a `"instructor"`.

### Reglas de seguridad (Firestore) con sesión
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function esInstructor() {
      return request.auth != null &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'instructor';
    }
    match /usuarios/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /casos/{doc} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if esInstructor();   // solo instructores verifican
      allow delete: if false;
    }
    match /opiniones/{doc} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
    match /ranking/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
