export function initNetworkListeners() {
  window.addEventListener("online", () => {
    console.log("Network online");
  });

  window.addEventListener("offline", () => {
    console.log("Network offline");
  });
}

export async function syncNow() {
  try {
    const syncModule = await import("./sync-engine");

    if (typeof syncModule.syncFromRemote === "function") {
      await syncModule.syncFromRemote();
    }

    return {
      success: true,
      message: "Sync completed successfully",
    };
  } catch (error) {
    console.error("Sync failed:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown sync error",
    };
  }
}
