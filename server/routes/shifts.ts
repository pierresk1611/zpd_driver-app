import express from "express";

const router = express.Router();

// Mock data storage (replace with WordPress DB integration)
let shifts: any[] = [];
let availability: any[] = [];
let breaks: any[] = [];
let weeklySchedule: any[] = [];

// Start Shift
router.post("/start", async (req, res) => {
  try {
    const { driver_id, driver_name, location_start } = req.body;

    // Check if driver already has active shift
    const activeShift = shifts.find(
      (shift) => shift.driver_id === driver_id && shift.status === "active",
    );

    if (activeShift) {
      return res.json({
        success: false,
        error: "Driver already has an active shift",
        shift: activeShift,
      });
    }

    const newShift = {
      id: `shift_${Date.now()}`,
      driver_id,
      driver_name,
      shift_start: new Date().toISOString(),
      shift_end: null,
      status: "active",
      break_time_minutes: 0,
      total_orders: 0,
      total_cash_collected: 0,
      notes: "",
      location_start: location_start || "Unknown",
      location_end: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    shifts.push(newShift);

    // TODO: Save to WordPress database
    // INSERT INTO wp_zpoledomu_driver_shifts (driver_id, driver_name, shift_start, status, location_start, created_at)
    // VALUES (driver_id, driver_name, shift_start, 'active', location_start, NOW())

    res.json({
      success: true,
      message: "Shift started successfully",
      shift: newShift,
    });
  } catch (error) {
    console.error("Error starting shift:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start shift",
    });
  }
});

// End Shift
router.post("/end", async (req, res) => {
  try {
    const {
      shift_id,
      driver_id,
      location_end,
      total_orders,
      total_cash_collected,
      notes,
    } = req.body;

    const shiftIndex = shifts.findIndex(
      (shift) => shift.id === shift_id && shift.driver_id === driver_id,
    );

    if (shiftIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Shift not found",
      });
    }

    const updatedShift = {
      ...shifts[shiftIndex],
      shift_end: new Date().toISOString(),
      status: "completed",
      location_end: location_end || "Unknown",
      total_orders: total_orders || 0,
      total_cash_collected: total_cash_collected || 0,
      notes: notes || "",
      updated_at: new Date().toISOString(),
    };

    shifts[shiftIndex] = updatedShift;

    // TODO: Update WordPress database
    // UPDATE wp_zpoledomu_driver_shifts
    // SET shift_end = NOW(), status = 'completed', location_end = location_end,
    //     total_orders = total_orders, total_cash_collected = total_cash_collected,
    //     notes = notes, updated_at = NOW()
    // WHERE id = shift_id

    res.json({
      success: true,
      message: "Shift ended successfully",
      shift: updatedShift,
    });
  } catch (error) {
    console.error("Error ending shift:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end shift",
    });
  }
});

// Get Current Shift
router.get("/current/:driver_id", async (req, res) => {
  try {
    const { driver_id } = req.params;

    const currentShift = shifts.find(
      (shift) => shift.driver_id === driver_id && shift.status === "active",
    );

    // TODO: Query WordPress database
    // SELECT * FROM wp_zpoledomu_driver_shifts
    // WHERE driver_id = driver_id AND status = 'active'
    // ORDER BY shift_start DESC LIMIT 1

    res.json({
      success: true,
      shift: currentShift || null,
    });
  } catch (error) {
    console.error("Error getting current shift:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get current shift",
    });
  }
});

// Get Shift History
router.get("/history/:driver_id", async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const driverShifts = shifts
      .filter((shift) => shift.driver_id === driver_id)
      .sort(
        (a, b) =>
          new Date(b.shift_start).getTime() - new Date(a.shift_start).getTime(),
      )
      .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

    // TODO: Query WordPress database with pagination
    // SELECT * FROM wp_zpoledomu_driver_shifts
    // WHERE driver_id = driver_id
    // ORDER BY shift_start DESC
    // LIMIT limit OFFSET ((page - 1) * limit)

    res.json({
      success: true,
      shifts: driverShifts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: shifts.filter((shift) => shift.driver_id === driver_id).length,
      },
    });
  } catch (error) {
    console.error("Error getting shift history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get shift history",
    });
  }
});

// Availability Management
router.post("/availability", async (req, res) => {
  try {
    const {
      driver_id,
      driver_name,
      date,
      is_available,
      start_time,
      end_time,
      availability_type,
      reason,
    } = req.body;

    const newAvailability = {
      id: `availability_${Date.now()}`,
      driver_id,
      driver_name,
      date,
      is_available: is_available ?? true,
      start_time: start_time || "08:00:00",
      end_time: end_time || "18:00:00",
      availability_type: availability_type || "available",
      reason: reason || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove existing availability for same date
    availability = availability.filter(
      (avail) => !(avail.driver_id === driver_id && avail.date === date),
    );

    availability.push(newAvailability);

    // TODO: Save to WordPress database
    // INSERT INTO wp_zpoledomu_driver_availability
    // (driver_id, driver_name, date, is_available, start_time, end_time, availability_type, reason, created_at)
    // VALUES (driver_id, driver_name, date, is_available, start_time, end_time, availability_type, reason, NOW())
    // ON DUPLICATE KEY UPDATE
    // is_available = VALUES(is_available), start_time = VALUES(start_time),
    // end_time = VALUES(end_time), availability_type = VALUES(availability_type),
    // reason = VALUES(reason), updated_at = NOW()

    res.json({
      success: true,
      message: "Availability updated successfully",
      availability: newAvailability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update availability",
    });
  }
});

// Get Availability
router.get("/availability/:driver_id", async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { start_date, end_date } = req.query;

    let driverAvailability = availability.filter(
      (avail) => avail.driver_id === driver_id,
    );

    if (start_date && end_date) {
      driverAvailability = driverAvailability.filter(
        (avail) => avail.date >= start_date && avail.date <= end_date,
      );
    }

    // TODO: Query WordPress database
    // SELECT * FROM wp_zpoledomu_driver_availability
    // WHERE driver_id = driver_id
    // AND (start_date IS NULL OR date >= start_date)
    // AND (end_date IS NULL OR date <= end_date)
    // ORDER BY date ASC

    res.json({
      success: true,
      availability: driverAvailability,
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get availability",
    });
  }
});

// Break Management
router.post("/breaks/start", async (req, res) => {
  try {
    const { driver_id, shift_id, break_type, notes } = req.body;

    const newBreak = {
      id: `break_${Date.now()}`,
      driver_id,
      driver_name: "", // Will be filled from driver data
      break_start: new Date().toISOString(),
      break_end: null,
      break_type: break_type || "rest",
      duration_minutes: 0,
      shift_id: shift_id || null,
      notes: notes || "",
      created_at: new Date().toISOString(),
    };

    breaks.push(newBreak);

    // TODO: Save to WordPress database
    // INSERT INTO wp_zpoledomu_driver_breaks
    // (driver_id, break_start, break_type, shift_id, notes, created_at)
    // VALUES (driver_id, NOW(), break_type, shift_id, notes, NOW())

    res.json({
      success: true,
      message: "Break started successfully",
      break: newBreak,
    });
  } catch (error) {
    console.error("Error starting break:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start break",
    });
  }
});

router.post("/breaks/end", async (req, res) => {
  try {
    const { break_id, driver_id } = req.body;

    const breakIndex = breaks.findIndex(
      (brk) => brk.id === break_id && brk.driver_id === driver_id,
    );

    if (breakIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Break not found",
      });
    }

    const breakEnd = new Date().toISOString();
    const durationMs =
      new Date(breakEnd).getTime() -
      new Date(breaks[breakIndex].break_start).getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    breaks[breakIndex] = {
      ...breaks[breakIndex],
      break_end: breakEnd,
      duration_minutes: durationMinutes,
    };

    // TODO: Update WordPress database
    // UPDATE wp_zpoledomu_driver_breaks
    // SET break_end = NOW(), duration_minutes = duration_minutes
    // WHERE id = break_id

    res.json({
      success: true,
      message: "Break ended successfully",
      break: breaks[breakIndex],
    });
  } catch (error) {
    console.error("Error ending break:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end break",
    });
  }
});

export default router;
