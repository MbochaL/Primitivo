// Documento HTML raíz para el render estático de Expo Router (web).
// Acá se enlaza el manifest de la PWA, el color de tema y se registra el service worker.
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Registro del service worker. Se omite en localhost para no interferir con el dev server.
const swRegistration = `
if ('serviceWorker' in navigator) {
  var host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').catch(function () {});
    });
  }
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Evita el flash de scroll en web con React Native. */}
        <ScrollViewStyleReset />

        <script dangerouslySetInnerHTML={{ __html: swRegistration }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
