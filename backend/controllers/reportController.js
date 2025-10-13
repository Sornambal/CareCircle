const Event = require('../models/Event');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { jsPDF } = require('jspdf');

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

// @desc    Generate PDF report
// @route   GET /api/reports/generate-pdf
// @access  Private
const generatePDFReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get user information
    const user = await User.findById(req.user._id);

    // Get medication adherence data
    const takenEvents = await Event.find({
      user: req.user._id,
      type: 'medicine_taken',
      timestamp: { $gte: start, $lte: end },
    });

    const medicines = await Medicine.find({ user: req.user._id });

    // Calculate adherence data
    const adherenceData = [];
    const chartData = [];

    medicines.forEach(medicine => {
      const medicineTakenEvents = takenEvents.filter(
        event => event.metadata.medicineId?.toString() === medicine._id.toString()
      );

      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const totalDoses = medicine.times.length * daysDiff;
      const takenDoses = medicineTakenEvents.length;
      const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

      adherenceData.push({
        name: medicine.name,
        dosage: medicine.dosage,
        scheduledTimes: medicine.times.join(', '),
        totalDoses,
        takenDoses,
        adherenceRate: Math.round(adherenceRate * 100) / 100,
      });

      chartData.push({
        medicine: medicine.name,
        adherence: Math.round(adherenceRate * 100) / 100,
      });
    });

    const overallAdherence = adherenceData.length > 0
      ? adherenceData.reduce((sum, med) => sum + med.adherenceRate, 0) / adherenceData.length
      : 0;

    // Create PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('CareCircle - Medication Report', 20, 30);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Patient: ${user.name}`, 20, 45);
    doc.text(`Report Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 20, 55);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);

    // Summary Statistics
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary Statistics', 20, 85);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Overall Adherence: ${Math.round(overallAdherence)}%`, 20, 100);
    doc.text(`Total Medicines: ${medicines.length}`, 20, 110);
    doc.text(`Total Doses Taken: ${takenEvents.length}`, 20, 120);

    // Create a simple text-based chart representation
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Medication Adherence Chart', 20, 140);

    // Draw a simple bar chart manually
    const chartStartY = 150;
    const chartHeight = 80;
    const barWidth = 30;
    const maxBarHeight = 70;

    chartData.forEach((item, index) => {
      const x = 20 + (index * (barWidth + 10));
      const barHeight = (item.adherence / 100) * maxBarHeight;

      // Draw bar
      doc.setFillColor(76, 175, 80);
      doc.rect(x, chartStartY + maxBarHeight - barHeight, barWidth, barHeight, 'F');

      // Draw value on top of bar
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`${item.adherence}%`, x + barWidth/2 - 5, chartStartY + maxBarHeight - barHeight + 8);

      // Draw medicine name below bar
      doc.setTextColor(0, 0, 0);
      const medicineName = item.medicine.length > 8 ? item.medicine.substring(0, 8) + '...' : item.medicine;
      doc.text(medicineName, x + barWidth/2 - 10, chartStartY + maxBarHeight + 15);
    });

    // Add Y-axis labels
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('0%', 5, chartStartY + maxBarHeight + 3);
    doc.text('50%', 5, chartStartY + maxBarHeight/2 + 3);
    doc.text('100%', 5, chartStartY + 3);

    // Medicine Details
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Medicine Details', 20, 245);

    let yPosition = 260;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    adherenceData.forEach((med, index) => {
      if (yPosition > 270) { // Check if we need a new page
        doc.addPage();
        yPosition = 30;
      }

      doc.text(`${index + 1}. ${med.name}`, 20, yPosition);
      doc.text(`   Dosage: ${med.dosage}`, 20, yPosition + 10);
      doc.text(`   Scheduled Times: ${med.scheduledTimes}`, 20, yPosition + 20);
      doc.text(`   Total Doses: ${med.totalDoses}`, 20, yPosition + 30);
      doc.text(`   Taken Doses: ${med.takenDoses}`, 20, yPosition + 40);
      doc.text(`   Adherence Rate: ${med.adherenceRate}%`, 20, yPosition + 50);

      yPosition += 70; // Space for next medicine
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by CareCircle - AI Elderly Care Assistant', 20, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    // Send PDF
    try {
      const pdfDataUri = doc.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      const pdfBuffer = Buffer.from(base64Data, 'base64');

      const userName = user.name || user.elderlyName || 'user';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=carecircle-report-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF output error:', pdfError);
      res.status(500).json({ message: 'Error generating PDF output', error: pdfError.message });
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
};

module.exports = {
  getMedicationAdherence,
  getActivitySummary,
  getRecoveryProgress,
  generatePDFReport,
};
