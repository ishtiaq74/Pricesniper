# PriceSniper 🎯

A full-stack **MERN** discount tracker that scrapes product prices from e-commerce URLs and alerts you when prices drop.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Community Edition (local) |

Make sure MongoDB is running locally on the default port `27017` before starting.

---

## Folder Structure

```
pricesniper/
├── backend/
│   ├── controllers/
│   │   └── scraperController.js   ← Scraping + CRUD logic
│   ├── models/
│   │   └── Product.js             ← Mongoose schema
│   ├── routes/
│   │   └── productRoutes.js       ← Express routes
│   ├── .env                       ← Environment variables
│   ├── server.js                  ← Express entry point
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── AddProductForm.js  ← URL + target price form
    │   │   ├── ProductCard.js     ← Product tile with chart
    │   │   └── PriceChart.js      ← Recharts line chart
    │   ├── pages/
    │   │   └── Dashboard.js       ← Main page
    │   ├── App.js
    │   ├── index.js
    │   └── index.css              ← Tailwind + custom styles
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Setup & Run

### 1. Clone / navigate to the project

```bash
cd pricesniper
```

### 2. Install & start the backend

```bash
cd backend
npm install
npm run dev
```

> Backend runs on **http://localhost:5000**

### 3. Install & start the frontend (new terminal)

```bash
cd frontend
npm install
npm start
```

> Frontend runs on **http://localhost:3000**

The `"proxy": "http://localhost:5000"` field in `frontend/package.json` automatically forwards all `/api/*` requests from the React dev server to the Express backend — **no CORS issues in development**.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Fetch all tracked products |
| `POST` | `/api/products` | Add + scrape a new product |
| `PUT` | `/api/products/:id/refresh` | Re-scrape and update price |
| `PUT` | `/api/products/:id/target` | Update target price |
| `DELETE` | `/api/products/:id` | Delete a product |

### POST /api/products — Request Body

```json
{
  "url": "https://www.amazon.com/dp/XXXXX",
  "targetPrice": 49.99
}
```

---

## How the Scraper Works

`scraperController.js` uses **axios** to fetch raw HTML and **cheerio** to parse it like jQuery.

```
URL → axios.get() → raw HTML string
     → cheerio.load(html) → jQuery-like $ selector
     → $ searches for title, price, image selectors in order
     → returns { title, price, image }
```

The scraper tries multiple CSS selectors in priority order (Amazon → generic) to work across a broad range of e-commerce sites.

---

## Features

| # | Feature | Location |
|---|---------|----------|
| 1 | **Product Adder** — paste URL, scrape title/price/image | `AddProductForm.js` + `scraperController.js` |
| 2 | **Price Dashboard** — responsive grid of all tracked items | `Dashboard.js` |
| 3 | **Manual Refresh** — button triggers re-scrape | `ProductCard.js` → `PUT /refresh` |
| 4 | **Price History Chart** — Recharts line graph | `PriceChart.js` |
| 5 | **Target Price Alert** — green/red badge on card | `ProductCard.js` |

---

## Environment Variables (`backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pricesniper
```

---

## Tech Stack

- **MongoDB** — NoSQL database for product and price history storage
- **Express.js** — REST API with MVC pattern
- **React 18** — Frontend SPA
- **Node.js** — Runtime
- **axios** — HTTP client (both backend scraping and frontend requests)
- **cheerio** — HTML parsing / scraping
- **mongoose** — MongoDB ODM
- **recharts** — React charting library
- **Tailwind CSS** — Utility-first CSS framework
