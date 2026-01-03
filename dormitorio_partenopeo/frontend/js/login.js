document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const matricola = document.getElementById("matricola").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!matricola || !password) {
        alert("Inserisci tutti i campi.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/login-studente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricola, password })
        });

        const data = await response.json();

        if (!data.success) {
            alert("Matricola o password errati.");
            return;
        }

        // 🔐 Salva l’utente loggato
        localStorage.setItem("studente", JSON.stringify({
            cf: data.studente.cf,
            nome: data.studente.nome,
            cognome: data.studente.cognome,
            matricola: data.studente.matricola,
            token: data.token
        }));


        // 🔄 Redirect intelligente per la prenotazione
        const redirectTo = localStorage.getItem("redirect_after_login");
        if (redirectTo === "prenotazione.html") {
            localStorage.removeItem("redirect_after_login");
            window.location.href = "prenotazione.html";
            return;
        }


        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Errore durante il login:", err);
        alert("Errore di connessione al server.");
    }
});
