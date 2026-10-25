<div align="center">

# 🎓 EduPlan

### Gestion du temps des professeurs

Application web réservée au **directeur** pour créer et gérer les emplois du temps des professeurs et des classes.

[![Démo en ligne](https://img.shields.io/badge/Démo-en%20ligne-1f2937?style=for-the-badge&logo=githubpages&logoColor=white)](https://ikram-zyat.github.io/eduplan/)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572b6?style=for-the-badge&logo=css3&logoColor=white)

</div>

---

## ✨ Fonctionnalités

- 🔐 **Espace directeur** : connexion réservée au directeur
- 📅 **Emploi du temps** du lundi au vendredi (8h–17h, pause déjeuner), avec deux vues :
  - **Planning des professeurs** : classes, matières et salles de chaque professeur
  - **Planning des classes** : matières et professeurs de chaque classe
- ➕ **Gestion complète** : ajouter, modifier et supprimer des professeurs, des classes, des matières et des cours
- 🚫 **Détection des conflits** : un professeur, une classe ou une salle ne peut pas être pris deux fois au même créneau
- 🗓️ **Choix de la semaine** par calendrier
- ✅ **Présence des professeurs** : noter présent ou absent pour chaque jour
- 🖨️ **Impression et export PDF** du planning sur une seule page (pour les professeurs ou les étudiants)
- 📊 **Rapports** : charge horaire, remplissage des classes, jours d'absence
- 🔍 **Recherche** dans les professeurs, classes et matières

## 🛠️ Technologies

| Outil | Rôle |
| --- | --- |
| React 18 | Interface |
| Vite | Outil de développement et de build |
| CSS | Style (sans bibliothèque externe) |
| localStorage | Enregistrement des données dans le navigateur |

## 🚀 Lancer le projet

```bash
git clone https://github.com/ikram-zyat/eduplan.git
cd eduplan
npm install
npm run dev
```

Puis ouvrir **http://localhost:5173/eduplan/**

**Compte de démonstration :** `directeur@eduplan.ma` / `admin123`

## 🌐 Déploiement (GitHub Pages)

```bash
npm run deploy
```

Ensuite, sur GitHub : **Settings → Pages → Branch `gh-pages` → `/ (root)`**.

## 📁 Structure

```
src/
├── App.jsx        Connexion, menu et navigation
├── Schedule.jsx   Emploi du temps, cours et présence
├── pages.jsx      Accueil, professeurs, classes, matières, rapports, paramètres
├── store.js       Données, actions et enregistrement
├── ui.jsx         Icônes et composants communs
└── styles.css     Style et mise en page d'impression
```

## ⚠️ À savoir

Cette version est une démonstration : les données sont enregistrées dans le navigateur et l'identifiant du directeur est défini dans `src/store.js`. Une version de production demande un backend (API et base de données) avec une vraie authentification.

## 👩‍💻 Auteure

**Ikram Zyat**, développeuse full-stack
[GitHub](https://github.com/ikram-zyat) · [Portfolio](https://ikram-zyat.github.io/portfolio)
