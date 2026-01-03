// ===========================================================
//           PROTEZIONE ACCESSO
// ===========================================================

const studente = JSON.parse(localStorage.getItem("studente"));

if (!studente) {
    window.location.href = "login.html";
}

// ===========================================================
//           AVVIO DASHBOARD
// ===========================================================

document.addEventListener("DOMContentLoaded", () => {
    caricaDatiStudente();
    caricaPrenotazioni();

    // LOGOUT
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("studente");
            window.location.href = "index.html";
        });
    }
});

// ===========================================================
//           DATI PERSONALI
// ===========================================================

async function caricaDatiStudente() {
    try {
        const res = await fetch("http://127.0.0.1:5000/dati-studente-dashboard", {
            headers: {
                "Authorization": `Bearer ${studente.token}`
            }
        });

        const data = await res.json();
        if (!data.success) return;

        const u = data.utente;

        document.getElementById("nome-benvenuto").textContent = u.nome;
        document.getElementById("nome").textContent = u.nome;
        document.getElementById("cognome").textContent = u.cognome;
        document.getElementById("matricola").textContent = u.matricola;

    } catch (err) {
        console.error("Errore dati studente:", err);
    }
}

// ===========================================================
//           PRENOTAZIONI (SOLO CONFERMATE)
// ===========================================================

async function caricaPrenotazioni() {
    const list = document.getElementById("prenotazioni-list");
    list.innerHTML = "Caricamento...";

    try {
        const res = await fetch("http://127.0.0.1:5000/prenotazioni-effettuate", {
            headers: {
                "Authorization": `Bearer ${studente.token}`
            }
        });

        const data = await res.json();

        const prenotazioni = data.prenotazioni
            .filter(p => p.stato === "confermata");

        if (!data.success || prenotazioni.length === 0) {
            list.innerHTML = "<p>Nessuna prenotazione trovata.</p>";
            return;
        }

        list.innerHTML = "";

        prenotazioni.forEach(p => {
            const div = document.createElement("div");
            div.classList.add("item-box");

            const giorniPrima =
                (new Date(p.checkin) - new Date()) / (1000 * 60 * 60 * 24);

            const annullabile = giorniPrima >= 7;

            div.innerHTML = `
                <p><strong>Camera:</strong> ${p.tipo_camera}</p>
                <p><strong>Check-in:</strong> ${p.checkin}</p>
                <p><strong>Check-out:</strong> ${p.checkout}</p>
                <p><strong>Totale:</strong> €${p.prezzo_finale}</p>

                ${
                    annullabile
                        ? `<button class="btn-annulla"
                                onclick="annullaPrenotazione(${p.id})">
                                ❌ Annulla prenotazione
                           </button>`
                        : `<span class="non-annullabile">
                                ⛔ Non annullabile
                           </span>`
                }
                <hr>
            `;

            list.appendChild(div);
        });

    } catch (err) {
        console.error("Errore prenotazioni:", err);
        list.innerHTML = "Errore nel caricamento.";
    }
}

// ===========================================================
//           ANNULLA PRENOTAZIONE
// ===========================================================

async function annullaPrenotazione(id) {
    if (!confirm("Vuoi annullare questa prenotazione?")) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/annulla-prenotazione/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${studente.token}`
            }
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.msg || "❌ Prenotazione non annullabile");
            return;
        }

        alert("✅ Prenotazione annullata");
        caricaPrenotazioni();

    } catch (err) {
        console.error(err);
        alert("Errore annullamento");
    }
}