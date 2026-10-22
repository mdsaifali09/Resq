
import Contact from "../models/Contact.js";

// @desc   Add emergency contact
// @route  POST /api/contacts
export const addContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    if (!name?.trim() || !phone?.trim() || !relationship?.trim()) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
      user: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Emergency contact added successfully",
      contact,
    });
  } catch (error) {
    console.error("Add contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add emergency contact",
    });
  }
};

// @desc   Get logged-in user's contacts
// @route  GET /api/contacts
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("Get contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency contacts",
    });
  }
};

// @desc   Delete an emergency contact
// @route  DELETE /api/contacts/:id
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete emergency contact",
    });
  }
};



 // @desc   Update an emergency contact
 // @route  PUT /api/contacts/:id
 export const updateContact = async (req, res) => {
   try {
     const { name, phone, relationship } = req.body;

     if (
       !name?.trim() ||
       !phone?.trim() ||
       !relationship?.trim()
     ) {
       return res.status(400).json({
         success: false,
         message: "All fields are required",
       });
     }

     const contact = await Contact.findOneAndUpdate(
       {
         _id: req.params.id,
         user: req.userId,
       },
       {
         name: name.trim(),
         phone: phone.trim(),
         relationship: relationship.trim(),
       },
       {
         new: true,
         runValidators: true,
       }
     );

     if (!contact) {
       return res.status(404).json({
         success: false,
         message: "Contact not found",
       });
     }

     return res.status(200).json({
       success: true,
       message: "Emergency contact updated successfully",
       contact,
     });
   } catch (error) {
     console.error("Update contact error:", error);

     if (error.name === "CastError") {
       return res.status(400).json({
         success: false,
         message: "Invalid contact ID",
       });
     }

     return res.status(500).json({
       success: false,
       message: "Failed to update emergency contact",
     });
   }
 };
