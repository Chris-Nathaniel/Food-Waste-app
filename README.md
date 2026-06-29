# Food Waste Tracker App

A modern, full-stack Machine Learning web application built to log, track, and analyze food inventory to significantly minimize household or commercial food waste. 

This repository features a highly responsive UI powered by TypeScript and Vite, backed by a robust backend server capable of maintaining persistent inventory records and processing machine learning metadata.

---

## 🚀 Key Features

* **Real-time Inventory Management:** Easily log food items, set expiration dates, and monitor stock levels.
* **Waste Analytics:** Deep insights and visual tracking of discarded items using `waste_logs.json`.
* **Smart Meta-Data Tracking:** Pre-configured data schemas (`metadata.json`) designed to interface smoothly with predictive machine learning modules.
* **Dynamic & Interactive UI:** Responsive web buttons and clean UI configurations utilizing modern TypeScript paradigms.

---

## 🛠️ Tech Stack

* **Frontend:** TypeScript, Vite, HTML5, CSS3
* **Backend:** Node.js, TypeScript (`server.ts`)
* **Data Storage:** Local JSON-based persistent file structures (`inventory_data.json`, `waste_logs.json`)

---

## 📁 Repository Structure

```text
├── assets/.aistudio/       # Project metadata and AI Studio asset configurations
├── src/                    # Main source code for frontend components
├── .env.example            # Template for environment variables
├── index.html              # Core application entry point HTML
├── inventory_data.json     # Active storage for tracked food items
├── metadata.json           # Machine learning and project architecture metadata
├── package.json            # Node.js dependencies and script mappings
├── server.ts               # Backend application server logic
├── tsconfig.json           # TypeScript compilation configurations
├── vite.config.ts          # Build and development configuration for Vite
└── waste_logs.json         # Historical archive of logged food waste
