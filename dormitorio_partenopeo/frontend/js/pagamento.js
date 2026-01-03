document.addEventListener("DOMContentLoaded", () => {
    // 🔹 Recupero prenotazione dal localStorage
    const pren = JSON.parse(localStorage.getItem("prenotazione"));

    if (!pren) {
        // Se non c'è prenotazione, torno alla pagina di prenotazione
        window.location.href = "prenotazione.html";
        return;
    }

    // 🧾 Mostro il riepilogo direttamente dal localStorage
    document.getElementById("riepilogo-camera").textContent = pren.tipo_camera;
    document.getElementById("riepilogo-checkin").textContent = pren.checkin;
    document.getElementById("riepilogo-checkout").textContent = pren.checkout;
    document.getElementById("riepilogo-totale").textContent = `€ ${pren.prezzo_finale}`;

    // 🔐 Recupero token dell'utente loggato
    const studente = JSON.parse(localStorage.getItem("studente"));
    const token = studente?.token;

    if (!studente || !token) {
        alert("Devi effettuare il login per continuare");
        window.location.href = "login.html";
        return;
    }

    // 💳 Gestione pagamento
    document.querySelector(".payment-form").addEventListener("submit", async e => {
        e.preventDefault();

        try {
            const resPay = await fetch("http://127.0.0.1:5000/effettua-pagamento", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    id_prenotazione: pren.id_prenotazione,
                    metodo: "carta"  // o un campo letto dal form
                })
            });

            const result = await resPay.json();

            if (!result.success) {
                alert("❌ Pagamento fallito");
                return;
            }

            // ✅ Salvo i dati finali per la conferma
            localStorage.setItem("prenotazione_confermata", JSON.stringify({
                tipo_camera: pren.tipo_camera,
                checkin: pren.checkin,
                checkout: pren.checkout,
                totale: pren.prezzo_finale
            }));

            // 🔹 Pulizia prenotazione temporanea
            localStorage.removeItem("prenotazione");

            // ➡️ Redirect alla pagina di conferma
            window.location.href = "conferma.html";

        } catch (err) {
            console.error("Errore pagamento:", err);
            alert("Errore di comunicazione col server");
        }
    });
});
