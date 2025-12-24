const Groq = require('groq-sdk');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// System prompt for the medicine assistant
const SYSTEM_PROMPT = `You are a medicine assistant for elderly users.
Answer ONLY basic medicine questions using provided medicine data.
Do NOT give medical diagnosis or treatment advice.
If the question is critical or unsafe, reply:
'Please ask your caregiver or doctor for accurate guidance.'
Use simple and short language.`;

// Function to check if question is critical
const isCriticalQuestion = (question) => {
  const lowerQuestion = question.toLowerCase();
  const criticalKeywords = [
    'increase dose',
    'decrease dose',
    'more dose',
    'less dose',
    'change dose',
    'new medicine',
    'recommend medicine',
    'suggest medicine',
    'emergency',
    'chest pain',
    'heart attack',
    'stroke',
    'can\'t breathe',
    'difficulty breathing',
    'severe pain',
    'diagnosis',
    'treatment',
    'cure',
    'disease',
  ];
  
  return criticalKeywords.some((keyword) => lowerQuestion.includes(keyword));
};

// Main chat handler
exports.medicineChatHandler = async (req, res) => {
  try {
    console.log('Medicine chat request received:', req.body);
    const { question, elderlyId } = req.body;

    // Validate input
    if (!question || !elderlyId) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Question and elderlyId are required',
      });
    }

    console.log('Processing question:', question, 'for elderly:', elderlyId);

    // Check if question is critical
    if (isCriticalQuestion(question)) {
      return res.json({
        success: true,
        answer: 'Please ask your caregiver or doctor for accurate guidance.',
      });
    }

    // Fetch user to verify existence
    const user = await User.findById(elderlyId);
    if (!user) {
      console.log('User not found:', elderlyId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('User found:', user.elderlyName);

    // Fetch all medicines for this elderly user
    const medicines = await Medicine.find({ user: elderlyId });
    console.log('Medicines found:', medicines.length);

    if (!medicines || medicines.length === 0) {
      return res.json({
        success: true,
        answer: 'You do not have any medicines registered yet. Please ask your caregiver to add your medicines.',
      });
    }

    // Format medicine data for the LLM
    const medicineData = medicines.map((med, index) => {
      return `Medicine ${index + 1}:
- Name: ${med.name}
- Dosage: ${med.dosage}
- Timing: ${med.times.join(', ')}
- Prescribed Days: ${med.prescribedDays}
- Start Date: ${med.startDate ? new Date(med.startDate).toLocaleDateString() : 'Not set'}
- End Date: ${med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Not set'}
- Doctor Contact: ${med.doctorContact || 'Not provided'}`;
    }).join('\n\n');

    // Create user message with context
    const userMessage = `Here are the elderly user's medicines:

${medicineData}

User's question: ${question}

Please answer based ONLY on the medicine data provided above. Keep your answer simple and short.`;

    // Call Groq API with Llama 4 Scout model
    // Note: Using llama-3.3-70b-versatile as it's the recommended model for conversational AI
    // This model provides excellent reasoning and safety features for elderly care assistance
    console.log('Calling Groq API...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 200,
    });

    const answer = chatCompletion.choices[0]?.message?.content || 'I could not understand your question. Please try again.';
    console.log('Groq response:', answer);

    res.json({
      success: true,
      answer: answer,
    });

  } catch (error) {
    console.error('Medicine chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to process your question. Please try again.',
      error: error.message,
    });
  }
};
