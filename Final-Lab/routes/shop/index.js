const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Category = require('../../models/Category');

// Shop page route with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query).populate('category').skip(skip).limit(limit);

    res.render('shop/index', { 
      title: req.query.search ? `Search Results for "${req.query.search}"` : 'Our Shop',
      products,
      currentPage: page,
      totalPages,
      searchQuery: req.query.search
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Category products route
router.get('/category/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/shop');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ category: category._id });
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find({ category: category._id }).populate('category').skip(skip).limit(limit);

    res.render('shop/index', { 
      title: `Category: ${category.name}`,
      products,
      categoryName: category.name,
      currentPage: page,
      totalPages,
      categorySlug: category.slug,
      searchQuery: ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
