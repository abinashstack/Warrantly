import dotenv from 'dotenv';
dotenv.config(); // 🔑 MUST be first

import cors from 'cors';
import express from 'express';
import categoriesRouter from './routes/categories.js';
import customerRouter from './routes/customers.js';
import dealerModelRouter from './routes/dealerModels.js';
import dealerProductRouter from './routes/dealerProducts.js';
import dealerRouter from './routes/dealers.js';
import dealerUserRouter from './routes/dealerUser.js';
import invoiceRouter from './routes/invoices.js';
import itemsRouter from './routes/items.js';
import onboardingRouter from './routes/onboarding.js';
import productsRouter from './routes/products.js';
import profileRouter from './routes/profiles.js';
import uploadRouter from './routes/upload.js';
import userProductsRouter from './routes/userProducts.js';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:8081', // Expo web
      'http://localhost:3000', // optional
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());

app.use('/api/onboarding', onboardingRouter);

app.use('/api/profile', profileRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/user-products", userProductsRouter);
app.use("/api/invoices", invoiceRouter);
app.use('/api/dealers', dealerRouter);
app.use('/api/dealerUsers', dealerUserRouter);
app.use("/api/categories", categoriesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/products', productsRouter);
app.use('/api/dealerProducts', dealerProductRouter);
app.use('/api/dealerModels', dealerModelRouter);
app.use('/api/customers', customerRouter);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
