# cardTeur

This is a website created with react.

Purpose of this project is creating player cards like menager games or fifa but the card created by users.

So you can create cards of your friends and set their abilities as you wish.

After I build the main card creation process I will make this a matchmaking tool which divides teams as fair as it can be.


# CardTeur

A full-stack app to manage custom football player cards. Inspired by FIFA, this system allows users to create, view, and update players with rich stats and visuals.

---

## 🧱 Tech Stack

### Frontend (`openteur/`)
- React
- TypeScript
- React Router DOM
- Bootstrap
- Vite

### Backend (`server/`)
- Node.js
- Express
- Mongoose (MongoDB ODM)
- CORS
- dotenv

---

## 📁 Project Structure

cardteur/
├── openteur/ # Frontend (Vite + React)
│ ├── src/
│ ├── public/
│ └── package.json
├── server/ # Backend (Express + MongoDB)
│ ├── routes/
│ ├── models/
│ ├── index.js
│ └── package.json
└── .env # MongoDB credentials


---

## 📦 Installed Packages

### ✅ `openteur/` (Frontend)

```bash
cd openteur
npm install react react-dom
npm install --save-dev typescript @types/react @types/react-dom
npm install react-router-dom
npm install --save-dev @types/react-router-dom
npm install bootstrap
npm install recharts
npm install react-bootstrap bootstrap


### ✅ 'server/' (Backend)

cd server
npm install express mongoose cors dotenv
npm install --save-dev nodemon

CORS is explicitly configured to allow communication from http://localhost:5173.


⚙️ Setup Guide
1. Clone the Project
on bash:

git clone https://github.com/your-username/cardteur.git
cd cardteur