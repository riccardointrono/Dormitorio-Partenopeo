document.addEventListener("DOMContentLoaded", () => {
    caricaCamere();
});

async function caricaCamere() {
    try {
        const res = await fetch("http://127.0.0.1:5000/camere");
        const camere = await res.json();

        camere.forEach(c => {
            const span = document.getElementById(`prezzo-${c.tipo_camera}`);
            if (span) {
                span.textContent = `€${c.prezzo_notte} / notte`;
            }
        });

    } catch (err) {
        console.error(err);
        alert("Errore di connessione al server");
    }
}

function prenota(tipo_camera) {
    localStorage.setItem(
        "prenotazione_temp",
        JSON.stringify({ tipo: tipo_camera })
    );

    window.location.href = "prenotazione.html";
}
