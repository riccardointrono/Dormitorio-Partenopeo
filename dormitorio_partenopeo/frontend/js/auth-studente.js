document.addEventListener("DOMContentLoaded", () => {
    const studente = JSON.parse(localStorage.getItem("studente"));
    const authLink = document.getElementById("auth-link");

    if (!authLink) return;

    if (studente) {
        // STUDENTE LOGGATO → LOGOUT
        authLink.textContent = "🚪 Logout";
        authLink.href = "#";

        authLink.addEventListener("click", e => {
            e.preventDefault();
            localStorage.removeItem("studente");
            window.location.href = "index.html";
        });

    } else {
        // NON LOGGATO → LOGIN
        authLink.textContent = "👤 Accedi";
        authLink.href = "login.html";
    }
});
