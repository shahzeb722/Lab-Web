const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Electronics', 'Fashion', 'Home']
    },
    rating: { type: Number, required: true, min: 0, max: 5 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
