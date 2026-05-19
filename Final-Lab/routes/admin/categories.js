const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');

// List Categories with Pagination and Sorting
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sort || 'name';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.render('admin/categories/index', { 
      title: 'Manage Categories', 
      categories,
      currentPage: page,
      totalPages,
      sortField,
      sortOrder: req.query.order || 'asc'
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// New Category Form
router.get('/new', (req, res) => {
  res.render('admin/categories/new', { title: 'New Category' });
});

// Create Category
router.post('/', async (req, res) => {
  try {
    await Category.create(req.body);
    req.flash('success', 'Category created successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    req.flash('error', 'Error creating category');
    res.redirect('/admin/categories/new');
  }
});

// Edit Category Form
router.get('/edit/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }
    res.render('admin/categories/edit', { title: 'Edit Category', category });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update Category
router.post('/edit/:id', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, req.body);
    req.flash('success', 'Category updated successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    req.flash('error', 'Error updating category');
    res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
});

// Delete Category
router.post('/delete/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Category deleted');
    res.redirect('/admin/categories');
  } catch (err) {
    req.flash('error', 'Error deleting category');
    res.redirect('/admin/categories');
  }
});

module.exports = router;
