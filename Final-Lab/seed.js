const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('config');

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

const MONGO_URI = config.has('mongoURI') ? config.get('mongoURI') : 'mongodb://127.0.0.1:27017/labweb';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing collections
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();

    console.log('🗑️  Cleared existing collections');

    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await User.create({
      name: 'Admin Account',
      email: 'admin@shop.com',
      password: hashedPassword,
      role: 'admin'
    });

    const normalUser = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: hashedPassword,
      role: 'user'
    });

    console.log('👤 Created Admin & Normal users');

    // Create Categories
    const categoriesData = [
      { name: 'Electronics', description: 'Gadgets and devices' },
      { name: 'Fashion', description: 'Clothing and apparel' },
      { name: 'Home', description: 'Home appliances and decor' }
    ];
    
    const categories = [];
    for (const data of categoriesData) {
      categories.push(await Category.create(data));
    }

    console.log('📂 Created Categories');

    // Create Products
    const productsData = [
      {
        name: 'Samsung Galaxy S24 Ultra',
        price: 1299.99,
        category: categories[0]._id, // Electronics
        rating: 4.8,
        stock: 50,
        image: 'https://images.samsung.com/us/smartphones/galaxy-s24/buy/01-Carousel-GalaxyS24Ultra-475x475.jpg',
        description: 'Experience the ultimate smartphone with the Galaxy S24 Ultra. Features a stunning 6.8" AMOLED display, powerful Snapdragon processor, and exceptional camera system with advanced AI capabilities.'
      },
      {
        name: 'Samsung Galaxy Z Fold 6',
        price: 1899.99,
        category: categories[0]._id,
        rating: 4.7,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
        description: 'Revolutionary foldable technology with a 7.6" main display and 6.3" cover display. Ultra-thin design at just 5.6mm.'
      },
      {
        name: 'Samsung Galaxy Z Flip 6',
        price: 999.99,
        category: categories[0]._id,
        rating: 4.6,
        stock: 45,
        image: 'https://images.samsung.com/us/smartphones/galaxy-z-flip/buy/galaxy-zflip-475x475.jpg',
        description: 'Compact and stylish foldable phone with a 6.7" main display.'
      },
      {
        name: 'Bespoke 4-Door Flex Refrigerator',
        price: 3499.00,
        category: categories[2]._id, // Home
        rating: 4.9,
        stock: 10,
        image: 'https://images.samsung.com/is/image/samsung/p6pim/us/rf29a9671sr-aa/gallery/us-bespoke-4-door-flex-rf29a9671sr-rf29a9671sr-aa-448202581?$2052_1641_PNG$',
        description: 'Customizable door colors with a massive internal capacity and dual ice maker.'
      }
    ];

    const products = [];
    for (const p of productsData) {
      products.push(await Product.create(p));
    }

    console.log('📱 Created Products');

    // Create an Order
    const order = await Order.create({
      user: normalUser._id,
      items: [
        {
          product: products[0]._id,
          quantity: 2,
          price: products[0].price
        },
        {
          product: products[2]._id,
          quantity: 1,
          price: products[2].price
        }
      ],
      total: (products[0].price * 2) + products[2].price,
      shippingInfo: {
        address: '123 Tech Lane',
        city: 'Silicon Valley',
        zip: '94000'
      },
      status: 'delivered'
    });

    console.log('📦 Created Sample Order');

    console.log('\n✅ Seeding complete!');
    console.log('Admin Email: admin@shop.com');
    console.log('Admin Password: admin123');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();
