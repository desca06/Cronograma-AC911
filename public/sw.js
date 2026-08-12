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

    const opciones = {
      body:
        data.mensaje ??
        "Tienes una nueva notificación.",
      icon:
        "/icons/icon-192.png",
      badge:
        "/icons/icon-192.png",
      data: {
        url:
          data.url ??
          "/notificaciones",
      },
      tag:
        data.url ??
        "ac911-notificacion",
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

    const url =
      event.notification.data
        ?.url ??
      "/notificaciones";

    event.waitUntil(
      clients
        .matchAll({
          type:
            "window",
          includeUncontrolled:
            true,
        })
        .then(
          (
            clientList,
          ) => {
            for (
              const client
              of clientList
            ) {
              if (
                "focus" in
                client
              ) {
                client.navigate(
                  url,
                );

                return client.focus();
              }
            }

            return clients.openWindow(
              url,
            );
          },
        ),
    );
  },
);