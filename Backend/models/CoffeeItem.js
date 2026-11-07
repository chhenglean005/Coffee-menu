const mongoose = require("mongoose");

const coffeeItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(document, result) {
        delete result.imagePublicId;
        return result;
      },
    },
  },
);

module.exports = mongoose.model("CoffeeItem", coffeeItemSchema);
