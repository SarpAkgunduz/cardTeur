# CardTeur

CardTeur is a full-stack web application that allows users to create, view, and manage custom football player cards, similar to those seen in FIFA or football manager games.

The app lets users assign abilities, upload images, and categorize player cards. Future plans include implementing team-matching features to automatically form balanced teams.

---

## 🛠️ Tech Stack

### Frontend (`openteur/`)

* React
* TypeScript
* React Router DOM
* Bootstrap
* React Bootstrap
* Recharts (for radar charts)
* Vite

### Backend (`server/`)

* Node.js
* Express.js
* MongoDB (with Mongoose ODM)
* CORS
* dotenv

---

## 📂 Project Structure

```
cardteur/
├── openteur/              # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                # Backend (Express + MongoDB)
│   ├── models/
│   ├── routes/
│   ├── index.js
│   └── package.json
├── .gitignore
└── .env                   # MongoDB URI stored here
```

---

## 📦 Installed Packages

### ✅ `openteur/` (Frontend)

```bash
cd openteur
npm install react react-dom
npm install --save-dev typescript @types/react @types/react-dom
npm install react-router-dom @types/react-router-dom
npm install bootstrap react-bootstrap
npm install recharts
```

### ✅ `server/` (Backend)

```bash
cd server
npm install express mongoose cors dotenv
npm install --save-dev nodemon
```

> Note: CORS is explicitly configured to allow communication from `http://localhost:5173`

---

## ⚙️ Setup Guide

### 1. Clone the Project

```bash
git clone https://github.com/your-username/cardteur.git
cd cardteur
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```
MONGO_URI=your_mongodb_connection_string
```

Start the server:

```bash
npm run dev
```

### 3. Setup the Frontend

```bash
cd ../openteur
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser to access the app.

---

## 📖 Features

* Create custom player cards
* Upload player images
* Assign detailed stats (offense, defense, athleticism, etc.)
* Delete or compare player cards with radar charts
* Responsive UI with sliding compare panel

---

## 🔐 License

This project is open-source and available under the MIT License.
