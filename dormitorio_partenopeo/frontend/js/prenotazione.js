document.addEventListener("DOMContentLoaded", () => {
    const temp = localStorage.getItem("prenotazione_temp");

    if (temp) {
        const dati = JSON.parse(temp);

        if (dati.tipo_camera) {
            document.getElementById("camera").value = dati.tipo_camera;
        }

        if (dati.checkin) {
            document.getElementById("checkin").value = dati.checkin;
        }

        if (dati.checkout) {
            document.getElementById("checkout").value = dati.checkout;
        }
    }
});

document.querySelector(".reservation-form").addEventListener("submit", async e => {
    e.preventDefault();

    const studente = JSON.parse(localStorage.getItem("studente"));
    const token = studente?.token;

    // 🔐 controllo login
    if (!studente || !token) {
        localStorage.setItem("redirect_after_login", "prenotazione.html");
        alert("Devi effettuare il login per continuare");
        window.location.href = "login.html";
        return;
    }

    const tipo_camera = document.getElementById("camera").value;
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;

    if (!checkin || !checkout) {
        alert("Inserisci le date di check-in e check-out");
        return;
    }

    try {
        // 🔍 1️⃣ controllo disponibilità
        const dispRes = await fetch("http://127.0.0.1:5000/controlla-disponibilita", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo_camera,
                data_inizio: checkin,
                data_fine: checkout
            })
        });

        const dispData = await dispRes.json();

        if (!dispData.disponibile) {
            alert("❌ Nessuna camera disponibile per le date selezionate");
            return;
        }

        // 🧾 2️⃣ crea prenotazione
        const prenRes = await fetch("http://127.0.0.1:5000/effettua-prenotazione", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                tipo_camera,
                checkin,
                checkout
            })
        });

        const prenData = await prenRes.json();

        if (!prenData.success) {
            alert("Errore durante la prenotazione");
            return;
        }

        localStorage.setItem("prenotazione", JSON.stringify({
            id_prenotazione: prenData.id_prenotazione,
            tipo_camera,
            checkin,
            checkout,
            prezzo_finale: prenData.prezzo_finale
        }));


        window.location.href = "pagamento.html";

    } catch (err) {
        console.error(err);
        alert("Errore di comunicazione col server");
    }
});
