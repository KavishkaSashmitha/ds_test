const { validationResult } = require("express-validator")
const Earnings = require("../models/Earnings")
const DeliveryPersonnel = require("../models/DeliveryPersonnel")
const logger = require("../utils/logger")

// Get earnings for a delivery personnel
exports.getEarnings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const deliveryPersonnelId = req.params.id || req.user.id

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== deliveryPersonnelId) {
      return res.status(403).json({ message: "Not authorized to access these earnings" })
    }

    // Verify the delivery personnel exists
    const personnel = await DeliveryPersonnel.findOne({ userId: deliveryPersonnelId })
    if (!personnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    // Default to current month if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getFullYear(), end.getMonth(), 1)

    // Get earnings records
    const earningsRecords = await Earnings.find({
      deliveryPersonnelId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 })

    // Calculate totals
    const totals = {
      totalAmount: 0,
      totalDeliveries: 0,
      totalDistance: 0,
    }

    earningsRecords.forEach((record) => {
      totals.totalAmount += record.totalAmount
      totals.totalDeliveries += record.totalDeliveries
      totals.totalDistance += record.totalDistance
    })

    res.status(200).json({
      earnings: earningsRecords,
      totals,
      period: {
        start,
        end,
      },
    })
  } catch (error) {
    logger.error(`Get earnings error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get earnings summary by day, week, or month
exports.getEarningsSummary = async (req, res) => {
  try {
    const { period = "day", startDate, endDate } = req.query
    const deliveryPersonnelId = req.params.id || req.user.id

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== deliveryPersonnelId) {
      return res.status(403).json({ message: "Not authorized to access these earnings" })
    }

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000)

    // Define group by format based on period
    let groupBy
    let dateFormat

    switch (period) {
      case "week":
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        }
        dateFormat = "%Y-W%U" // Year-Week format
        break
      case "month":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        }
        dateFormat = "%Y-%m" // Year-Month format
        break
      default: // day
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        }
        dateFormat = "%Y-%m-%d" // Year-Month-Day format
    }

    // Run aggregation
    const summary = await Earnings.aggregate([
      {
        $match: {
          deliveryPersonnelId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalAmount: { $sum: "$totalAmount" },
          totalDeliveries: { $sum: "$totalDeliveries" },
          totalDistance: { $sum: "$totalDistance" },
          date: { $min: "$date" }, // Use the earliest date in the group
        },
      },
      {
        $project: {
          _id: 0,
          period: { $dateToString: { format: dateFormat, date: "$date" } },
          totalAmount: 1,
          totalDeliveries: 1,
          totalDistance: 1,
          date: 1,
        },
      },
      { $sort: { date: 1 } },
    ])

    // Calculate overall totals
    const totals = {
      totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
      totalDeliveries: summary.reduce((sum, item) => sum + item.totalDeliveries, 0),
      totalDistance: summary.reduce((sum, item) => sum + item.totalDistance, 0),
    }

    res.status(200).json({
      summary,
      totals,
      period: {
        type: period,
        start,
        end,
      },
    })
  } catch (error) {
    logger.error(`Get earnings summary error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Mark earnings as paid
exports.markEarningsAsPaid = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { earningsIds } = req.body

    // Only admin can mark earnings as paid
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to perform this action" })
    }

    // Update earnings records
    const result = await Earnings.updateMany(
      { _id: { $in: earningsIds }, isPaid: false },
      { isPaid: true, paidAt: new Date(), updatedAt: new Date() },
    )

    res.status(200).json({
      message: "Earnings marked as paid successfully",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    logger.error(`Mark earnings as paid error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get unpaid earnings
exports.getUnpaidEarnings = async (req, res) => {
  try {
    // Only admin can view all unpaid earnings
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    const { startDate, endDate } = req.query

    // Default to all time if no dates provided
    const query = { isPaid: false }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Get unpaid earnings grouped by delivery personnel
    const unpaidEarnings = await Earnings.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$deliveryPersonnelId",
          totalAmount: { $sum: "$totalAmount" },
          totalDeliveries: { $sum: "$totalDeliveries" },
          totalDistance: { $sum: "$totalDistance" },
          earningsIds: { $push: "$_id" },
          dateRange: {
            $push: "$date",
          },
        },
      },
      {
        $project: {
          _id: 0,
          deliveryPersonnelId: "$_id",
          totalAmount: 1,
          totalDeliveries: 1,
          totalDistance: 1,
          earningsIds: 1,
          startDate: { $min: "$dateRange" },
          endDate: { $max: "$dateRange" },
        },
      },
    ])

    // Get delivery personnel details
    const personnelIds = unpaidEarnings.map((item) => item.deliveryPersonnelId)
    const personnelDetails = await DeliveryPersonnel.find(
      { userId: { $in: personnelIds } },
      { userId: 1, name: 1, email: 1, phone: 1 },
    )

    // Merge personnel details with earnings
    const result = unpaidEarnings.map((earning) => {
      const personnel = personnelDetails.find((p) => p.userId === earning.deliveryPersonnelId)
      return {
        ...earning,
        personnelDetails: personnel
          ? {
              name: personnel.name,
              email: personnel.email,
              phone: personnel.phone,
            }
          : null,
      }
    })

    // Calculate total unpaid amount
    const totalUnpaidAmount = result.reduce((sum, item) => sum + item.totalAmount, 0)

    res.status(200).json({
      unpaidEarnings: result,
      totalUnpaidAmount,
      count: result.length,
    })
  } catch (error) {
    logger.error(`Get unpaid earnings error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = exports
