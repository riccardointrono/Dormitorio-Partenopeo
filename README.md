# Dormitorio Partenopeo – Project Test Instructions

This document provides the instructions required to run and test the **Dormitorio Partenopeo** project.

---

## Backend

Open a terminal and run:
```bash
cd /path/to/dormitorio_partenopeo/backend
python3 main.py
```

Expected output:
```
* Running on http://127.0.0.1:5000
* Debugger is active!
```

Open a browser and go to:
```
http://127.0.0.1:5000/
```

Expected result:
```
{"message":"Backend Flask running and connected to MongoDB"}
```

---

## Frontend

Open a new terminal and run:
```bash
cd /path/to/dormitorio_partenopeo/frontend
python3 -m http.server 8080
```

Expected output:
```
Serving HTTP on :: port 8080 (http://[::]:8080/) …
```

Open a browser and go to:
```
http://127.0.0.1:8080/index.html
```

---

## Database

### MongoDB Atlas (Online – Recommended)

The backend is configured to connect to a **MongoDB Atlas online database** using a predefined test user.

- No MongoDB Atlas account is required to run or test the project.
- The professor can simply start the backend and frontend and use the application.
- All data is stored and retrieved automatically from the online database.

### MongoDB Local (Optional)

For additional safety and for local testing, a **database dump** is provided in the `db_dump/` folder.

#### Restore the database locally

1. Install MongoDB if it is not already installed:

- **macOS (Homebrew)**:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew tap mongodb/brew
brew install mongodb-community@7.0
```

- **Windows or Linux**: follow the official MongoDB documentation:
https://www.mongodb.com/docs/manual/installation/

2. Open a terminal and navigate to the project folder:
```bash
cd /path/to/dormitorio_partenopeo
```

3. Restore the database dump:
```bash
mongorestore --drop --db dormitory_db db_dump/dormitory_db
```

Explanation of parameters:
- `--drop`: removes existing data before restoring
- `--db dormitory_db`: specifies the database name
- `db_dump/dormitory_db`: path to the dump folder

### Verification

1. Start the backend as described above.
2. Open `http://127.0.0.1:5000/` in the browser to verify the MongoDB connection.

---

## Notes

- All data contained in the database is **fictitious** and used only for project evaluation.
- The project can be fully tested without accessing MongoDB Atlas directly.
- The local database option is provided as a backup and for additional verification.


