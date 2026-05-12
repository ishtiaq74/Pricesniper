# PriceSniper 🎯

A full-stack **MERN** price tracker that scrapes product prices from e-commerce URLs, tracks price history, compares prices across products, and alerts you via email when prices drop below your target.

---

## Features

| # | Feature | Details |
|---|---------|---------|
| 1 | **Product Adder** | Paste a URL + set a target price; title, price, and image are scraped automatically |
| 2 | **Multi-Platform Scraping** | Supports Amazon, Daraz, and generic e-commerce sites with fallback selectors |
| 3 | **Hardened Amazon Scraper** | Rotating user-agents, browser-like headers, and retry logic to reduce blocks |
| 4 | **Price History Chart** | Recharts line graph showing price over time per product |
| 5 | **Manual Refresh** | Re-scrape any product on demand |
| 6 | **Target Price Alert** | Green/red badge on each card; email notification sent via Brevo API when price drops |
| 7 | **Auto Price Refresh** | Background job periodically re-scrapes all tracked products |
| 8 | **Live Currency Conversion** | Convert prices between currencies in real time |
| 9 | **Product Price Comparison** | Side-by-side price comparison across tracked products |
| 10 | **My Products Page** | Dedicated page showing only the logged-in user's tracked products |
| 11 | **Authentication** | User registration and login with protected routes |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Community Edition (local or Atlas) |

Make sure MongoDB is running on the default port `27017` before starting locally.

---

## Folder Structure

```
pricesniper/
├── backend/
│   ├── controllers/
│   │   └── scraperController.js   ← Scraping + CRUD logic
│   ├── models/
│   │   ├── Product.js             ← Mongoose product schema
│   │   └── User.js                ← Mongoose user schema
│   ├── routes/
│   │   └── productRoutes.js       ← Express routes
│   ├── utils/
│   │   └── alertUtils.js          ← Email alert + price refresh scripts
│   ├── .env                       ← Environment variables
│   ├── server.js                  ← Express entry point
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── AddProductForm.js   ← URL + target price form
    │   │   ├── ProductCard.js      ← Product tile with chart + alert badge
    │   │   └── PriceChart.js       ← Recharts line chart
    │   ├── pages/
    │   │   ├── Dashboard.js        ← Main product grid
    │   │   └── MyProductsPage.js   ← User's personal tracked products
    │   ├── App.js                  ← Routing
    │   ├── index.js
    │   └── index.css               ← Tailwind + custom styles (white/orange theme)
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Setup & Run

### 1. Clone the repo

```bash
git clone https://github.com/ishtiaq74/Pricesniper.git
cd Pricesniper
```

### 2. Configure environment variables

Create a `backend/.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pricesniper
JWT_SECRET=your_jwt_secret_here
BREVO_API_KEY=your_brevo_api_key_here
```

### 3. Install & start the backend

```bash
cd backend
npm install
npm run dev
```

> Backend runs on **http://localhost:5000**

### 4. Install & start the frontend (new terminal)

```bash
cd frontend
npm install
npm start
```

> Frontend runs on **http://localhost:3000**

> **Note:** In production/deployment, the frontend uses an explicit `axios` baseURL pointing to the backend. The `proxy` field in `package.json` is only for local development.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET` | `/api/products` | Fetch all tracked products |
| `POST` | `/api/products` | Add + scrape a new product |
| `PUT` | `/api/products/:id/refresh` | Re-scrape and update price |
| `PUT` | `/api/products/:id/target` | Update target price |
| `DELETE` | `/api/products/:id` | Delete a product |

### POST `/api/products` — Request Body

```json
{
  "url": "https://www.amazon.com/dp/XXXXX",
  "targetPrice": 49.99
}
```

---

## How the Scraper Works

`scraperController.js` uses **axios** to fetch raw HTML and **cheerio** to parse it.

```
URL → axios.get() (with rotating UAs + browser headers + retry logic)
    → cheerio.load(html)
    → tries selectors in priority order: Amazon → Daraz → generic
    → returns { title, price, image }
```

Supported platforms: **Amazon**, **Daraz**, and most generic e-commerce sites.

---

## Email Alerts

PriceSniper uses the **Brevo (formerly Sendinblue) API** to send email notifications when a product's scraped price drops at or below the user's target price. An auto-refresh job runs in the background to periodically check all tracked prices.

To enable alerts, add your `BREVO_API_KEY` to `backend/.env`.

---

## Tech Stack

- **MongoDB** — NoSQL database for products, price history, and users
- **Express.js** — REST API with MVC pattern
- **React 18** — Frontend SPA with React Router
- **Node.js** — Runtime
- **axios** — HTTP client (scraping + frontend API calls)
- **cheerio** — Server-side HTML parsing
- **mongoose** — MongoDB ODM
- **jsonwebtoken** — JWT-based authentication
- **Brevo API** — Transactional email for price alerts
- **recharts** — React charting library for price history
- **Tailwind CSS** — Utility-first CSS (white/orange brand theme)
