const { validationResult } = require("express-validator")
const Order = require("../models/Order")
const Payment = require("../models/Payment")
const logger = require("../utils/logger")

// Process payment
exports.processPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { orderId, paymentMethod, paymentDetails } = req.body

    // Find order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user has permission to process payment
    if (req.user.id !== order.customerId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to process payment for this order" })
    }

    // Check if payment already exists
    let payment = await Payment.findOne({ orderId })
    if (payment && payment.status === "completed") {
      return res.status(400).json({ message: "Payment already processed for this order" })
    }

    // If payment exists but not completed, update it
    if (payment) {
      payment.method = paymentMethod
      payment.paymentDetails = paymentDetails
      payment.updatedAt = Date.now()
    } else {
      // Create new payment
      payment = new Payment({
        orderId,
        customerId: order.customerId,
        amount: order.total,
        method: paymentMethod,
        paymentDetails,
      })
    }

    // In a real app, we would process the payment through a payment gateway
    // For now, we'll simulate a successful payment
    payment.status = "completed"
    payment.transactionId = `txn_${Date.now()}`
    payment.paymentGateway = "stripe" // or any other gateway

    await payment.save()

    // Update order payment status
    order.paymentStatus = "completed"
    order.paymentMethod = paymentMethod
    order.updatedAt = Date.now()
    await order.save()

    res.status(200).json({
      message: "Payment processed successfully",
      payment,
    })
  } catch (error) {
    logger.error(`Process payment error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params

    const payment = await Payment.findById(id)
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Check if user has permission to view this payment
    if (req.user.role !== "admin" && req.user.id !== payment.customerId.toString()) {
      return res.status(403).json({ message: "Not authorized to view this payment" })
    }

    res.status(200).json({ payment })
  } catch (error) {
    logger.error(`Get payment error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get payments by customer ID
exports.getPaymentsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.user.id
    const { page = 1, limit = 10 } = req.query

    // Check if user has permission to view these payments
    if (req.user.role !== "admin" && req.user.id !== customerId) {
      return res.status(403).json({ message: "Not authorized to view these payments" })
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get payments
    const payments = await Payment.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(Number.parseInt(limit))

    // Get total count
    const total = await Payment.countDocuments({ customerId })

    res.status(200).json({
      payments,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Get customer payments error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Process refund
exports.processRefund = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { paymentId } = req.params
    const { amount, reason } = req.body

    // Find payment
    const payment = await Payment.findById(paymentId)
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Check if payment can be refunded
    if (payment.status !== "completed") {
      return res.status(400).json({ message: "Only completed payments can be refunded" })
    }

    // Check if user has permission to process refund
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to process refunds" })
    }

    // Validate refund amount
    const refundAmount = Number.parseFloat(amount)
    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
      return res.status(400).json({ message: "Invalid refund amount" })
    }

    // In a real app, we would process the refund through a payment gateway
    // For now, we'll simulate a successful refund
    payment.status = "refunded"
    payment.refundAmount = refundAmount
    payment.refundReason = reason
    payment.refundTransactionId = `ref_${Date.now()}`
    payment.updatedAt = Date.now()

    await payment.save()

    // Update order payment status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = "refunded"
      order.refundAmount = refundAmount
      order.refundReason = reason
      order.updatedAt = Date.now()
      await order.save()
    }

    res.status(200).json({
      message: "Refund processed successfully",
      payment,
    })
  } catch (error) {
    logger.error(`Process refund error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    // Get total payments
    const totalPayments = await Payment.countDocuments()

    // Get payments by status
    const paymentsByStatus = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ])

    // Get payments by method
    const paymentsByMethod = await Payment.aggregate([
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ])

    // Get payments by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const paymentsByDay = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      totalPayments,
      paymentsByStatus: paymentsByStatus.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, total: curr.total };
        return acc;
      }, {}),
      paymentsByMethod: paymentsByMethod.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, total: curr.total };
        return acc;
      }, {}),
      paymentsByDay,
    });
  } catch (error) {
    logger.error(`Get payment statistics error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
