const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');

// Product details route
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category');
    if (!product) {
      return res.status(404).render('index', { 
        title: 'Product Not Found',
        description: 'The product you are looking for does not exist.'
      });
    }
    res.render('shop/product', { 
      title: product.name,
      product 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
