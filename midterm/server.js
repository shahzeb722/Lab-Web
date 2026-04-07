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

// Start the server
app.listen(PORT, () => {
  console.log(`SAMSUNG running at http://localhost:${PORT}`);
});