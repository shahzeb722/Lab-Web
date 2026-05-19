// Sample orders for seeding the database
const sampleOrders = [
  {
    customerName: 'Ali Hassan',
    items: [
      { productName: 'Samsung Galaxy S24 Ultra', price: 1299.99, quantity: 1 },
      { productName: 'Samsung Galaxy Buds', price: 149.99, quantity: 2 }
    ],
    totalAmount: 1599.97,
    status: 'completed'
  },
  {
    customerName: 'Sara Ahmed',
    items: [
      { productName: 'Samsung Galaxy Z Fold 6', price: 1899.99, quantity: 1 }
    ],
    totalAmount: 1899.99,
    status: 'completed'
  },
  {
    customerName: 'Usman Khan',
    items: [
      { productName: 'Samsung Galaxy Tab S10 Pro', price: 1199.99, quantity: 1 },
      { productName: 'Samsung Galaxy S24 Ultra', price: 1299.99, quantity: 1 }
    ],
    totalAmount: 2499.98,
    status: 'completed'
  },
  {
    customerName: 'Ayesha Malik',
    items: [
      { productName: 'Samsung Galaxy Z Flip 6', price: 999.99, quantity: 2 }
    ],
    totalAmount: 1999.98,
    status: 'completed'
  },
  {
    customerName: 'Bilal Raza',
    items: [
      { productName: 'Samsung Galaxy S24 Ultra', price: 1299.99, quantity: 3 }
    ],
    totalAmount: 3899.97,
    status: 'completed'
  },
  {
    customerName: 'Hira Baig',
    items: [
      { productName: 'Samsung Galaxy Buds', price: 149.99, quantity: 4 }
    ],
    totalAmount: 599.96,
    status: 'completed'
  },
  {
    customerName: 'Zain Ul Abidin',
    items: [
      { productName: 'Samsung Galaxy Tab S10 Pro', price: 1199.99, quantity: 2 }
    ],
    totalAmount: 2399.98,
    status: 'completed'
  },
  {
    customerName: 'Mariam Siddiqui',
    items: [
      { productName: 'Samsung Galaxy Z Fold 6', price: 1899.99, quantity: 1 },
      { productName: 'Samsung Galaxy Z Flip 6', price: 999.99, quantity: 1 }
    ],
    totalAmount: 2899.98,
    status: 'completed'
  }
];

module.exports = sampleOrders;
