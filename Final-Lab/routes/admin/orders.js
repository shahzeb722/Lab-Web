const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

// List all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt');
    res.render('admin/orders/index', { title: 'Manage Orders', orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');
    
    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    res.render('admin/orders/details', { title: `Order Details #${order._id}`, order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update order status
router.post('/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    req.flash('success', 'Order status updated');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating status');
    res.redirect('/admin/orders');
  }
});

module.exports = router;
