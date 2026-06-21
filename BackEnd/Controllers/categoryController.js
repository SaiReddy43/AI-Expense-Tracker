import Category from '../Models/Category.js'; // Assumes you have a Category model

export const getCategories = async (req, res) => {
    try {
        // FIXED: Using req.user_id to perfectly match your authMiddleware
        const categories = await Category.find({ user_id: req.user_id })
            .sort({ type: 1, name: 1 }); 

        res.json(categories);
    } catch (error) {
        console.error('GetCategories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// export const getCategories = async (req, res) => {
//     try {
//         // This will send the user_id back to Postman so we can see if it's blank
//         return res.json({ 
//             debug_message: "Checking token value below",
//             what_is_user_id: req.user_id 
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };



export const createCategory = async (req, res) => {
    const { name, type, icon, color } = req.body;

    try {
        // Enforces your schema index requirement: UNIQUE(user_id, name, type)
        const newCategory = await Category.create({
            user_id: req.user_id,
            name,
            type,
            icon,
            color
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('CreateCategory error:', error);
        
        // Catches duplicate entry errors matching your unique schema index
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'A category with this name and type already exists for this user.' 
            });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};


export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    try {
        // Finds the document by ID and user, updates it, and returns the modified document
        const updatedCategory = await Category.findOneAndUpdate(
            { _id: id, user_id: req.user_id }, 
            { name, icon, color },          
            { new: true, runValidators: true } 
        );

        // If no document matches the ID and userId combination
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(updatedCategory);
    } catch (error) {
        console.error('UpdateCategory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        // Finds the document by ID and owner, then removes it
        const deletedCategory = await Category.findOneAndDelete({ 
            _id: id, 
            user_id: req.user_id 
        });

        // If no matching category was found to delete
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('DeleteCategory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
