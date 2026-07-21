self.addEventListener("install", () => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");

  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientes) => {
      for (const cliente of clientes) {
        if ("focus" in cliente) {
          return cliente.focus();
        }
      }

      return self.clients.openWindow("/mis-trabajos");
    }),
  );
});