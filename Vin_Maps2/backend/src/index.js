require('dotenv').config();
const express = require('express');
const routeHandler = require('./routes/route');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routeHandler);

app.listen(PORT, () => console.log(`VinMaps backend listening on port ${PORT}`));
