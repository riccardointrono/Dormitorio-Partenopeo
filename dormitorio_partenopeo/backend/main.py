from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
import datetime
import time
import threading
from datetime import datetime, timedelta

# ==============================
# ISTANZA FLASK E CORS
# ==============================
app = Flask(__name__)
# abilita CORS per TUTTE le rotte e tutte le origini (utile per sviluppo locale)
CORS(app, resources={r"/*": {"origins": "*"}})

# ==============================
# CHIAVE SEGRETA PER JWT
# ==============================
SECRET_KEY = "supersecretkey"

# ==============================
# IMPORT DEL DB
# ==============================
from database import db

@app.route("/")
def home():
    return jsonify({"message": "Backend Flask attivo e collegato a MongoDB"})

# =========================================================
# JOB: PULIZIA PRENOTAZIONI IN ATTESA SCADUTE
# =========================================================
def pulisci_prenotazioni_scadute():
    limite = datetime.utcnow() - timedelta(minutes=15)

    result = db["prenotazioni"].delete_many({
        "stato": "in_attesa",
        "creata_il": {"$lt": limite}
    })

    if result.deleted_count > 0:
        print(f"🧹 Eliminati {result.deleted_count} prenotazioni scadute")

def job_prenotazioni():
    while True:
        pulisci_prenotazioni_scadute()
        time.sleep(300)

# =========================================================
# AUTENTICAZIONE JWT - UTENTE CORRENTE
# =========================================================
def get_current_user():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    try:
        token = auth_header.split(" ")[1]  # Bearer TOKEN
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except:
        return None
    

# =========================================================
# FUNZIONE: VERIFICA DISPONIBILITÀ CAMERE
# =========================================================
def verifica_disponibilita(tipo_camera, checkin, checkout):

    # camere totali di quel tipo
    totale = db["camere"].count_documents({
        "tipo_camera": tipo_camera
    })

    if totale == 0:
        return False

    # prenotazioni che si sovrappongono
    occupate = db["prenotazioni"].count_documents({
        "tipo_camera": tipo_camera,
        "stato": "confermata",
        "$and": [
            {"checkin": {"$lt": checkout}},
            {"checkout": {"$gt": checkin}}
        ]
    })

    # basta che ce ne sia UNA libera
    return occupate < totale


# =========================================================
# CONTROLLO DISPONIBILITÀ - STUDENTE
# =========================================================
@app.route("/controlla-disponibilita", methods=["POST"])
def api_disponibilita():
    data = request.json

    disponibile = verifica_disponibilita(
        data["tipo_camera"],
        data["data_inizio"],
        data["data_fine"]
    )

    return jsonify({
        "disponibile": disponibile
    })

# =========================================================
# REGISTRAZIONE - STUDENTE
# =========================================================
import re
from flask import request, jsonify

@app.route("/registrazione-studente", methods=["POST"])
def registrazione_studente():
    data = request.json

    nome = data.get("nome")
    cognome = data.get("cognome")
    cf = data.get("cf")
    matricola = data.get("matricola")
    password = data.get("password")

    # Controllo campi obbligatori
    if not all([nome, cognome, cf, matricola, password]):
        return jsonify({
            "success": False,
            "message": "Dati mancanti"
        })

    # Controllo regex CF e matricola
    cf_regex = r"^[A-Z0-9]{16}$"
    matricola_regex = r"^\d{10}$"

    if not re.match(cf_regex, cf):
        return jsonify({
            "success": False,
            "message": "Il codice fiscale non rispetta il formato"
        })

    if not re.match(matricola_regex, matricola):
        return jsonify({
            "success": False,
            "message": "La matricola deve essere lunga 10 cifre"
        })

    # Controllo duplicati su CF e matricola
    esiste = db["studenti"].find_one({
        "$or": [
            {"cf": cf},
            {"matricola": matricola}
        ]
    })

    if esiste:
        return jsonify({
            "success": False,
            "message": "Studente già registrato"
        })

    # Inserimento diretto senza hash
    db["studenti"].insert_one({
        "nome": nome,
        "cognome": cognome,
        "cf": cf,
        "matricola": matricola,
        "password": password,
        "ruolo": "studente"
    })

    return jsonify({"success": True})

# =========================================================
# LOGIN - STUDENTE
# =========================================================
@app.route("/login-studente", methods=["POST"])
def login_studente():
    data = request.json
    matricola = data.get("matricola")
    password = data.get("password")

    if not matricola or not password:
        return jsonify({"success": False}), 400

    # cerca lo studente per matricola
    studente = db["studenti"].find_one(
        {"matricola": matricola}
    )

    # studente non trovato o password errata
    if not studente or studente["password"] != password:
        return jsonify({
            "success": False,
            "studente": None
        })


    # crea token JWT
    token = jwt.encode({
        "cf": studente["cf"],
        "ruolo": "studente",
        "exp": datetime.utcnow() + timedelta(hours=3)
    }, SECRET_KEY, algorithm="HS256")

    # rimuove password dalla risposta
    studente.pop("password", None)
    studente.pop("_id", None)

    return jsonify({
        "success": True,
        "studente": studente,
        "token": token
    })

# =========================================================
# DATI PERSONALI IN DASHBOARD - STUDENTE
# =========================================================
@app.route("/dati-studente-dashboard", methods=["GET"])
def studente_me():
    user = get_current_user()

    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    studente = db["studenti"].find_one(
        {"cf": user["cf"]},
        {"_id": 0, "password": 0}
    )

    if not studente:
        return jsonify({"success": False})

    return jsonify({
        "success": True,
        "utente": studente
    })


# =========================================================
# PRENOTAZIONI CONFERMATE - STUDENTE
# =========================================================
@app.route("/prenotazioni-effettuate", methods=["GET"])
def studente_prenotazioni():
    user = get_current_user()

    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    prenotazioni = list(
        db["prenotazioni"].find(
            {
                "cf_studente": user["cf"],
                "stato": "confermata"
            },
            {
                "_id": 0,
                "id": 1,
                "tipo_camera": 1,
                "checkin": 1,
                "checkout": 1,
                "stato": 1,
                "prezzo_finale": 1
            }
        ).sort("checkin", -1)
    )

    return jsonify({
        "success": True,
        "prenotazioni": prenotazioni
    })

# =========================================================
# ANNULLA PRENOTAZIONE - STUDENTE
# =========================================================
@app.route("/annulla-prenotazione/<int:id>", methods=["DELETE"])
def annulla_prenotazione(id):
    user = get_current_user()

    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    pren = db["prenotazioni"].find_one({
        "id": id,
        "cf_studente": user["cf"]
    })

    if not pren or pren["stato"] != "confermata":
        return jsonify({"success": False})

    oggi = datetime.utcnow()
    checkin = datetime.fromisoformat(pren["checkin"])
    diff_giorni = (checkin - oggi).days

    if diff_giorni < 7:
        return jsonify({
            "success": False,
            "msg": "Annullamento non consentito (meno di 7 giorni)"
        })

    db["prenotazioni"].update_one(
        {"id": id},
        {"$set": {"stato": "annullata"}}
    )

    return jsonify({"success": True})


# =========================================================
# VISUALIZZA CAMERE - STUDENTE
# =========================================================
@app.route("/camere", methods=["GET"])
def get_camere():
    camere = list(
        db["camere"].aggregate([
            {
                "$lookup": {
                    "from": "tariffe",
                    "localField": "tipo_camera",
                    "foreignField": "tipo_camera",
                    "as": "tariffa"
                }
            },
            {"$unwind": "$tariffa"},
            {
                "$project": {
                    "_id": 0,
                    "numero": 1,
                    "tipo_camera": 1,
                    "posti_letto": 1,
                    "prezzo_notte": "$tariffa.prezzo_notte"
                }
            }
        ])
    )
    return jsonify(camere)

# =========================================================
# PROMOZIONI ATTIVE - STUDENTE
# =========================================================
@app.route("/promozioni", methods=["GET"])
def get_promozioni():
    promo = list(
        db["promozioni"].find(
            {"attiva": True},
            {"_id": 0}
        )
    )
    return jsonify({
        "success": True,
        "promozioni": promo
    })


# =========================================================
# EFFETTUA PRENOTAZIONE - STUDENTE
# =========================================================
@app.route("/effettua-prenotazione", methods=["POST"])
def crea_prenotazione():
    user = get_current_user()
    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    data = request.json
    tipo_camera = data.get("tipo_camera")
    checkin = data.get("checkin")
    checkout = data.get("checkout")

    # controllo disponibilità
    disponibile = verifica_disponibilita(tipo_camera, checkin, checkout)
    if not disponibile:
        return jsonify({
            "success": False,
            "msg": "Nessuna camera disponibile per le date selezionate"
        })

    # calcolo notti
    notti = (datetime.fromisoformat(checkout) -
             datetime.fromisoformat(checkin)).days

    tariffa = db["tariffe"].find_one({"tipo_camera": tipo_camera})
    prezzo_base = tariffa["prezzo_notte"] * notti

    promo = db["promozioni"].find_one({"attiva": True})
    sconto = promo["sconto_percentuale"] if promo else 0
    prezzo_finale = prezzo_base - (prezzo_base * sconto / 100)

    last = db["prenotazioni"].find_one(sort=[("id", -1)])
    new_id = (last["id"] + 1) if last else 1

    db["prenotazioni"].insert_one({
        "id": new_id,
        "cf_studente": user["cf"],
        "tipo_camera": tipo_camera,
        "checkin": checkin,
        "checkout": checkout,
        "stato": "in_attesa",
        "prezzo_base": prezzo_base,
        "sconto_applicato": sconto,
        "prezzo_finale": prezzo_finale,
        "creata_il": datetime.utcnow()
    })

    return jsonify({
        "success": True,
        "id_prenotazione": new_id,
        "prezzo_finale": prezzo_finale
    })

# =========================================================
# PAGAMENTO PRENOTAZIONE - STUDENTE
# =========================================================
@app.route("/effettua-pagamento", methods=["POST"])
def paga_prenotazione():
    user = get_current_user()
    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    data = request.json
    id_pren = data.get("id_prenotazione")
    metodo = data.get("metodo")

    pren = db["prenotazioni"].find_one({
        "id": id_pren,
        "stato": "in_attesa"
    })

    if not pren:
        return jsonify({"success": False})

    db["prenotazioni"].update_one(
        {"id": id_pren},
        {"$set": {"stato": "confermata"}}
    )

    last = db["pagamenti"].find_one(sort=[("id", -1)])
    new_id = (last["id"] + 1) if last else 1

    db["pagamenti"].insert_one({
        "id": new_id,
        "id_prenotazione": id_pren,
        "cf_studente": user["cf"],
        "metodo": metodo,
        "importo": pren["prezzo_finale"],
        "data_pagamento": datetime.utcnow().isoformat()
    })

    return jsonify({"success": True})

# =========================================================
# RIEPILOGO PRENOTAZIONE - STUDENTE
# =========================================================
@app.route("/riepilogo-prenotazione/<int:id>", methods=["GET"])
def riepilogo_prenotazione(id):
    user = get_current_user()
    if not user or user["ruolo"] != "studente":
        return jsonify({"success": False}), 401

    pren = db["prenotazioni"].find_one(
        {
            "id": id,
            "cf_studente": user["cf"],
            "stato": "confermata"
        },
        {
            "_id": 0,
            "tipo_camera": 1,
            "checkin": 1,
            "checkout": 1,
            "prezzo_finale": 1
        }
    )

    if not pren:
        return jsonify({"success": False})

    return jsonify({"success": True, "prenotazione": pren})

# =========================================================
# LETTURA RECENSIONI - STUDENTE
# =========================================================
@app.route("/recensioni", methods=["GET"])
def get_recensioni():
    try:
        recensioni = list(
            db["recensioni"].find(
                {},
                {
                    "_id": 0,
                    "id_recensione": 1,
                    "commento": 1,
                    "data_recensione": 1,
                    "nome": 1,
                    "cognome": 1,
                    "ruolo": 1
                }
            ).sort("data_recensione", -1)
        )

        return jsonify({
            "success": True,
            "recensioni": recensioni
        })

    except Exception as e:
        print("Errore GET recensioni:", e)
        return jsonify({ "success": False })

# =========================================================
# CREA RECENSIONE - STUDENTE
# =========================================================
@app.route("/crea_recensione", methods=["POST"])
def crea_recensione():
    user = get_current_user()  # recupera dati utente loggato

    # Controllo ruolo
    if not user or user.get("ruolo") != "studente":
        return jsonify({"success": False, "message": "Accesso non autorizzato"}), 401

    data = request.json
    commento = data.get("commento", "").strip()

    if not commento:
        return jsonify({"success": False, "message": "Commento vuoto"}), 400

    # Recupero nome e cognome dal DB se non presenti in user
    studente_db = db["studenti"].find_one(
        {"cf": user["cf"]},
        {"_id": 0, "nome": 1, "cognome": 1}
    )
    nome = user.get("nome") or studente_db.get("nome", "")
    cognome = user.get("cognome") or studente_db.get("cognome", "")

    try:
        db["recensioni"].insert_one({
            "cf_studente": user["cf"],
            "nome": nome,
            "cognome": cognome,
            "commento": commento,
            "data_recensione": datetime.utcnow().isoformat()
        })
        return jsonify({"success": True})

    except Exception as e:
        print("Errore inserimento recensione:", e)
        return jsonify({"success": False, "message": "Errore server"}), 500

# =========================================================
if __name__ == "__main__":
    t = threading.Thread(target=job_prenotazioni)
    t.daemon = True
    t.start()

    app.run(debug=True)