document.addEventListener("DOMContentLoaded", function () {
    // 📌 MODAL
    const modal = document.getElementById("modalreserv");
    const btn = document.getElementById("reser");
    const btn1 = document.getElementById("cerrar");
    const calendario = document.getElementById('calendario'); 

    if (modal && btn && btn1) {
        btn.addEventListener("click", () => {
            modal.style.display = "flex";
            calendario.classList.add("calendario-difuminado");
        });

        btn1.addEventListener("click", () => {
            modal.style.display = "none";
            calendario.classList.remove("calendario-difuminado");
        });

        // Cerrar el modal si se hace clic fuera de él
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
                calendario.classList.remove("calendario-difuminado");
            }
        });
    } else {
        console.warn("⚠️ Modal o botones no encontrados en el DOM.");
    }


});
