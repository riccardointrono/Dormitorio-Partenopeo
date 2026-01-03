document.addEventListener("DOMContentLoaded", () => {

    const pren = JSON.parse(localStorage.getItem("prenotazione_confermata"));

    if (!pren) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("camera").textContent = pren.tipo_camera;
    document.getElementById("checkin").textContent = pren.checkin;
    document.getElementById("checkout").textContent = pren.checkout;
    document.getElementById("totale").textContent = pren.totale;

    // 🧹 pulizia
    localStorage.removeItem("prenotazione_confermata");
});
