import OneSignal from "react-onesignal";

let inicializacion: Promise<void> | null = null;

export function externalIdUsuario(
  usuarioId: number,
) {
  return `usuario-${usuarioId}`;
}

export async function inicializarOneSignal() {
  if (typeof window === "undefined") {
    return;
  }

  const appId =
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn(
      "OneSignal: falta NEXT_PUBLIC_ONESIGNAL_APP_ID.",
    );
    return;
  }

  if (!inicializacion) {
    inicializacion = OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin:
        process.env.NODE_ENV !== "production",
      serviceWorkerPath:
        "push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: {
        scope: "/push/onesignal/",
      },
    }).catch((error) => {
      inicializacion = null;
      throw error;
    });
  }

  await inicializacion;
}

export async function identificarUsuarioOneSignal(
  usuarioId: number,
  rol?: string,
) {
  await inicializarOneSignal();

  if (
    !process.env
      .NEXT_PUBLIC_ONESIGNAL_APP_ID
  ) {
    return;
  }

  await OneSignal.login(
    externalIdUsuario(
      usuarioId,
    ),
  );

  if (rol) {
    await OneSignal.User.addTag(
      "rol",
      rol,
    );
  }
}

export async function estadoPushOneSignal() {
  await inicializarOneSignal();

  return {
    soportado:
      OneSignal.Notifications
        .isPushSupported(),
    permiso:
      OneSignal.Notifications
        .permission,
    suscrito:
      OneSignal.User
        .PushSubscription
        .optedIn ?? false,
  };
}

export async function activarPushOneSignal() {
  await inicializarOneSignal();

  const soportado =
    OneSignal.Notifications
      .isPushSupported();

  if (!soportado) {
    throw new Error(
      "Este navegador o dispositivo no soporta notificaciones push.",
    );
  }

  if (
    !OneSignal.Notifications
      .permission
  ) {
    await OneSignal.Notifications
      .requestPermission();
  }

  if (
    !OneSignal.Notifications
      .permission
  ) {
    throw new Error(
      "El permiso de notificaciones no fue concedido.",
    );
  }

  await OneSignal.User
    .PushSubscription
    .optIn();

  return estadoPushOneSignal();
}

export async function desactivarPushOneSignal() {
  await inicializarOneSignal();

  await OneSignal.User
    .PushSubscription
    .optOut();

  return estadoPushOneSignal();
}

export async function cerrarSesionOneSignal() {
  try {
    await inicializarOneSignal();
    await OneSignal.logout();
  } catch (error) {
    console.error(
      "No se pudo cerrar la sesión de OneSignal:",
      error,
    );
  }
}