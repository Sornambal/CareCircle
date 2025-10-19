// Centralized translations for the CareCircle app
const translations = {
  English: {
    // UI translations
    hello: 'Hello',
    friend: 'Friend',
    howFeeling: 'How are you feeling today?',
    great: '😊 Great',
    okay: '😐 Okay',
    needHelp: '😟 Need Help',
    todaysMedications: "Today's Medications",
    noMedications: '🎉 No medications scheduled for today!',
    enjoyDay: 'Take it easy and enjoy your day.',
    takenIt: '✅ I have taken it',
    loadingHealth: 'Loading your health information...',
    medicationReminder: 'Medication Reminder',
    timeToTake: 'Time to take:',
    dosage: 'Dosage:',
    scheduledTime: 'Scheduled time:',
    testNotification: 'Test Notification',
    emergencyContacts: 'Emergency Contacts',
    addEmergencyContact: '+ Add Emergency Contact',
    reportTracking: 'Report & Tracking',
    downloadReport: 'Download Report',
    addMedicine: 'Add Medicine',
    quickActions: 'Quick Actions',
    needHelpText: 'Need Help?',
    yourHealthCompanion: 'Your Health Companion',
    careCircle: 'CareCircle',

    // Notification messages
    medicineReminderMessage: (medicine) => `Time to take your medicine. ${medicine.name}, dosage ${medicine.dosage}. Please take the medicine now.`,
    // Short phrase used specifically by voice reminders: "Take medicine"
    takeMedicine: 'Please take the medicine now.',
  },
  Tamil: {
    // UI translations
    hello: 'வணக்கம்',
    friend: 'நண்பர்',
    howFeeling: 'இன்று உங்கள் உணர்வு எப்படி?',
    great: '😊 சிறப்பாக இருக்கிறது',
    okay: '😐 சரியாக இருக்கிறது',
    needHelp: '😟 உதவி தேவை',
    todaysMedications: 'இன்றைய மருந்துகள்',
    noMedications: '🎉 இன்று மருந்து எடுக்க திட்டமிடப்படவில்லை!',
    enjoyDay: 'எளிதாக இருங்கள் மற்றும் உங்கள் நாளை அனுபவிக்கவும்.',
    takenIt: '✅ நான் எடுத்துவிட்டேன்',
    loadingHealth: 'உங்கள் ஆரோக்கிய தகவலை ஏற்றுகிறது...',
    medicationReminder: 'மருந்து நினைவூட்டல்',
    timeToTake: 'எடுக்கும் நேரம்:',
    dosage: 'அளவு:',
    scheduledTime: 'திட்டமிடப்பட்ட நேரம்:',
    testNotification: 'சோதனை அறிவிப்பு',
    emergencyContacts: 'அவசர தொடர்புகள்',
    addEmergencyContact: '+ அவசர தொடர்பைச் சேர்க்கவும்',
    reportTracking: 'அறிக்கை மற்றும் கண்காணிப்பு',
    downloadReport: 'அறிக்கையைப் பதிவிறக்கவும்',
    addMedicine: 'மருந்தைச் சேர்க்கவும்',
    quickActions: 'விரைவு செயல்கள்',
    needHelpText: 'உதவி தேவையா?',
    yourHealthCompanion: 'உங்கள் ஆரோக்கிய துணை',
    careCircle: 'கேர்சர்க்கிள்',

    // Notification messages
    medicineReminderMessage: (medicine) => `மருந்து எடுக்கும் நேரம். ${medicine.name}, அளவு ${medicine.dosage}. இப்போது மருந்தை எடுத்துக்கொள்ளுங்கள்.`,
    // Short phrase used specifically by voice reminders
    takeMedicine: 'இப்போது மருந்தை எடுத்துக்கொள்ளுங்கள்.',
  },
  Hindi: {
    // UI translations
    hello: 'नमस्ते',
    friend: 'मित्र',
    howFeeling: 'आज आप कैसा महसूस कर रहे हैं?',
    great: '😊 बहुत अच्छा',
    okay: '😐 ठीक है',
    needHelp: '😟 मदद चाहिए',
    todaysMedications: 'आज की दवाएं',
    noMedications: '🎉 आज कोई दवा निर्धारित नहीं!',
    enjoyDay: 'आराम से रहें और अपना दिन एन्जॉय करें।',
    takenIt: '✅ मैंने ले ली है',
    loadingHealth: 'आपकी स्वास्थ्य जानकारी लोड हो रही है...',
    medicationReminder: 'दवा रिमाइंडर',
    timeToTake: 'लेने का समय:',
    dosage: 'खुराक:',
    scheduledTime: 'निर्धारित समय:',
    testNotification: 'टेस्ट अधिसूचना',
    emergencyContacts: 'आपातकालीन संपर्क',
    addEmergencyContact: '+ आपातकालीन संपर्क जोड़ें',
    reportTracking: 'रिपोर्ट और ट्रैकिंग',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    addMedicine: 'दवा जोड़ें',
    quickActions: 'त्वरित कार्य',
    needHelpText: 'मदद चाहिए?',
    yourHealthCompanion: 'आपका स्वास्थ्य साथी',
    careCircle: 'केयरसर्कल',

    // Notification messages
    medicineReminderMessage: (medicine) => `दवा लेने का समय. ${medicine.name}, खुराक ${medicine.dosage}. कृपया अभी दवा लें।`,
    // Short phrase used specifically by voice reminders
    takeMedicine: 'कृपया अभी दवा लें।',
  },
  Malayalam: {
    // UI translations
    hello: 'ഹലോ',
    friend: 'സുഹൃത്ത്',
    howFeeling: 'ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?',
    great: '😊 മികച്ചത്',
    okay: '😐 ശരിയാണ്',
    needHelp: '😟 സഹായം ആവശ്യമാണ്',
    todaysMedications: 'ഇന്നത്തെ മരുന്നുകൾ',
    noMedications: '🎉 ഇന്ന് മരുന്ന് ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല!',
    enjoyDay: 'എളുപ്പത്തിൽ ഇരിക്കുകയും നിങ്ങളുടെ ദിവസം ആസ്വദിക്കുകയും ചെയ്യുക.',
    takenIt: '✅ ഞാൻ എടുത്തു',
    loadingHealth: 'നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ ലോഡുചെയ്യുന്നു...',
    medicationReminder: 'മരുന്ന് റിമൈൻഡർ',
    timeToTake: 'എടുക്കാനുള്ള സമയം:',
    dosage: 'അളവ്:',
    scheduledTime: 'ഷെഡ്യൂൾ ചെയ്ത സമയം:',
    testNotification: 'ടെസ്റ്റ് അറിയിപ്പ്',
    emergencyContacts: 'അടിയന്തര ബന്ധങ്ങൾ',
    addEmergencyContact: '+ അടിയന്തര ബന്ധം ചേർക്കുക',
    reportTracking: 'റിപ്പോർട്ട് ആൻഡ് ട്രാക്കിംഗ്',
    downloadReport: 'റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക',
    addMedicine: 'മരുന്ന് ചേർക്കുക',
    quickActions: 'ദ്രുത പ്രവർത്തനങ്ങൾ',
    needHelpText: 'സഹായം ആവശ്യമാണോ?',
    yourHealthCompanion: 'നിങ്ങളുടെ ആരോഗ്യ സഹചരൻ',
    careCircle: 'ക്യാർസർക്കിൾ',

    // Notification messages
    medicineReminderMessage: (medicine) => `മരുന്ന് എടുക്കാനുള്ള സമയം. ${medicine.name}, അളവ് ${medicine.dosage}. ഇപ്പോൾ മരുന്ന് എടുക്കുക.`,
    // Short phrase used specifically by voice reminders
    takeMedicine: 'ദയവായി ഇപ്പോൾ മരുന്ന് എടുക്കുക.',
  },
};

// Language codes for voice synthesis
const voiceLangCodes = {
  English: 'en-IN',
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Malayalam: 'ml-IN',
};

// Helper function to get translation
const getTranslation = (language, key, ...args) => {
  const langTranslations = translations[language] || translations.English;
  const value = langTranslations[key];
  if (typeof value === 'function') {
    return value(...args);
  }
  return value || translations.English[key] || key;
};

// Helper function to get voice language code
const getVoiceLangCode = (language) => {
  return voiceLangCodes[language] || 'en-IN';
};

export { translations, getTranslation, getVoiceLangCode };
