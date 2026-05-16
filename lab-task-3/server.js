const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const Product = require('./models/Product');
const User = require('./models/User');
const sampleProducts = require('./data/sampleProducts');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/labweb';
const SESSION_SECRET = process.env.SESSION_SECRET || 'labweb_secret';

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse form inputs
app.use(express.urlencoded({ extended: false }));

// Serve CSS, JS, images from /public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  next();
});

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

const seedProductsIfEmpty = async () => {
  const existingCount = await Product.countDocuments();
  if (existingCount === 0) {
    await Product.insertMany(sampleProducts);
  }
};

const seedAdminIfMissing = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@samsung.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
  }
};

const categories = ['Electronics', 'Fashion', 'Home'];

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeProductPayload = (body, imagePath) => ({
  name: (body.name || '').trim(),
  price: parseNumber(body.price),
  category: (body.category || '').trim(),
  rating: parseNumber(body.rating),
  stock: parseInteger(body.stock),
  description: (body.description || '').trim(),
  image: imagePath || ''
});

const validateProductPayload = (payload, imageRequired) => {
  const errors = [];

  if (!payload.name) {
    errors.push('Product name is required.');
  }
  if (!payload.category || !categories.includes(payload.category)) {
    errors.push('Category is required.');
  }
  if (payload.price === null) {
    errors.push('Price is required.');
  }
  if (payload.rating === null) {
    errors.push('Rating is required.');
  }
  if (payload.stock === null) {
    errors.push('Stock is required.');
  }
  if (imageRequired && !payload.image) {
    errors.push('Product image is required.');
  }

  return errors;
};

const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admins only.');
    return res.redirect('/');
  }
  next();
};

// Route: Homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Route: Dynamic Products Catalog
app.get('/products', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 8;
  const search = (req.query.search || '').trim();
  const category = (req.query.category || '').trim();
  const minPriceValue = Number.parseFloat(req.query.minPrice);
  const maxPriceValue = Number.parseFloat(req.query.maxPrice);
  const minPrice = Number.isFinite(minPriceValue) ? minPriceValue : null;
  const maxPrice = Number.isFinite(maxPriceValue) ? maxPriceValue : null;
  const sort = (req.query.sort || 'name_asc').trim();

  const filters = {
    search,
    category,
    minPrice: minPrice === null ? '' : minPrice,
    maxPrice: maxPrice === null ? '' : maxPrice,
    sort
  };

  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (category) {
    query.category = category;
  }
  if (minPrice !== null || maxPrice !== null) {
    query.price = {};
    if (minPrice !== null) {
      query.price.$gte = minPrice;
    }
    if (maxPrice !== null) {
      query.price.$lte = maxPrice;
    }
  }

  const sortOptions = {
    name_asc: { name: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { rating: -1 }
  };
  const sortBy = sortOptions[sort] || sortOptions.name_asc;

  try {
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.max(Math.ceil(totalProducts / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const products = await Product.find(query)
      .sort(sortBy)
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    const baseQueryParams = new URLSearchParams();
    if (search) {
      baseQueryParams.set('search', search);
    }
    if (category) {
      baseQueryParams.set('category', category);
    }
    if (minPrice !== null) {
      baseQueryParams.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== null) {
      baseQueryParams.set('maxPrice', maxPrice.toString());
    }
    if (sort) {
      baseQueryParams.set('sort', sort);
    }

    res.render('products', {
      products,
      pagination: { currentPage, totalPages },
      filters,
      baseQueryString: baseQueryParams.toString(),
      totalProducts,
      errorMessage: ''
    });
  } catch (error) {
    console.error('Failed to load products:', error);
    res.status(500).render('products', {
      products: [],
      pagination: { currentPage: 1, totalPages: 1 },
      filters,
      baseQueryString: '',
      totalProducts: 0,
      errorMessage: 'Unable to load products right now. Please try again.'
    });
  }
});

// Authentication Routes
app.get('/register', (req, res) => {
  res.render('auth/register');
});

app.post('/register', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || !password) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/register');
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect('/register');
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email is already registered.');
      return res.redirect('/register');
    }

    const user = await User.create({ name, email, password });
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.flash('success', `Welcome, ${user.name}!`);
    res.redirect('/profile');
  } catch (error) {
    console.error('Failed to register:', error);
    req.flash('error', 'Unable to create account. Please try again.');
    res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/profile');
  } catch (error) {
    console.error('Failed to login:', error);
    req.flash('error', 'Unable to login. Please try again.');
    res.redirect('/login');
  }
});

app.post('/logout', (req, res) => {
  req.session.user = null;
  req.flash('success', 'You have successfully logged out.');
  res.redirect('/');
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile');
});

app.get('/checkout', isLoggedIn, (req, res) => {
  res.render('checkout');
});

app.use('/admin', isAdmin);

// Admin Dashboard
app.get('/admin', (req, res) => {
  res.redirect('/admin/products');
});

app.get('/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.render('admin/dashboard', { products });
  } catch (error) {
    console.error('Failed to load admin products:', error);
    res.status(500).send('Unable to load admin dashboard.');
  }
});

app.get('/admin/products/new', (req, res) => {
  res.render('admin/new', {
    categories,
    errors: [],
    formData: {}
  });
});

app.post('/admin/products', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
  const payload = normalizeProductPayload(req.body, imagePath);
  const errors = validateProductPayload(payload, true);

  if (errors.length) {
    return res.status(400).render('admin/new', {
      categories,
      errors,
      formData: req.body
    });
  }

  try {
    await Product.create(payload);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).render('admin/new', {
      categories,
      errors: ['Unable to save product. Please try again.'],
      formData: req.body
    });
  }
});

app.get('/admin/products/:id/edit', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    res.render('admin/edit', {
      categories,
      errors: [],
      product
    });
  } catch (error) {
    console.error('Failed to load product:', error);
    res.status(500).send('Unable to load product.');
  }
});

app.post('/admin/products/:id', upload.single('image'), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).send('Product not found.');
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : existing.image;
    const payload = normalizeProductPayload(req.body, imagePath);
    const errors = validateProductPayload(payload, false);

    if (errors.length) {
      return res.status(400).render('admin/edit', {
        categories,
        errors,
        product: { ...existing.toObject(), ...req.body, image: existing.image }
      });
    }

    Object.assign(existing, payload);
    await existing.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).send('Unable to update product.');
  }
});

app.post('/admin/products/:id/delete', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).send('Unable to delete product.');
  }
});

// Route: Featured Samsung Products API
app.get('/api/featured-products', (req, res) => {
  const samsungProducts = [
    {
      id: 1,
      title: 'Samsung Galaxy S24 Ultra',
      price: 1299.99,
      image: 'https://images.samsung.com/us/smartphones/galaxy-s24/buy/01-Carousel-GalaxyS24Ultra-475x475.jpg',
      description: 'Experience the ultimate smartphone with the Galaxy S24 Ultra. Features a stunning 6.8" AMOLED display, powerful Snapdragon processor, and exceptional camera system with advanced AI capabilities. Perfect for professionals and content creators.',
      rating: {
        rate: 4.8,
        count: 2345
      }
    },
    {
      id: 2,
      title: 'Samsung Galaxy Z Fold 6',
      price: 1899.99,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
      description: 'Revolutionary foldable technology with a 7.6" main display and 6.3" cover display. Ultra-thin design at just 5.6mm. Perfect for multitasking with its unique form factor and flagship processor.',
      rating: {
        rate: 4.7,
        count: 1856
      }
    },
    {
      id: 3,
      title: 'Samsung Galaxy Z Flip 6',
      price: 999.99,
      image: 'https://images.samsung.com/us/smartphones/galaxy-z-flip/buy/galaxy-zflip-475x475.jpg',
      description: 'Compact and stylish foldable phone with a 6.7" main display. The new 3.4" cover display is perfect for quick tasks. Innovative design meets premium performance.',
      rating: {
        rate: 4.6,
        count: 1523
      }
    },
    {
      id: 4,
      title: 'Samsung Galaxy Tab S10 Pro',
      price: 1199.99,
      image: 'https://images.samsung.com/us/tablets/galaxy-tab-s/buy/tab-s-475x475.jpg',
      description: 'Powerful 14.6" AMOLED tablet with S Pen included. Perfect for creators and professionals. Features top-tier processor and stunning 120Hz display for seamless productivity.',
      rating: {
        rate: 4.9,
        count: 892
      }
    }
  ];

  // Send the products with a slight delay to simulate real API call
  setTimeout(() => {
    res.json(samsungProducts);
  }, 300);
});

// Route: Individual product details
app.get('/api/featured-products/:id', (req, res) => {
  const samsungProducts = {
    '1': {
      id: 1,
      title: 'Samsung Galaxy S24 Ultra',
      price: 1299.99,
      image: 'https://images.samsung.com/us/smartphones/galaxy-s24/buy/01-Carousel-GalaxyS24Ultra-475x475.jpg',
      description: 'Experience the ultimate smartphone with the Galaxy S24 Ultra. Features a stunning 6.8" AMOLED display, powerful Snapdragon processor, and exceptional camera system with advanced AI capabilities. This device is designed for professionals and content creators who demand the best. It includes a titanium frame, Gorilla Glass Armor protection, and 50MP main camera with advanced zoom capabilities. Battery lasts all day with 65W fast charging.',
      rating: {
        rate: 4.8,
        count: 2345
      }
    },
    '2': {
      id: 2,
      title: 'Samsung Galaxy Z Fold 6',
      price: 1899.99,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
      description: 'Revolutionary foldable technology with a 7.6" main display and 6.3" cover display. Ultra-thin design at just 5.6mm when folded. The dynamic display automatically adjusts apps for either screen size. Powered by the latest Snapdragon processor with 12GB RAM. Features improved hinge technology and water resistance rating. The 48MP camera system captures stunning photos in any lighting condition.',
      rating: {
        rate: 4.7,
        count: 1856
      }
    },
    '3': {
      id: 3,
      title: 'Samsung Galaxy Z Flip 6',
      price: 999.99,
      image: 'https://images.samsung.com/us/smartphones/galaxy-z-flip/buy/galaxy-zflip-475x475.jpg',
      description: 'Compact and stylish foldable phone with a 6.7" main display. The new 3.4" cover display is perfect for quick tasks without opening the phone. Innovative folding design with improved durability. Features a 50MP main camera and advanced night mode. Lightweight and pocket-friendly at just 187g. Perfect for users who want a unique smartphone experience with premium build quality.',
      rating: {
        rate: 4.6,
        count: 1523
      }
    },
    '4': {
      id: 4,
      title: 'Samsung Galaxy Tab S10 Pro',
      price: 1199.99,
      image: 'https://images.samsung.com/us/tablets/galaxy-tab-s/buy/tab-s-475x475.jpg',
      description: 'Powerful 14.6" AMOLED tablet with S Pen included. Perfect for creators and professionals. Features the latest processor with 12GB RAM for smooth multitasking. The 120Hz display ensures fluid scrolling and gaming. Split-screen multitasking lets you work with multiple apps simultaneously. Includes DeX mode for a desktop-like experience. Long battery life supports a full day of heavy use.',
      rating: {
        rate: 4.9,
        count: 892
      }
    }
  };

  const product = samsungProducts[req.params.id];
  
  if (product) {
    setTimeout(() => {
      res.json(product);
    }, 200);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await seedProductsIfEmpty();
    await seedAdminIfMissing();
    app.listen(PORT, () => {
      console.log(`SAMSUNG running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();