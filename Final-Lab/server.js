const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const config = require('config');

const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const User = require('./models/User');

const globalMiddleware = require('./middlewares/global');
const logger = require('./middlewares/logger');
const { ensureAdmin } = require('./middlewares/auth');

require('dotenv').config();

const app = express();
const PORT = config.has('port') ? config.get('port') : (process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || config.get('mongoURI');

// ─── View Engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ─── Middleware ────────────────────────────────────────────────
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(cors());

app.use(
  session({
    secret: config.get('jwtSecret'),
    resave: false,
    saveUninitialized: true,
  })
);

app.use(logger);
app.use(globalMiddleware);

// ─── Admin Layout Wrapper ──────────────────────────────────────
app.use('/admin', ensureAdmin, (req, res, next) => {
  res.locals.layout = 'admin-layout';
  next();
});

// ─── Multer Setup ──────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

// ─── Modular Routes ────────────────────────────────────────────
app.use('/auth', require('./routes/auth/index'));
app.use('/shop', require('./routes/shop/index'));
app.use('/shop/product', require('./routes/shop/product'));
app.use('/cart', require('./routes/shop/cart'));
app.use('/checkout', require('./routes/shop/checkout'));
app.use('/admin/categories', require('./routes/admin/categories'));
app.use('/admin/orders', require('./routes/admin/orders'));

// API Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/categories', require('./routes/api/categories'));
app.use('/api/orders', require('./routes/api/orders'));

// ─── Sales API Logic ───────────────────────────────────────────
const getSalesStats = async () => {
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = revenueAgg.length ? revenueAgg[0].totalRevenue : 0;
  const totalOrders  = revenueAgg.length ? revenueAgg[0].totalOrders  : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // We need to unwind items for top product
  const topProductAgg = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 1 }
  ]);

  let topProduct = 'N/A';
  if (topProductAgg.length) {
    const prod = await Product.findById(topProductAgg[0]._id);
    topProduct = prod ? prod.name : 'Unknown';
  }

  const recentOrders = await Order.find({ status: 'delivered' })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return { totalRevenue, totalOrders, avgOrderValue, topProduct, recentOrders };
};


// ══════════════════════════════════════════════════════════════
//  Core Routes (Remaining)
// ══════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.render('index', { title: 'Samsung Clone | Official Samsung US' });
});

app.get('/sales', ensureAdmin, async (req, res) => {
  try {
    const stats = await getSalesStats();
    res.render('sales', {
      title: 'Sales Dashboard | Samsung Clone',
      stats
    });
  } catch (error) {
    console.error('Failed to load sales dashboard:', error);
    res.status(500).send('Unable to load the sales dashboard. Please try again.');
  }
});

app.get('/api/sales-data', ensureAdmin, async (req, res) => {
  try {
    const stats = await getSalesStats();
    res.json({
      totalRevenue:  stats.totalRevenue,
      totalOrders:   stats.totalOrders,
      avgOrderValue: stats.avgOrderValue,
      topProduct:    stats.topProduct,
      recentOrders:  stats.recentOrders
    });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Unable to fetch sales data.' });
  }
});

// Admin Dashboard stats
app.get('/admin', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    
    res.render('admin/dashboard', { 
      title: 'Dashboard Overview',
      productCount,
      categoryCount,
      orderCount,
      userCount
    });
  } catch (err) {
    res.status(500).send('Error loading dashboard');
  }
});

// Quick fix for old admin product routes to work inside the new layout
app.get('/admin/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 }).lean();
    // Re-use admin/dashboard view name from old implementation, but we probably want a products list
    // Actually, in the old server.js, /admin/products rendered 'admin/dashboard' which was just the products list.
    res.render('admin/products', { products, title: 'Manage Products' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
});

app.get('/admin/products/new', async (req, res) => {
  const categoriesList = await Category.find();
  res.render('admin/new', { categories: categoriesList, errors: [], formData: {}, title: 'New Product' });
});

app.post('/admin/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, rating, stock, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    await Product.create({ name, price, category, rating, stock, description, image });
    req.flash('success', 'Product created');
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', 'Error creating product');
    res.redirect('/admin/products/new');
  }
});

app.get('/admin/products/:id/edit', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    const categoriesList = await Category.find();
    res.render('admin/edit', { product, categories: categoriesList, errors: [], title: 'Edit Product' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

app.post('/admin/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, rating, stock, description } = req.body;
    const update = { name, price, category, rating, stock, description };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    await Product.findByIdAndUpdate(req.params.id, update);
    req.flash('success', 'Product updated');
    res.redirect('/admin/products');
  } catch (err) {
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
});

app.post('/admin/products/:id/delete', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  req.flash('success', 'Product deleted');
  res.redirect('/admin/products');
});

// ─── Server Start ───────────────────────────────────────────────
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 SAMSUNG running at http://localhost:${PORT}`);
      console.log(`📊 Sales Dashboard  → http://localhost:${PORT}/sales`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();