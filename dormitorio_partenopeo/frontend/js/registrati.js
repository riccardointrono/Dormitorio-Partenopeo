document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cognome = document.getElementById("cognome").value.trim();
    const cf = document.getElementById("cf").value.trim().toUpperCase();
    const matricola = document.getElementById("matricola").value.trim();
    const password = document.getElementById("password").value;
    const confermaPassword = document.getElementById("confermaPassword").value;

    // 🔍 Controlli base
    if (!nome || !cognome || !cf || !matricola || !password || !confermaPassword) {
        alert("❌ Compila tutti i campi");
        return;
    }

    if (cf.length !== 16) {
        alert("❌ Il codice fiscale deve essere di 16 caratteri");
        return;
    }

    if (matricola.length !== 10) {
        alert("❌ La matricola deve essere di 10 caratteri");
        return;
    }

    if (password !== confermaPassword) {
        alert("❌ Le password non coincidono");
        return;
    }

    const studente = {
        cf,
        matricola,
        nome,
        cognome,
        password
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/registrazione-studente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studente)
        });

        const result = await response.json();

        if (!result.success) {
            alert("❌ " + result.message);
            return;
        }

        alert("✅ Registrazione completata!");
        window.location.href = "login.html";

    } catch (err) {
        console.error(err);
        alert("❌ Errore di connessione al server");
    }
});
