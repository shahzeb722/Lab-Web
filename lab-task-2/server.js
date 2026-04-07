const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve CSS, JS, images from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// Route: Homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
app.listen(PORT, () => {
  console.log(`SAMSUNG running at http://localhost:${PORT}`);
});