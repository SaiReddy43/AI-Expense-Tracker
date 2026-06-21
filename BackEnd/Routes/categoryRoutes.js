import express from 'express';
import { 
    getCategories, 
    createCategory,  // Added this import
    updateCategory, 
    deleteCategory 
} from '../Controllers/categoryController.js'; 
import { protect } from '../MiddleWares/authMiddleware.js'; 

const router = express.Router();

// All category routes require authentication
router.use(protect);

// GET /api/categories - Fetch all categories for the logged-in user
router.get('/', getCategories);

// POST /api/categories - Create a brand new category
router.post('/', createCategory); // Added this route

// PUT /api/categories/:id - Update a specific category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Delete a specific category
router.delete('/:id', deleteCategory);

export default router;
