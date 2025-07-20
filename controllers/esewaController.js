const crypto = require("crypto");
const { v4 } = require("uuid");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");

exports.createOrder = async (req, res, next) => {
  try {
    const { amount, servings, shippingAddress } = req.body;
    const recipeId = req.params.id; // Changed from roomId to recipeId
    const transactionUuid = v4(); // Create a unique transaction ID

    console.log("The recipe id and total amount is ", recipeId, amount);

    // Create order record
    const order = new Order({
      user: req.user.id,
      items: [{
        recipe: recipeId,
        servings: servings,
        unitPrice: amount / servings,
        totalPrice: amount
      }],
      totalAmount: amount,
      shippingAddress: shippingAddress,
      paymentMethod: 'esewa',
      transactionId: transactionUuid
    });

    await order.save();

    const signature = this.createSignature(
      `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=EPAYTEST`
    );

    const formData = {
      amount: amount,
      failure_url: `http://localhost:5173/failure`,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: "EPAYTEST",
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: `http://localhost:5173/success`,
      tax_amount: "0",
      total_amount: amount,
      transaction_uuid: transactionUuid,
    };

    res.json({
      message: "Recipe Order Created Successfully",
      formData,
      payment_method: "esewa",
      orderId: order._id,
      recipeId: recipeId,
      servings: servings
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: "Error creating order", 
      error: error.message 
    });
  }
};

exports.createOrderFromCart = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const transactionUuid = v4();

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id, isActive: true })
      .populate('items.recipe');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        message: "Cart is empty" 
      });
    }

    // Create order from cart items
    const order = new Order({
      user: req.user.id,
      items: cart.items.map(item => ({
        recipe: item.recipe._id,
        servings: item.servings,
        unitPrice: item.totalPrice / item.servings,
        totalPrice: item.totalPrice
      })),
      totalAmount: cart.totalAmount,
      shippingAddress: shippingAddress,
      paymentMethod: 'esewa',
      transactionId: transactionUuid
    });

    await order.save();

    const signature = this.createSignature(
      `total_amount=${cart.totalAmount},transaction_uuid=${transactionUuid},product_code=EPAYTEST`
    );

    const formData = {
      amount: cart.totalAmount,
      failure_url: `http://localhost:5173/failure`,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: "EPAYTEST",
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: `http://localhost:5173/success`,
      tax_amount: "0",
      total_amount: cart.totalAmount,
      transaction_uuid: transactionUuid,
    };

    res.json({
      message: "Cart Order Created Successfully",
      formData,
      payment_method: "esewa",
      orderId: order._id
    });
  } catch (error) {
    console.error('Error creating cart order:', error);
    res.status(500).json({ 
      message: "Error creating order", 
      error: error.message 
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { data } = req.query;
    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8")
    );
    console.log(decodedData);

    if (decodedData.status !== "COMPLETE") {
      return res.status(400).json({ message: "error" });
    }

    const message = decodedData.signed_field_names
      .split(",")
      .map((field) => `${field}=${decodedData[field] || ""}`)
      .join(",");
    console.log(message);

    const transactionId = decodedData.transaction_uuid;
    console.log("The transaction id is " + transactionId);

    // Update order status
    const order = await Order.findOne({ transactionId });
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
    }

    if (decodedData.status !== "COMPLETE") {
      console.log("The status is not complete");
      return res.redirect(`http://localhost:3000/failure`);
    }

    res.redirect("http://localhost:3000/success");
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ error: err?.message || "No Orders found" });
  }
};

exports.createSignature = (message) => {
  const secret = "8gBm/:&EnhH.1/q";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  const hashInBase64 = hmac.digest("base64");
  return hashInBase64;
};
