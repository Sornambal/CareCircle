import { useEffect } from 'react';
import React, { useRef } from 'react';

// Language mappings for text notifications
const textMessages = {
  English: (medicine) => `Time to take your medicine. ${medicine.name}, dosage ${medicine.dosage}. Please take the medicine now.`,
  Tamil: (medicine) => `மருந்து எடுக்கும் நேரம். ${medicine.name}, அளவு ${medicine.dosage}. இப்போது மருந்தை எடுத்துக்கொள்ளுங்கள்.`,
  Hindi: (medicine) => `दवा लेने का समय. ${medicine.name}, खुराक ${medicine.dosage}. कृपया अभी दवा लें।`,
  Malayalam: (medicine) => `മരുന്ന് എടുക്കാനുള്ള സമയം. ${medicine.name}, അളവ് ${medicine.dosage}. ഇപ്പോൾ മരുന്ന് എടുക്കുക.`,
};

// Language codes for voice synthesis
const voiceLangCodes = {
  English: 'en-IN',
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Malayalam: 'ml-IN',
};

const useMultilingualNotifications = (todaysMedicines, user, token, onMarkTaken) => {
  const preferredLanguage = user?.preferredLanguage || 'English';

  // Get message in preferred language, fallback to English
  const getMessage = (medicine) => {
    return textMessages[preferredLanguage] ? textMessages[preferredLanguage](medicine) : textMessages.English(medicine);
  };

  // Get voice lang code, fallback to English
  const getVoiceLang = () => {
    return voiceLangCodes[preferredLanguage] || 'en-IN';
  };

  // Get appropriate voice for the language
  const getVoice = (lang) => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    console.log('Looking for voice for language:', lang);

    // Try to find a voice that matches the language exactly
    const exactMatch = voices.find(voice => voice.lang === lang);
    if (exactMatch) {
      console.log('Exact match found for', lang, ':', exactMatch.name);
      return exactMatch;
    }
    // Try to find a voice that starts with the language code
    const partialMatch = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
    if (partialMatch) {
      console.log('Partial match found for', lang, ':', partialMatch.name);
      return partialMatch;
    }
    // For Tamil, Hindi, Malayalam, try generic language codes if specific ones not found
    if (lang === 'ta-IN') {
      const tamilVoice = voices.find(voice => voice.lang === 'ta' || voice.lang.startsWith('ta'));
      if (tamilVoice) {
        console.log('Found Tamil voice:', tamilVoice.name);
        return tamilVoice;
      }
    }
    if (lang === 'hi-IN') {
      const hindiVoice = voices.find(voice => voice.lang === 'hi' || voice.lang.startsWith('hi'));
      if (hindiVoice) {
        console.log('Found Hindi voice:', hindiVoice.name);
        return hindiVoice;
      }
    }
    if (lang === 'ml-IN') {
      const malayalamVoice = voices.find(voice => voice.lang === 'ml' || voice.lang.startsWith('ml'));
      if (malayalamVoice) {
        console.log('Found Malayalam voice:', malayalamVoice.name);
        return malayalamVoice;
      }
    }

    // If no native voice found for the language, use English voice but keep the original message
    // This allows the English voice to attempt to speak the foreign language text
    const englishVoice = voices.find(voice => voice.lang === 'en-IN' || voice.lang === 'en-US' || voice.lang === 'en-GB');
    if (englishVoice) {
      console.log('Using English voice for', lang, 'message:', englishVoice.name);
      return englishVoice;
    }

    // Final fallback to any available voice
    const fallback = voices[0];
    console.log('Using fallback voice for', lang, ':', fallback ? fallback.name : 'none');
    return fallback;
  };

  // Function to test voice availability
  const testVoiceSupport = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('=== VOICE SUPPORT TEST ===');
    console.log('Total voices available:', voices.length);
    console.log('Voices by language:');
    const byLang = {};
    voices.forEach(voice => {
      if (!byLang[voice.lang]) byLang[voice.lang] = [];
      byLang[voice.lang].push(voice.name);
    });
    Object.keys(byLang).sort().forEach(lang => {
      console.log(`${lang}: ${byLang[lang].join(', ')}`);
    });
    console.log('=== END VOICE TEST ===');
  };

  // Initialize voices on component mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };

    // Voices might not be loaded immediately
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Track triggered notifications with reminder count
  const triggeredReminders = useRef(new Map());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      todaysMedicines.forEach(medicine => {
        if (medicine.scheduledTimes && Array.isArray(medicine.scheduledTimes)) {
          medicine.scheduledTimes.forEach(scheduled => {
            if (scheduled.status === 'pending') {
              const [hour, minute] = scheduled.time.split(':').map(Number);
              const reminderKey = `${medicine._id}-${scheduled.time}`;

              // Check if it's time for the initial reminder or follow-up reminders
              const isInitialTime = currentHour === hour && currentMinute === minute;
              const reminderData = triggeredReminders.current.get(reminderKey);
              const reminderCount = reminderData ? reminderData.count : 0;
              const lastReminderTime = reminderData ? reminderData.lastTime : null;

              // Trigger initial reminder at scheduled time
              if (isInitialTime && reminderCount === 0) {
                triggerReminder(medicine, scheduled, reminderKey, 1);
              }
              // Trigger follow-up reminders after 1 minute intervals
              else if (reminderCount > 0 && reminderCount < 3 && lastReminderTime) {
                const minutesSinceLastReminder = (now - lastReminderTime) / (1000 * 60);
                if (minutesSinceLastReminder >= 1) {
                  triggerReminder(medicine, scheduled, reminderKey, reminderCount + 1);
                }
              }
            }
          });
        }
      });
    };

    const triggerReminder = (medicine, scheduled, reminderKey, count) => {
      const reminderText = count === 1 ? 'First reminder' : count === 2 ? 'Second reminder' : 'Final reminder';

      // Update reminder tracking
      triggeredReminders.current.set(reminderKey, {
        count: count,
        lastTime: new Date()
      });

      // Get the appropriate voice
      const voice = getVoice(getVoiceLang());
      const voiceLang = voice ? voice.lang : 'en-IN'; // Default to English if no voice

      // Choose message based on voice language
      let message;
      if (voiceLang.startsWith('en')) {
        message = textMessages.English(medicine);
      } else if (voiceLang.startsWith('ta')) {
        message = textMessages.Tamil(medicine);
      } else if (voiceLang.startsWith('hi')) {
        message = textMessages.Hindi(medicine);
      } else if (voiceLang.startsWith('ml')) {
        message = textMessages.Malayalam(medicine);
      } else {
        message = textMessages[preferredLanguage] ? textMessages[preferredLanguage](medicine) : textMessages.English(medicine);
      }

      console.log(`Triggering ${reminderText} for ${preferredLanguage} with message:`, message);

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(message, {
          body: `${reminderText} - Scheduled time: ${scheduled.time}`,
          icon: '/favicon.ico',
        });
      }

      // Play voice reminder using SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = voiceLang;
        utterance.rate = 0.8; // Slower rate for better clarity
        utterance.pitch = 1.0; // Normal pitch
        if (voice) {
          utterance.voice = voice;
          console.log('Using voice:', voice.name, 'for language:', utterance.lang);
          console.log('Full message being spoken:', message);
        } else {
          console.log('No voice found for language:', utterance.lang);
        }
        window.speechSynthesis.speak(utterance);
      }


    };

    const reminderInterval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(reminderInterval);
  }, [todaysMedicines, preferredLanguage, onMarkTaken]);

  // For demo purposes, expose a function to manually trigger a notification
  const triggerDemoNotification = (medicine) => {
    const message = getMessage(medicine);
    console.log('Demo notification for', preferredLanguage, 'with message:', message);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        body: `Demo notification in ${preferredLanguage}`,
        icon: '/favicon.ico',
      });
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = getVoiceLang();
      utterance.rate = 0.8; // Slower rate for better clarity
      utterance.pitch = 1.0; // Normal pitch
      const voice = getVoice(getVoiceLang());
      if (voice) {
        utterance.voice = voice;
        console.log('Demo using voice:', voice.name, 'for language:', utterance.lang);
      } else {
        console.log('Demo: No voice found for language:', utterance.lang);
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  return { triggerDemoNotification, testVoiceSupport };
};

export default useMultilingualNotifications;
