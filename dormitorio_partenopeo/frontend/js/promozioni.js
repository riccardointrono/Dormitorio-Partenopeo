document.addEventListener("DOMContentLoaded", caricaPromozione);

async function caricaPromozione() {
    const grid = document.getElementById("promo-grid");
    grid.innerHTML = "Caricamento promozione...";

    try {
        const res = await fetch("http://127.0.0.1:5000/promozioni");
        const data = await res.json();

        if (!data.success || data.promozioni.length === 0) {
            grid.innerHTML = `
                <div class="promo-card">
                    <h2>Nessuna promozione attiva</h2>
                    <p>Al momento non sono disponibili offerte.</p>
                </div>
            `;
            return;
        }

        const p = data.promozioni[0]; // UNA SOLA PROMO

        grid.innerHTML = `
            <div class="promo-card">
                <h2>${p.nome}</h2>
                <p>Sconto del <strong>${p.sconto_percentuale}%</strong> su tutte le tipologie di camere.</p>
                <span class="promo-valid">Offerta attiva</span>
            </div>
        `;

    } catch (err) {
        console.error(err);
        grid.innerHTML = "Errore nel caricamento promozione.";
    }
}
