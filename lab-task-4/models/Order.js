const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          name: { type: String, trim: true },
          quantity: { type: Number, default: 1, min: 1 },
          price: { type: Number, min: 0 }
        }
      ],
      default: []
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
