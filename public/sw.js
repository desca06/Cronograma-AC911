self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      data =
        event.data
          ? event.data.json()
          : {};
    } catch {
      data = {};
    }

    const titulo =
      data.titulo ??
      "AC911";

    const url =
      typeof data.url === "string" &&
      data.url.trim()
        ? data.url.trim()
        : "/notificaciones";

    const opciones = {
      body:
        data.mensaje ??
        "Tienes una nueva notificación.",
      icon:
        "/icons/icon-192.png",
      badge:
        "/icons/icon-192.png",
      data: {
        url,
      },
      tag:
        data.trabajoId
          ? `ac911-trabajo-${data.trabajoId}`
          : url,
      renotify:
        true,
    };

    event.waitUntil(
      self.registration.showNotification(
        titulo,
        opciones,
      ),
    );
  },
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const destino =
      event.notification.data?.url ??
      "/notificaciones";

    const urlDestino =
      new URL(
        destino,
        self.location.origin,
      ).href;

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(
          async (
            ventanas,
          ) => {
            for (
              const ventana
              of ventanas
            ) {
              if (
                "navigate" in ventana &&
                "focus" in ventana
              ) {
                await ventana.navigate(
                  urlDestino,
                );

                return ventana.focus();
              }
            }

            return clients.openWindow(
              urlDestino,
            );
          },
        ),
    );
  },
);