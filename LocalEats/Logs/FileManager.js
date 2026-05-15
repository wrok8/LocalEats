/**
 * =============================================
 *   FileManager.js — Local Eats
 *   Utilidad para manejo de archivos .txt
 * =============================================
 *
 *  Funcionalidades:
 *  ├── Logs de errores con timestamp
 *  ├── Caché local de restaurantes (JSON en .txt)
 *  ├── Exportar favoritos a .txt compartible
 *  ├── Exportar horarios del restaurante a .txt
 *  └── Limpiar archivos de caché
 *
 *  Dependencias:
 *    expo-file-system   → manejo de archivos
 *    expo-sharing       → compartir archivos
 *
 *  Instalación:
 *    npx expo install expo-file-system expo-sharing
 */

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/* =============================================
   RUTAS BASE
============================================= */

const BASE_DIR = FileSystem.documentDirectory + "local_eats/";

export const PATHS = {
  logs:       BASE_DIR + "logs/",
  cache:      BASE_DIR + "cache/",
  exports:    BASE_DIR + "exports/",
  errorLog:   BASE_DIR + "logs/errors.txt",
  cacheRestaurants: BASE_DIR + "cache/restaurants.txt",
  cacheFavorites:   BASE_DIR + "cache/favorites.txt",
};

/* =============================================
   INICIALIZACIÓN DE DIRECTORIOS
============================================= */

/**
 * Crea los directorios necesarios si no existen.
 * Llama esto una vez al iniciar la app (ej. en App.js).
 */
export async function initFileSystem() {
  try {
    for (const dir of [PATHS.logs, PATHS.cache, PATHS.exports]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
    await _appendLine(PATHS.errorLog, `[${timestamp()}] ✅ FileSystem inicializado`);
  } catch (err) {
    console.warn("FileManager: no se pudo inicializar directorios", err);
  }
}

/* =============================================
   LOGS DE ERRORES
============================================= */

/**
 * Registra un error en errors.txt con timestamp.
 * @param {string} context  - Pantalla o función donde ocurrió
 * @param {Error|string} error - El error capturado
 */
export async function logError(context, error) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const line = `[${timestamp()}] ❌ [${context}] ${message}`;
    console.log(line);
    await _appendLine(PATHS.errorLog, line);
  } catch (_) {
    // Silencioso para no crear bucles de error
  }
}

/**
 * Registra un evento informativo en el log.
 * @param {string} context
 * @param {string} message
 */
export async function logInfo(context, message) {
  try {
    const line = `[${timestamp()}] ℹ️  [${context}] ${message}`;
    await _appendLine(PATHS.errorLog, line);
  } catch (_) {}
}

/**
 * Lee el contenido completo del log de errores.
 * @returns {string}
 */
export async function readErrorLog() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.errorLog);
    if (!info.exists) return "Sin registros aún.";
    return await FileSystem.readAsStringAsync(PATHS.errorLog, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    return "No se pudo leer el log.";
  }
}

/**
 * Limpia el archivo de errores.
 */
export async function clearErrorLog() {
  try {
    await FileSystem.writeAsStringAsync(PATHS.errorLog, "", {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await logInfo("FileManager", "Log de errores limpiado");
  } catch (err) {
    console.warn("No se pudo limpiar el log", err);
  }
}

/**
 * Comparte el log de errores (útil para soporte técnico).
 */
export async function shareErrorLog() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.errorLog);
    if (!info.exists) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(PATHS.errorLog, {
        mimeType: "text/plain",
        dialogTitle: "Compartir log de errores",
      });
    }
  } catch (err) {
    logError("shareErrorLog", err);
  }
}

/* =============================================
   CACHÉ DE RESTAURANTES
============================================= */

/**
 * Guarda la lista de restaurantes en caché local.
 * @param {Array} restaurants
 */
export async function cacheRestaurants(restaurants) {
  try {
    const content = JSON.stringify({
      savedAt: new Date().toISOString(),
      count: restaurants.length,
      data: restaurants,
    });
    await FileSystem.writeAsStringAsync(PATHS.cacheRestaurants, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await logInfo("cache", `${restaurants.length} restaurantes guardados en caché`);
  } catch (err) {
    logError("cacheRestaurants", err);
  }
}

/**
 * Lee el caché local de restaurantes.
 * @returns {{ savedAt: string, count: number, data: Array } | null}
 */
export async function readCachedRestaurants() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.cacheRestaurants);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(PATHS.cacheRestaurants, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw);
  } catch (err) {
    logError("readCachedRestaurants", err);
    return null;
  }
}

/**
 * Verifica si el caché de restaurantes es reciente (menos de N horas).
 * @param {number} maxAgeHours - Máximo de horas de antigüedad (default 6)
 * @returns {boolean}
 */
export async function isCacheFresh(maxAgeHours = 6) {
  try {
    const cached = await readCachedRestaurants();
    if (!cached) return false;

    const savedAt = new Date(cached.savedAt);
    const now = new Date();
    const diffMs = now - savedAt;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < maxAgeHours;
  } catch {
    return false;
  }
}

/* =============================================
   CACHÉ DE FAVORITOS
============================================= */

/**
 * Guarda los favoritos del usuario en caché.
 * @param {string} userId
 * @param {Array} favorites
 */
export async function cacheFavorites(userId, favorites) {
  try {
    const content = JSON.stringify({
      userId,
      savedAt: new Date().toISOString(),
      count: favorites.length,
      data: favorites,
    });
    await FileSystem.writeAsStringAsync(PATHS.cacheFavorites, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    logError("cacheFavorites", err);
  }
}

/**
 * Lee el caché de favoritos.
 * @returns {{ userId, savedAt, count, data } | null}
 */
export async function readCachedFavorites() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.cacheFavorites);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(PATHS.cacheFavorites, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw);
  } catch (err) {
    logError("readCachedFavorites", err);
    return null;
  }
}

/* =============================================
   EXPORTACIONES PARA EL USUARIO
============================================= */

/**
 * Genera y comparte un .txt con la lista de favoritos del usuario.
 * @param {Array} favorites - Lista de restaurantes favoritos
 */
export async function exportFavoritesToTxt(favorites) {
  try {
    const lines = [
      "==============================================",
      "       LOCAL EATS — Mis Restaurantes Favoritos",
      `       Exportado el ${new Date().toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric"
      })}`,
      "==============================================",
      "",
    ];

    favorites.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name}`);
      if (r.address || r.vicinity) lines.push(`   📍 ${r.address || r.vicinity}`);
      if (r.phone) lines.push(`   📞 ${r.phone}`);
      if (r.rating) lines.push(`   ⭐ Calificación: ${r.rating}`);
      if (r.types?.length) lines.push(`   🏷  Categorías: ${r.types.join(", ")}`);
      lines.push("");
    });

    lines.push("----------------------------------------------");
    lines.push("Descarga Local Eats y descubre más restaurantes");
    lines.push("==============================================");

    const filePath = PATHS.exports + `favoritos_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(filePath, lines.join("\n"), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: "Compartir mis favoritos",
      });
    }

    await logInfo("exportFavorites", `${favorites.length} favoritos exportados`);
  } catch (err) {
    logError("exportFavoritesToTxt", err);
  }
}

/**
 * Genera y comparte un .txt con el horario del restaurante.
 * @param {Object} restaurant - Objeto del restaurante
 */
export async function exportScheduleTxt(restaurant) {
  try {
    const lines = [
      "==============================================",
      `  ${restaurant.name || "Mi Restaurante"} — Horario`,
      `  Generado el ${new Date().toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric"
      })}`,
      "==============================================",
      "",
    ];

    if (restaurant.address) {
      lines.push(`📍 Dirección: ${restaurant.address}`);
    }
    if (restaurant.phone) {
      lines.push(`📞 Teléfono:  ${restaurant.phone}`);
    }
    if (restaurant.website) {
      lines.push(`🌐 Web:       ${restaurant.website}`);
    }

    lines.push("");
    lines.push("🕐 Horarios:");
    lines.push("----------------------------------------------");

    const hours = restaurant.opening_hours || [];
    if (hours.length > 0) {
      hours.forEach((h) => lines.push(`  ${h}`));
    } else {
      lines.push("  Sin horario registrado.");
    }

    lines.push("");
    lines.push("==============================================");
    lines.push("Descarga Local Eats para más información.");

    const fileName = (restaurant.name || "horario").replace(/\s+/g, "_").toLowerCase();
    const filePath = PATHS.exports + `${fileName}_horario.txt`;

    await FileSystem.writeAsStringAsync(filePath, lines.join("\n"), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: "Compartir horario",
      });
    }

    await logInfo("exportSchedule", `Horario de "${restaurant.name}" exportado`);
  } catch (err) {
    logError("exportScheduleTxt", err);
  }
}

/**
 * Exporta un reporte de estadísticas del restaurante a .txt.
 * @param {Object} restaurant
 */
export async function exportAnalyticsTxt(restaurant) {
  try {
    const lines = [
      "==============================================",
      `  ${restaurant.name || "Mi Restaurante"} — Reporte de Estadísticas`,
      `  Generado el ${new Date().toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      })}`,
      "==============================================",
      "",
      "📊 MÉTRICAS",
      "----------------------------------------------",
      `  👁  Vistas totales:        ${restaurant.views || 0}`,
      `  📍 Solicitudes de ruta:   ${restaurant.directionsClicks || 0}`,
      `  ❤️  Guardado en favoritos: ${restaurant.favoritesCount || 0}`,
      `  ⭐ Calificación promedio: ${restaurant.averageRating || "Sin calificaciones"}`,
      `  💬 Total de reseñas:      ${restaurant.totalReviews || 0}`,
      "",
      "📈 CONVERSIÓN",
      "----------------------------------------------",
    ];

    const views = restaurant.views || 0;
    const favs = restaurant.favoritesCount || 0;
    const dirs = restaurant.directionsClicks || 0;
    const pctFav = views > 0 ? ((favs / views) * 100).toFixed(1) : "0.0";
    const pctDir = views > 0 ? ((dirs / views) * 100).toFixed(1) : "0.0";

    lines.push(`  Vistas → Favoritos:    ${pctFav}%`);
    lines.push(`  Vistas → Cómo llegar: ${pctDir}%`);
    lines.push("");
    lines.push("==============================================");
    lines.push("Reporte generado por Local Eats.");

    const fileName = (restaurant.name || "stats").replace(/\s+/g, "_").toLowerCase();
    const filePath = PATHS.exports + `${fileName}_estadisticas_${Date.now()}.txt`;

    await FileSystem.writeAsStringAsync(filePath, lines.join("\n"), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: "Compartir estadísticas",
      });
    }

    await logInfo("exportAnalytics", `Estadísticas de "${restaurant.name}" exportadas`);
  } catch (err) {
    logError("exportAnalyticsTxt", err);
  }
}

/* =============================================
   LIMPIEZA DE ARCHIVOS
============================================= */

/**
 * Elimina todos los archivos de exportación generados.
 */
export async function clearExports() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.exports);
    if (info.exists) {
      await FileSystem.deleteAsync(PATHS.exports, { idempotent: true });
      await FileSystem.makeDirectoryAsync(PATHS.exports, { intermediates: true });
      await logInfo("FileManager", "Exports limpiados");
    }
  } catch (err) {
    logError("clearExports", err);
  }
}

/**
 * Elimina todos los archivos de caché.
 */
export async function clearCache() {
  try {
    const info = await FileSystem.getInfoAsync(PATHS.cache);
    if (info.exists) {
      await FileSystem.deleteAsync(PATHS.cache, { idempotent: true });
      await FileSystem.makeDirectoryAsync(PATHS.cache, { intermediates: true });
      await logInfo("FileManager", "Caché limpiado");
    }
  } catch (err) {
    logError("clearCache", err);
  }
}

/**
 * Elimina todos los archivos generados por el FileManager.
 */
export async function clearAll() {
  await clearCache();
  await clearExports();
  await clearErrorLog();
}

/**
 * Retorna el tamaño total en MB de los archivos generados.
 * @returns {string} "X.XX MB"
 */
export async function getTotalStorageUsed() {
  try {
    let total = 0;
    const dirs = [PATHS.logs, PATHS.cache, PATHS.exports];
    for (const dir of dirs) {
      const info = await FileSystem.getInfoAsync(dir, { size: true });
      if (info.exists && info.size) total += info.size;
    }
    return (total / (1024 * 1024)).toFixed(2) + " MB";
  } catch {
    return "0.00 MB";
  }
}

/* =============================================
   UTILIDADES INTERNAS
============================================= */

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

async function _appendLine(path, line) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    const existing = info.exists
      ? await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 })
      : "";
    await FileSystem.writeAsStringAsync(path, existing + line + "\n", {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (_) {}
}

/* =============================================
   EJEMPLO DE USO
   ─────────────────────────────────────────
   En App.js:
     import { initFileSystem } from "./Services/FileManager";
     useEffect(() => { initFileSystem(); }, []);

   En cualquier pantalla para registrar errores:
     import { logError, logInfo } from "./Services/FileManager";
     try { ... } catch(err) { logError("HomeScreen", err); }

   En FavoritesScreen para exportar:
     import { exportFavoritesToTxt } from "./Services/FileManager";
     <Button onPress={() => exportFavoritesToTxt(favorites)} />

   En AnalyticsScreen para exportar estadísticas:
     import { exportAnalyticsTxt } from "./Services/FileManager";
     <Button onPress={() => exportAnalyticsTxt(restaurant)} />
============================================= */