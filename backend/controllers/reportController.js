const Event = require('../models/Event');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// @desc    Get medication adherence report
// @route   GET /api/reports/medication-adherence
// @access  Private
const getMedicationAdherence = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all medicine taken events in the period
    const takenEvents = await Event.find({
      user: req.user._id,
      type: 'medicine_taken',
      timestamp: { $gte: startDate },
    });

    // Get all medicines for the user
    const medicines = await Medicine.find({ user: req.user._id });

    // Calculate adherence per medicine
    const adherenceData = medicines.map(medicine => {
      const medicineTakenEvents = takenEvents.filter(
        event => event.metadata.medicineId?.toString() === medicine._id.toString()
      );

      const totalDoses = medicine.times.length * days; // Approximate total doses
      const takenDoses = medicineTakenEvents.length;
      const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

      return {
        medicineId: medicine._id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        totalDoses,
        takenDoses,
        adherenceRate: Math.round(adherenceRate * 100) / 100,
      };
    });

    const overallAdherence = adherenceData.length > 0
      ? adherenceData.reduce((sum, med) => sum + med.adherenceRate, 0) / adherenceData.length
      : 0;

    res.json({
      period: `${days} days`,
      overallAdherence: Math.round(overallAdherence * 100) / 100,
      medicines: adherenceData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get activity summary report
// @route   GET /api/reports/activity-summary
// @access  Private
const getActivitySummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await Event.find({
      user: req.user._id,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    // Group events by type
    const summary = {
      period: `${days} days`,
      totalEvents: events.length,
      byType: {},
      recentEvents: events.slice(0, 10), // Last 10 events
    };

    events.forEach(event => {
      if (!summary.byType[event.type]) {
        summary.byType[event.type] = 0;
      }
      summary.byType[event.type]++;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recovery progress report
// @route   GET /api/reports/recovery-progress
// @access  Private
const getRecoveryProgress = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get medication adherence
    const adherenceReport = await getMedicationAdherenceData(req.user._id, days);

    // Get SOS events (indicating emergencies)
    const sosEvents = await Event.find({
      user: req.user._id,
      type: 'sos_triggered',
      timestamp: { $gte: startDate },
    });

    // Get login frequency (engagement indicator)
    const loginEvents = await Event.find({
      user: req.user._id,
      type: 'login',
      timestamp: { $gte: startDate },
    });

    const progress = {
      period: `${days} days`,
      medicationAdherence: adherenceReport.overallAdherence,
      emergencyIncidents: sosEvents.length,
      loginFrequency: loginEvents.length,
      status: determineRecoveryStatus(adherenceReport.overallAdherence, sosEvents.length, loginEvents.length),
      recommendations: generateRecommendations(adherenceReport.overallAdherence, sosEvents.length),
    };

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get medication adherence data
const getMedicationAdherenceData = async (userId, days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const takenEvents = await Event.find({
    user: userId,
    type: 'medicine_taken',
    timestamp: { $gte: startDate },
  });

  const medicines = await Medicine.find({ user: userId });

  const adherenceData = medicines.map(medicine => {
    const medicineTakenEvents = takenEvents.filter(
      event => event.metadata.medicineId?.toString() === medicine._id.toString()
    );

    const totalDoses = medicine.times.length * days;
    const takenDoses = medicineTakenEvents.length;
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    return {
      medicineId: medicine._id,
      medicineName: medicine.name,
      totalDoses,
      takenDoses,
      adherenceRate: Math.round(adherenceRate * 100) / 100,
    };
  });

  const overallAdherence = adherenceData.length > 0
    ? adherenceData.reduce((sum, med) => sum + med.adherenceRate, 0) / adherenceData.length
    : 0;

  return {
    overallAdherence: Math.round(overallAdherence * 100) / 100,
    medicines: adherenceData,
  };
};

// Helper function to determine recovery status
const determineRecoveryStatus = (adherence, emergencies, logins) => {
  if (adherence >= 90 && emergencies === 0) return 'Excellent';
  if (adherence >= 75 && emergencies <= 1) return 'Good';
  if (adherence >= 60 && emergencies <= 2) return 'Fair';
  return 'Needs Attention';
};

// Helper function to generate recommendations
const generateRecommendations = (adherence, emergencies) => {
  const recommendations = [];

  if (adherence < 80) {
    recommendations.push('Consider setting medication reminders');
    recommendations.push('Review medication schedule with healthcare provider');
  }

  if (emergencies > 0) {
    recommendations.push('Emergency contacts have been alerted - please check in regularly');
    recommendations.push('Consider additional safety measures');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current medication regimen');
    recommendations.push('Regular check-ins are recommended');
  }

  return recommendations;
};

module.exports = {
  getMedicationAdherence,
  getActivitySummary,
  getRecoveryProgress,
};
