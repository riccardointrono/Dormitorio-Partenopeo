const studente = JSON.parse(localStorage.getItem("studente"));

document.addEventListener("DOMContentLoaded", () => {
    caricaRecensioni();

    const form = document.getElementById("reviewForm");
    if (form) {
        form.addEventListener("submit", inviaRecensione);
    }
});

// =========================
// CREA RECENSIONE
// =========================
async function inviaRecensione(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("studente"));

    if (!user || !user.token) {
        alert("Devi essere loggato per lasciare una recensione");
        localStorage.setItem("redirect_after_login", "recensioni.html");
        window.location.href = "login.html";
        return;
    }

    const commento = document.getElementById("reviewText").value.trim();

    if (!commento) {
        alert("Scrivi una recensione");
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:5000/crea_recensione", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            body: JSON.stringify({ commento })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Errore invio recensione");
            return;
        }

        e.target.reset();
        caricaRecensioni();

    } catch (err) {
        console.error("Errore invio recensione:", err);
        alert("Errore di connessione col server");
    }
}

// =========================
// VISUALIZZA RECENSIONI
// =========================
async function caricaRecensioni() {
    const container = document.getElementById("recensioni-list");
    container.innerHTML = "Caricamento...";

    try {
        const res = await fetch("http://127.0.0.1:5000/recensioni");
        const data = await res.json();

        if (!data.success || data.recensioni.length === 0) {
            container.innerHTML = "<p>Nessuna recensione presente.</p>";
            return;
        }

        container.innerHTML = "";

        data.recensioni.forEach(r => {
            const div = document.createElement("div");
            div.classList.add("recensione-box");

            div.innerHTML = `
                <strong>${r.nome} ${r.cognome}</strong><br>
                <p>${r.commento}</p>
                <span>${new Date(r.data_recensione).toLocaleString()}</span>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error("Errore caricamento recensioni:", err);
        container.innerHTML = "Errore nel caricamento recensioni";
    }
}
