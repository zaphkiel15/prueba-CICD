document.addEventListener("DOMContentLoaded", function () {
    function setupModal(modalId, openBtnId, closeBtnId) {
        const modal = document.getElementById(modalId);
        const openBtn = document.getElementById(openBtnId);
        const closeBtn = document.getElementById(closeBtnId);

        if (modal && openBtn && closeBtn) {
            openBtn.addEventListener("click", () => {
                modal.style.display = "flex";
            });

            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });

            // Cerrar el modal si se hace clic fuera de él
            window.addEventListener("click", (event) => {
                if (event.target === modal) {
                    modal.style.display = "none";
                }
            });
        } else {
            console.warn(`⚠️ Elementos no encontrados para modal: ${modalId}`);
        }
    }

    // Configurar múltiples modales
    setupModal("modaledit", "editar", "cerrar");
    setupModal("productmodal", "new", "cerrarnew");
});
