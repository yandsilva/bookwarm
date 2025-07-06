import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const bookRoute = express.Router();

bookRoute.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, image, rating } = req.body;

    if (!image || !title || !rating || !caption) {
      return res.status(400).json({ message: "Image and rating are required" });
    }

    //upload the image ti cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    //save to the database
    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
bookRoute.get("/", async (req, res) => {
  // example call from react native - frontend
  // const response = await fetch("http://localhost:3000/api/books?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage"); //descending order

    const totalBooks = await Book.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks: totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error i get al books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

bookRoute.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("Error in get user books", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

bookRoute.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // check if user is the creator of the book
    if (book.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this book" });
    }

    // https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // delete image from cloudinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image from Cloudinary", deleteError);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export { bookRoute };
