self.addEventListener("push", (event) => {
  let datos = {
    titulo: "AC911",
    mensaje: "Tenés una nueva notificación.",
    url: "/notificaciones",
  };

  if (event.data) {
    try {
      datos = {
        ...datos,
        ...event.data.json(),
      };
    } catch {
      datos.mensaje = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.mensaje,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: {
        url: datos.url,
      },
      tag: "ac911-push",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data?.url ??
    "/notificaciones";

  event.waitUntil(
    clients.openWindow(url),
  );
});