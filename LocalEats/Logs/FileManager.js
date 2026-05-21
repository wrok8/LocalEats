import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const BASE_DIR = `${FileSystem.documentDirectory}local_eats/`;

export const PATHS = {
  logs: `${BASE_DIR}logs/`,
  cache: `${BASE_DIR}cache/`,
  exports: `${BASE_DIR}exports/`,
  errorLog: `${BASE_DIR}logs/errors.txt`,
  auditLog: `${BASE_DIR}logs/audit_log.txt`,
  cacheFavorites: `${BASE_DIR}cache/favorites.txt`,
};

// Prepara las carpetas locales que usa la app para logs, cache y exports.
export async function initFileSystem() {
  try {
    await ensureDirectory(PATHS.logs);
    await ensureDirectory(PATHS.cache);
    await ensureDirectory(PATHS.exports);
    await logInfo("FileManager", "Sistema de archivos inicializado");
  } catch (error) {
    console.warn("No se pudo inicializar FileManager:", error);
  }
}

export async function logInfo(context, message) {
  try {
    await appendLine(PATHS.errorLog, `[${timestamp()}] INFO [${context}] ${message}`);
  } catch (_) {}
}

// Guarda una accion o consulta importante en un archivo txt de auditoria local.
export async function logAudit({
  action,
  storage = "Firestore",
}) {
  try {
    const line = [
      `[${timestamp()}]`,
      `BASE: ${storage}`,
      `ACCION: ${action}`,
    ]
      .filter(Boolean)
      .join(" | ");

    await appendLine(PATHS.auditLog, line);
  } catch (error) {
    console.warn("No se pudo escribir auditoria:", error);
  }
}

export async function readAuditLog() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.auditLog);
    if (!info.exists) return "Sin registros de auditoria.";
    return await FileSystem.readAsStringAsync(PATHS.auditLog, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (_) {
    return "No se pudo leer el log de auditoria.";
  }
}

export async function readAuditEntries() {
  try {
    const raw = await readAuditLog();
    if (!raw || raw.startsWith("Sin registros")) return [];

    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => parseAuditLine(line, index))
      .reverse()
      .map((entry) => entry);
  } catch (_) {
    return [];
  }
}

export async function deleteAuditEntry(entryToDelete) {
  try {
    const raw = await readAuditLog();
    if (!raw || raw.startsWith("Sin registros")) return;

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const updatedLines = lines.filter((line, index) => {
      if (entryToDelete?.originalIndex !== undefined) {
        return index !== entryToDelete.originalIndex;
      }

      return line !== entryToDelete?.raw;
    });

    await FileSystem.writeAsStringAsync(PATHS.auditLog, `${updatedLines.join("\n")}${updatedLines.length ? "\n" : ""}`, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.warn("No se pudo eliminar auditoria:", error);
  }
}

export async function clearAuditLog() {
  try {
    await FileSystem.writeAsStringAsync(PATHS.auditLog, "", {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await logAudit({
      action: "Se limpio el historial de auditoria",
      storage: "FileSystem",
      target: "logs/audit_log.txt",
    });
  } catch (error) {
    console.warn("No se pudo limpiar auditoria:", error);
  }
}

export async function shareAuditLog() {
  try {
    await ensureDirectory(PATHS.logs);
    const info = await FileSystem.getInfoAsync(PATHS.auditLog);
    if (!info.exists) {
      await logAudit({
        action: "Se creo el archivo de auditoria para compartir",
        storage: "FileSystem",
        target: "logs/audit_log.txt",
      });
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(PATHS.auditLog, {
        mimeType: "text/plain",
        dialogTitle: "Compartir auditoria de LocalEats",
      });
    }
  } catch (error) {
    await logError("shareAuditLog", error);
  }
}

// Guarda errores con contexto para poder revisarlos despues.
export async function logError(context, error) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    await appendLine(PATHS.errorLog, `[${timestamp()}] ERROR [${context}] ${message}`);
  } catch (_) {}
}

export async function readErrorLog() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.errorLog);
    if (!info.exists) return "Sin registros.";
    return await FileSystem.readAsStringAsync(PATHS.errorLog, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (_) {
    return "No se pudo leer el log.";
  }
}

export async function clearErrorLog() {
  try {
    await FileSystem.writeAsStringAsync(PATHS.errorLog, "", {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await logInfo("FileManager", "Log limpiado");
  } catch (error) {
    console.warn("No se pudo limpiar el log:", error);
  }
}

export async function shareErrorLog() {
  try {
    await ensureDirectory(PATHS.logs);
    const info = await FileSystem.getInfoAsync(PATHS.errorLog);
    if (!info.exists) {
      await logInfo("FileManager", "Log creado para compartir");
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(PATHS.errorLog, {
        mimeType: "text/plain",
        dialogTitle: "Compartir log de LocalEats",
      });
    }
  } catch (error) {
    await logError("shareErrorLog", error);
  }
}

// Crea una copia local de favoritos por si se necesita consultarlos luego.
export async function cacheFavorites(userId, favorites) {
  try {
    await ensureDirectory(PATHS.cache);
    const content = JSON.stringify(
      {
        userId,
        savedAt: new Date().toISOString(),
        count: favorites.length,
        data: favorites,
      },
      null,
      2
    );

    await FileSystem.writeAsStringAsync(PATHS.cacheFavorites, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await logInfo("Favorites", `${favorites.length} favoritos guardados en cache`);
  } catch (error) {
    await logError("cacheFavorites", error);
  }
}

export async function readCachedFavorites() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.cacheFavorites);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(PATHS.cacheFavorites, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw);
  } catch (error) {
    await logError("readCachedFavorites", error);
    return null;
  }
}

// Genera una ficha de texto lista para compartir el restaurante.
export async function exportRestaurantProfileTxt(restaurant) {
  try {
    await ensureDirectory(PATHS.exports);

    const name = restaurant.name || "Mi restaurante";
    const address = restaurant.address || "Direccion no disponible";
    const phone = restaurant.phone || "Telefono no disponible";
    const website = restaurant.website || "Sitio web no disponible";
    const description = restaurant.description || "Ven a conocer nuestro restaurante.";
    const categories = restaurant.types?.length
      ? restaurant.types.join(", ")
      : "Comida local";
    const rating = restaurant.averageRating || restaurant.rating || "Aun sin calificacion";
    const reviews = restaurant.totalReviews || restaurant.reviewsCount || 0;

    const stats = {
      views: restaurant.views || 0,
      directions: restaurant.directionsClicks || 0,
      favorites: restaurant.favoritesCount || 0,
      reviews,
      rating,
    };

    const lines = [
      "==============================================",
      "LOCAL EATS - RECOMENDACION PARA COMPARTIR",
      "==============================================",
      "",
      `${name}`,
      "",
      description,
      "",
      "INFORMACION PARA CLIENTES",
      "----------------------------------------------",
      `Direccion: ${address}`,
      `Telefono: ${phone}`,
      `Sitio web: ${website}`,
      `Categorias: ${categories}`,
      `Rango de precio: ${priceText(restaurant.price_level)}`,
      `Calificacion en LocalEats: ${rating}`,
      `Resenas registradas: ${reviews}`,
      "",
      "HORARIO",
      "----------------------------------------------",
    ];

    const hours = restaurant.opening_hours || [];
    if (hours.length) {
      hours.forEach((hour) => lines.push(`- ${hour}`));
    } else {
      lines.push("Horario no disponible.");
    }

    lines.push(
      "",
      "Por que visitarnos:",
      `- Somos parte de LocalEats, una guia para descubrir restaurantes cercanos.`,
      `- Puedes encontrarnos por nuestra direccion y guardar este archivo para consultarlo despues.`,
      `- Si te gusta nuestra comida, dejanos una resena en LocalEats.`,
      "",
      "==============================================",
      "RESUMEN PARA EL PROPIETARIO",
      "----------------------------------------------",
      `Generado: ${timestamp()}`,
      `Estado en LocalEats: ${restaurant.status || "Sin estado"}`,
      `Vistas: ${stats.views}`,
      `Clicks en como llegar: ${stats.directions}`,
      `Veces guardado en favoritos: ${stats.favorites}`,
      `Resenas: ${stats.reviews}`,
      `Calificacion: ${stats.rating}`,
      "",
      "Archivo generado desde LocalEats."
    );

    const fileName = safeFileName(name);
    const filePath = `${PATHS.exports}${fileName}_promocion_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(filePath, lines.join("\n"), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: "Compartir ficha del restaurante",
      });
    } else {
      await logInfo("RestaurantProfile", `Archivo generado sin compartir: ${filePath}`);
    }

    await logInfo("RestaurantProfile", `Ficha exportada: ${restaurant.name || "restaurante"}`);
    return filePath;
  } catch (error) {
    await logError("exportRestaurantProfileTxt", error);
    throw error;
  }
}

export async function clearCache() {
  try {
    await FileSystem.deleteAsync(PATHS.cache, { idempotent: true });
    await ensureDirectory(PATHS.cache);
    await logInfo("FileManager", "Cache limpiado");
  } catch (error) {
    await logError("clearCache", error);
  }
}

export async function clearExports() {
  try {
    await FileSystem.deleteAsync(PATHS.exports, { idempotent: true });
    await ensureDirectory(PATHS.exports);
    await logInfo("FileManager", "Exportaciones limpiadas");
  } catch (error) {
    await logError("clearExports", error);
  }
}

export async function getTotalStorageUsed() {
  try {
    const paths = [PATHS.errorLog, PATHS.cacheFavorites];
    let bytes = 0;

    for (const path of paths) {
      const info = await FileSystem.getInfoAsync(path, { size: true });
      if (info.exists && info.size) bytes += info.size;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch (_) {
    return "0.00 MB";
  }
}

// Crea la carpeta si todavia no existe.
async function ensureDirectory(path) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function appendLine(path, line) {
  await ensureDirectory(path.substring(0, path.lastIndexOf("/") + 1));
  const info = await FileSystem.getInfoAsync(path);
  const current = info.exists
    ? await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.UTF8,
      })
    : "";

  await FileSystem.writeAsStringAsync(path, `${current}${line}\n`, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

function timestamp() {
  return new Date().toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseAuditLine(line, index) {
  const parts = line.split(" | ");
  const date = parts[0]?.replace("[", "").replace("]", "") || "";
  const entry = {
    id: `${index}-${date}-${line.length}`,
    number: index + 1,
    originalIndex: index,
    date,
    storage: "",
    action: line,
    raw: line,
  };

  parts.slice(1).forEach((part) => {
    const [key, ...valueParts] = part.split(": ");
    const value = valueParts.join(": ");

    if (key === "BASE") entry.storage = value;
    if (key === "ACCION") entry.action = value;
  });

  return entry;
}

// Limpia el nombre para que sea seguro como archivo.
function safeFileName(value) {
  const fileName = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return fileName || "restaurante";
}

function priceText(priceLevel) {
  const levels = {
    0: "Gratis / sin costo",
    1: "Economico",
    2: "Moderado",
    3: "Alto",
    4: "Premium",
  };

  return levels[priceLevel] || "Sin precio registrado";
}
