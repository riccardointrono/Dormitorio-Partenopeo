document.getElementById("home-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const persone = parseInt(document.getElementById("adults").value);

    if (!checkin || !checkout) {
        alert("Inserisci le date di soggiorno");
        return;
    }

    if (checkout <= checkin) {
        alert("La data di partenza deve essere successiva a quella di arrivo");
        return;
    }

    // Conversione persone → tipo camera
    let tipo_camera = "";
    if (persone === 1) tipo_camera = "singola";
    else if (persone === 2) tipo_camera = "doppia";
    else if (persone === 3) tipo_camera = "tripla";
    else if (persone === 4) tipo_camera = "quadrupla";

    try {
        const response = await fetch("http://127.0.0.1:5000/controlla-disponibilita", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tipo_camera: tipo_camera,
                data_inizio: checkin,
                data_fine: checkout
            })
        });

        const result = await response.json();

        if (!result.disponibile) {
            alert("❌ Nessuna camera disponibile per le date selezionate");
            return;
        }

        // ✅ Salvataggio temporaneo
        localStorage.setItem("prenotazione_temp", JSON.stringify({
            tipo_camera: tipo_camera,
            checkin: checkin,
            checkout: checkout
        }));

        // 👉 vai al form di prenotazione
        window.location.href = "prenotazione.html";

    } catch (err) {
        console.error(err);
        alert("Errore di comunicazione con il server");
    }
});
