/* =====================================================================
   MediAssist AI – ML/NLP Engine (Browser-Side)
   =====================================================================
   Provides:
     1. Symptom Classification (TF-IDF + Cosine Similarity)
     2. Medical Knowledge RAG (Retrieval-Augmented Generation)
     3. Emergency Detection (Weighted Binary Classifier)
   ===================================================================== */

window.MediAssistML = (function () {
    'use strict';

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SECTION 1: NLP UTILITIES                                       ║
    // ╚══════════════════════════════════════════════════════════════════╝

    const STOP_WORDS = new Set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
        'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
        'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
        'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
        'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
        'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
        'at', 'by', 'for', 'with', 'about', 'against', 'between', 'through',
        'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
        'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain',
        'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma',
        'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won',
        'wouldn', 'also', 'get', 'got', 'like', 'really', 'feel', 'feeling',
        'think', 'know', 'want', 'need', 'go', 'going', 'would', 'could',
    ]);

    // Simple Porter-like stemmer for English
    function stem(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length < 3) return word;
        // Step 1: common suffixes
        const rules = [
            [/ational$/, 'ate'], [/tional$/, 'tion'], [/enci$/, 'ence'],
            [/anci$/, 'ance'], [/izer$/, 'ize'], [/alism$/, 'al'],
            [/iveness$/, 'ive'], [/fulness$/, 'ful'], [/ousli$/, 'ous'],
            [/ation$/, 'ate'], [/ator$/, 'ate'], [/ness$/, ''],
            [/ment$/, ''], [/ings$/, ''], [/ing$/, ''], [/ies$/, 'y'],
            [/ive$/, ''], [/able$/, ''], [/ible$/, ''], [/ally$/, 'al'],
            [/edly$/, 'ed'], [/ful$/, ''], [/less$/, ''], [/ly$/, ''],
            [/ed$/, ''], [/es$/, ''], [/s$/, ''],
        ];
        for (const [pattern, replacement] of rules) {
            if (pattern.test(word) && word.replace(pattern, replacement).length >= 2) {
                return word.replace(pattern, replacement);
            }
        }
        return word;
    }

    // Tokenize text → array of stemmed tokens (unigrams + bigrams)
    function tokenize(text) {
        const words = text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && !STOP_WORDS.has(w));
        const stemmed = words.map(stem).filter(w => w.length > 1);
        const bigrams = [];
        for (let i = 0; i < stemmed.length - 1; i++) {
            bigrams.push(stemmed[i] + '_' + stemmed[i + 1]);
        }
        return [...stemmed, ...bigrams];
    }

    // Term Frequency
    function computeTF(tokens) {
        const tf = {};
        tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
        const max = Math.max(...Object.values(tf), 1);
        for (const t in tf) tf[t] /= max;
        return tf;
    }

    // Cosine similarity between two TF-IDF vectors
    function cosineSimilarity(vecA, vecB) {
        let dot = 0, magA = 0, magB = 0;
        const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
        allTerms.forEach(term => {
            const a = vecA[term] || 0;
            const b = vecB[term] || 0;
            dot += a * b;
            magA += a * a;
            magB += b * b;
        });
        const denom = Math.sqrt(magA) * Math.sqrt(magB);
        return denom === 0 ? 0 : dot / denom;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SECTION 2: SYMPTOM CLASSIFICATION MODEL                        ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // Training corpus: disease → symptom descriptions
    const DISEASE_CORPUS = {
        'Common Cold': 'runny nose sneezing nasal congestion sore throat mild cough low grade fever watery eyes mild headache mild body aches post nasal drip',
        'Influenza (Flu)': 'high fever severe body aches chills fatigue exhaustion dry cough sore throat headache muscle pain weakness sudden onset sweating',
        'COVID-19': 'fever dry cough fatigue loss taste loss smell shortness breath body aches headache sore throat congestion nausea diarrhea difficulty breathing',
        'Migraine': 'severe headache one side throbbing pulsating nausea vomiting sensitivity light sound aura visual disturbances intense head pain lasting hours',
        'Tension Headache': 'dull aching head pain tightness pressure forehead temples back head neck mild moderate intensity both sides band like sensation',
        'Type 2 Diabetes': 'increased thirst frequent urination extreme hunger fatigue blurred vision slow healing wounds frequent infections tingling numbness hands feet unexplained weight loss darkened skin',
        'Type 1 Diabetes': 'extreme thirst frequent urination bedwetting children unexplained weight loss irritability mood changes fatigue weakness blurred vision hunger',
        'Hypertension': 'high blood pressure headache shortness breath nosebleeds flushing dizziness chest pain visual changes blood spots eyes usually no symptoms silent killer',
        'Asthma': 'wheezing shortness breath chest tightness coughing night early morning trouble sleeping cough wheeze difficulty breathing exercise triggers allergies',
        'Pneumonia': 'cough phlegm fever chills difficulty breathing chest pain sharp stabbing breathing deeply coughing fatigue nausea vomiting diarrhea shortness breath confusion',
        'Bronchitis': 'persistent cough mucus production chest discomfort fatigue shortness breath slight fever chills body aches sore throat wheezing chest congestion',
        'Sinusitis': 'facial pain pressure congestion nasal discharge thick yellow green mucus headache reduced smell cough postnasal drip fever fatigue tooth pain',
        'Allergies': 'sneezing itchy eyes nose throat runny nose watery eyes nasal congestion hives skin rash swelling coughing wheezing seasonal triggers pollen dust',
        'Gastritis': 'upper abdominal pain nausea vomiting bloating feeling fullness indigestion gnawing burning stomach pain appetite loss hiccups dark stools',
        'GERD': 'heartburn acid reflux chest pain difficulty swallowing regurgitation food sour liquid feeling lump throat chronic cough laryngitis worsening night lying down',
        'Urinary Tract Infection': 'burning urination frequent urge urinate strong persistent urge passing small amounts cloudy urine strong smelling urine pelvic pain red pink cola colored urine',
        'Kidney Stones': 'severe pain side back below ribs groin lower abdomen pain radiating fluctuating intensity painful urination pink red brown urine cloudy foul smelling nausea vomiting fever chills',
        'Anemia': 'fatigue weakness pale yellowish skin irregular heartbeat shortness breath dizziness lightheadedness chest pain cold hands feet headache brittle nails',
        'Hypothyroidism': 'fatigue weight gain cold sensitivity constipation dry skin puffy face hoarse voice muscle weakness elevated cholesterol muscle aches stiffness joint pain swelling thinning hair depression',
        'Hyperthyroidism': 'weight loss rapid heartbeat irregular heartbeat pounding heart increased appetite nervousness anxiety tremor sweating menstrual changes heat sensitivity frequent bowel movements enlarged thyroid goiter',
        'Arthritis': 'joint pain stiffness swelling redness decreased range motion morning stiffness worse with age affects hands knees hips spine warmth around joints',
        'Dengue Fever': 'high fever severe headache pain behind eyes muscle joint bone pain rash mild bleeding nose gums easy bruising nausea vomiting fatigue',
        'Malaria': 'fever chills sweating headache nausea vomiting body aches general malaise tiredness cyclical fever patterns shaking rigors high temperature',
        'Tuberculosis': 'persistent cough three weeks coughing blood chest pain painful breathing weight loss fatigue fever night sweats chills appetite loss',
        'Conjunctivitis': 'red pink eye itching burning tearing discharge crusting eyelids swollen eyelids watery eyes gritty feeling sensitivity light',
        'Gastroenteritis': 'diarrhea nausea vomiting stomach cramps abdominal pain low grade fever muscle aches headache dehydration watery stool',
        'Iron Deficiency': 'extreme fatigue weakness pale skin chest pain fast heartbeat shortness breath headache dizziness lightheadedness cold hands feet brittle nails unusual cravings tongue soreness',
        'Anxiety Disorder': 'excessive worry restlessness feeling on edge fatigue difficulty concentrating irritability muscle tension sleep problems panic attacks rapid heartbeat sweating trembling',
        'Depression': 'persistent sadness loss interest hopelessness fatigue sleep changes appetite changes difficulty concentrating feelings worthlessness guilt thoughts death withdrawal social activities',
        'Insomnia': 'difficulty falling asleep difficulty staying asleep waking early not feeling rested daytime tiredness sleepiness irritability depression anxiety difficulty paying attention worrying sleep',
    };

    // Build IDF from corpus
    let idfCache = null;
    let corpusVectors = null;

    function buildCorpusIndex() {
        if (idfCache) return;

        const N = Object.keys(DISEASE_CORPUS).length;
        const docFreq = {};
        const vectors = {};

        // Compute document frequencies
        for (const disease in DISEASE_CORPUS) {
            const tokens = tokenize(DISEASE_CORPUS[disease]);
            const unique = new Set(tokens);
            unique.forEach(t => { docFreq[t] = (docFreq[t] || 0) + 1; });
        }

        // Compute IDF
        idfCache = {};
        for (const term in docFreq) {
            idfCache[term] = Math.log((N + 1) / (docFreq[term] + 1)) + 1;
        }

        // Build TF-IDF vectors for each disease
        for (const disease in DISEASE_CORPUS) {
            const tokens = tokenize(DISEASE_CORPUS[disease]);
            const tf = computeTF(tokens);
            const tfidf = {};
            for (const term in tf) {
                tfidf[term] = tf[term] * (idfCache[term] || 1);
            }
            vectors[disease] = tfidf;
        }

        corpusVectors = vectors;
    }

    /**
     * Classify symptoms → top N diseases with confidence scores
     * @param {string} userText
     * @param {number} topN
     * @returns {{ predictions: Array<{disease: string, confidence: number}> }}
     */
    function classifySymptoms(userText, topN = 3) {
        buildCorpusIndex();

        const tokens = tokenize(userText);
        if (tokens.length === 0) return { predictions: [] };

        const tf = computeTF(tokens);
        const queryVec = {};
        for (const term in tf) {
            queryVec[term] = tf[term] * (idfCache[term] || 0.5);
        }

        const scores = [];
        for (const disease in corpusVectors) {
            const sim = cosineSimilarity(queryVec, corpusVectors[disease]);
            if (sim > 0.01) {
                scores.push({ disease, confidence: sim });
            }
        }

        scores.sort((a, b) => b.confidence - a.confidence);
        const top = scores.slice(0, topN);

        // Normalize to percentages (softmax-style)
        if (top.length > 0) {
            const total = top.reduce((s, p) => s + p.confidence, 0);
            top.forEach(p => {
                p.confidence = Math.round((p.confidence / total) * 100);
            });
            // Ensure they sum to 100
            const diff = 100 - top.reduce((s, p) => s + p.confidence, 0);
            if (top.length > 0) top[0].confidence += diff;
        }

        return { predictions: top };
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SECTION 3: MEDICAL KNOWLEDGE RAG                               ║
    // ╚══════════════════════════════════════════════════════════════════╝

    const KNOWLEDGE_BASE = {
        fever: {
            title: 'Fever Management',
            tags: 'fever temperature hot chills shivering pyrexia high temp thermometer',
            overview: 'A fever is a temporary increase in body temperature, often due to an illness. It indicates your body is fighting an infection.',
            symptoms: ['Temperature above 100.4°F (38°C)', 'Chills and shivering', 'Sweating', 'Headache', 'Muscle aches', 'Loss of appetite', 'Dehydration', 'General weakness'],
            treatment: ['Rest and stay hydrated with water, broths, and electrolyte drinks', 'Take acetaminophen (Tylenol) or ibuprofen (Advil) as directed', 'Wear lightweight clothing and use a light blanket', 'Apply lukewarm (not cold) compress to the forehead', 'Take a lukewarm bath if temperature is very high'],
            prevention: ['Wash hands frequently', 'Avoid touching face', 'Stay up-to-date on vaccinations', 'Maintain a healthy immune system with proper nutrition and sleep'],
            emergency: ['Temperature exceeds 103°F (39.4°C) in adults', 'Fever lasts more than 3 days', 'Confusion, stiff neck, or rash develop', 'Infant under 3 months with any fever', 'Seizures occur with fever'],
            source: 'Mayo Clinic, CDC Guidelines',
        },
        headache: {
            title: 'Headache & Migraine Guide',
            tags: 'headache head pain migraine head hurts head ache throbbing pounding tension cluster',
            overview: 'Headaches range from mild tension-type to severe migraines. Understanding the type helps determine the best treatment approach.',
            symptoms: ['Dull, aching pain (tension)', 'Throbbing or pulsating pain (migraine)', 'Sensitivity to light and sound', 'Nausea or vomiting', 'Pain on one or both sides', 'Tightness around forehead or temples', 'Aura or visual disturbances (migraine)'],
            treatment: ['Over-the-counter pain relievers: ibuprofen, acetaminophen, aspirin', 'Rest in a quiet, dark room', 'Apply cold or warm compress to head or neck', 'Stay hydrated and eat regular meals', 'Caffeine in small amounts may help', 'Prescription triptans for migraines (consult doctor)'],
            prevention: ['Manage stress through relaxation techniques', 'Maintain regular sleep patterns (7-9 hours)', 'Limit screen time and take regular breaks', 'Exercise regularly (at least 150 min/week)', 'Identify and avoid personal triggers', 'Stay hydrated throughout the day'],
            emergency: ['Sudden, severe "thunderclap" headache', 'Headache with fever, stiff neck, confusion, or vision changes', 'Headache after a head injury', 'Worst headache of your life', 'Headache with numbness, weakness, or speech difficulties'],
            source: 'American Migraine Foundation, WHO',
        },
        burns: {
            title: 'First Aid for Burns',
            tags: 'burn burns scalded scald burned fire hot water steam chemical electrical',
            overview: 'Burns are classified by severity: first-degree (superficial), second-degree (partial thickness), and third-degree (full thickness). Quick first aid minimizes damage.',
            symptoms: ['Redness and pain (1st degree)', 'Blistering, swelling, red/white patches (2nd degree)', 'White, brown, or black charred skin (3rd degree)', 'Numbness in severe burns', 'Swelling'],
            treatment: ['Cool under cool (not ice cold) running water for 10-20 minutes', 'Remove jewelry or tight items before swelling occurs', 'Cover with sterile, non-stick bandage or clean cloth', 'Take OTC pain relief as needed', 'Apply aloe vera or burn ointment for minor burns', 'Do NOT apply ice, butter, toothpaste, or home remedies', 'Do NOT break blisters or peel stuck clothing'],
            prevention: ['Keep hot liquids away from children', 'Test water temperature before bathing', 'Use oven mitts and pot holders', 'Install smoke detectors', 'Keep fire extinguisher accessible'],
            emergency: ['Burns covering a large area or involving face, hands, feet, joints', 'Burns appearing white, brown, or black (3rd degree)', 'Chemical or electrical burns', 'Burns in children or elderly', 'Burns with difficulty breathing'],
            source: 'American Burn Association, Red Cross',
        },
        diabetes: {
            title: 'Understanding Diabetes',
            tags: 'diabetes blood sugar glucose diabetic insulin type 1 type 2 gestational a1c',
            overview: 'Diabetes is a chronic condition affecting blood sugar regulation. Type 1 is autoimmune, Type 2 involves insulin resistance, and gestational develops during pregnancy.',
            symptoms: ['Increased thirst and frequent urination', 'Unexplained weight loss', 'Extreme fatigue and weakness', 'Blurred vision', 'Slow-healing sores', 'Frequent infections', 'Tingling or numbness in hands/feet', 'Darkened skin patches (acanthosis nigricans)'],
            treatment: ['Type 1: Insulin therapy (lifelong), blood sugar monitoring', 'Type 2: Lifestyle changes, oral medications, possibly insulin', 'Regular blood sugar monitoring', 'Healthy diet management', 'Regular physical activity (150+ min/week)', 'Regular A1C testing every 3-6 months'],
            prevention: ['Maintain healthy weight', 'Exercise at least 150 minutes per week', 'Eat a balanced diet rich in fiber, low in refined sugars', 'Regular health screenings, especially if family history', 'Avoid smoking', 'Manage stress levels'],
            emergency: ['Blood sugar below 54 mg/dL (severe hypoglycemia)', 'Blood sugar above 300 mg/dL unresponsive to treatment', 'Diabetic ketoacidosis: nausea, vomiting, fruity breath, confusion', 'Loss of consciousness'],
            source: 'American Diabetes Association, WHO',
        },
        mental_health: {
            title: 'Mental Health Support',
            tags: 'mental health anxiety depression stress sad worried panic lonely mental wellbeing emotional psychological therapy counseling',
            overview: 'Mental health is as important as physical health. Common conditions include anxiety disorders, depression, and stress-related issues. Professional support is always available.',
            symptoms: ['Persistent sadness or low mood', 'Excessive worry or fear', 'Withdrawal from social activities', 'Changes in sleep or appetite', 'Difficulty concentrating', 'Fatigue and low energy', 'Feelings of worthlessness or guilt', 'Panic attacks: rapid heartbeat, sweating, trembling'],
            treatment: ['Practice deep breathing: Inhale 4s → Hold 4s → Exhale 4s', 'Engage in regular physical activity', 'Maintain social connections', 'Establish a routine with adequate sleep', 'Cognitive Behavioral Therapy (CBT)', 'Mindfulness meditation and journaling', 'Professional therapy or counseling', 'Medication when prescribed by a psychiatrist'],
            prevention: ['Regular exercise (natural mood enhancer)', 'Maintain strong social connections', 'Practice stress management techniques', 'Get adequate sleep (7-9 hours)', 'Limit alcohol and substance use', 'Seek help early when struggling'],
            emergency: ['Suicidal thoughts or self-harm ideation → Call 988 (USA)', 'Crisis Text Line: Text HOME to 741741', 'NAMI Helpline: 1-800-950-6264', 'Go to nearest emergency room if in immediate danger'],
            source: 'National Institute of Mental Health, NAMI',
        },
        nutrition: {
            title: 'Nutrition & Healthy Eating',
            tags: 'nutrition diet food eat healthy eating vitamins nutrients weight loss balanced meal calories protein',
            overview: 'Good nutrition is the foundation of health. A balanced diet provides essential nutrients, supports immune function, and reduces disease risk.',
            symptoms: ['Fatigue and low energy (poor nutrition)', 'Frequent illness (weak immunity)', 'Slow wound healing', 'Hair loss or brittle nails', 'Difficulty concentrating', 'Unexplained weight changes'],
            treatment: ['Fill half your plate with fruits and vegetables', 'Choose whole grains over refined grains', 'Include lean proteins: fish, poultry, beans, nuts', 'Limit processed foods, added sugar, and sodium', 'Stay hydrated — 8+ glasses of water daily', 'Key nutrients: Vitamin D, Iron, Omega-3, Calcium, Fiber, B12'],
            prevention: ['Eat a rainbow of colorful fruits and vegetables', 'Plan meals ahead to avoid unhealthy choices', 'Read nutrition labels carefully', 'Practice portion control using smaller plates', 'Cook at home more often', 'Limit sugary beverages and alcohol'],
            emergency: ['Severe allergic reaction to food (anaphylaxis) → Call 911', 'Signs of severe dehydration', 'Suspected food poisoning with high fever or bloody stool'],
            source: 'USDA Dietary Guidelines, WHO Nutrition',
        },
        cold_flu: {
            title: 'Cold & Flu Management',
            tags: 'cold flu cough runny nose sore throat congestion sneezing influenza common cold viral infection',
            overview: 'The common cold and flu are viral respiratory infections. Colds are milder with gradual onset; flu hits suddenly with more severe symptoms.',
            symptoms: ['Cold: Runny nose, sneezing, mild cough, sore throat', 'Flu: High fever, severe body aches, exhaustion, dry cough', 'Both: Congestion, headache, fatigue', 'Flu may cause nausea and vomiting'],
            treatment: ['Rest and stay well-hydrated', 'OTC medications for symptom relief', 'Gargle warm salt water for sore throat', 'Use a humidifier to ease congestion', 'Honey and lemon tea to soothe symptoms', 'Antiviral medications for flu within 48 hours (prescription)'],
            prevention: ['Wash hands frequently with soap for 20+ seconds', 'Get annual flu vaccine', 'Avoid close contact with sick individuals', 'Don\'t touch your face', 'Disinfect frequently touched surfaces', 'Maintain a strong immune system'],
            emergency: ['Difficulty breathing or shortness of breath', 'Persistent chest pain or pressure', 'Confusion or inability to arouse', 'Severe or persistent vomiting', 'Symptoms improve then return with fever and worse cough'],
            source: 'CDC, World Health Organization',
        },
        sleep: {
            title: 'Sleep Health Guide',
            tags: 'sleep insomnia cant sleep sleeping tired fatigue restless sleep disorder sleep hygiene melatonin',
            overview: 'Quality sleep is essential for physical and mental health. Adults need 7-9 hours per night. Chronic sleep issues affect mood, immunity, and cognitive function.',
            symptoms: ['Difficulty falling asleep', 'Waking frequently during the night', 'Waking too early', 'Daytime fatigue and sleepiness', 'Irritability and mood changes', 'Difficulty concentrating', 'Reliance on sleeping pills or alcohol'],
            treatment: ['Maintain a consistent sleep schedule even on weekends', 'Create a dark, cool (65-68°F), quiet sleeping environment', 'Avoid screens 1 hour before bedtime', 'Limit caffeine after 2 PM', 'Try 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s', 'Progressive muscle relaxation before bed', 'Warm bath or shower 1-2 hours before bed'],
            prevention: ['Regular exercise, but not within 3 hours of bedtime', 'Avoid large meals and alcohol before bed', 'Limit naps to 20-30 minutes before 3 PM', 'Establish a relaxing bedtime routine', 'Use bed only for sleep (not work or screens)'],
            emergency: ['Insomnia persisting more than 4 weeks', 'Loud snoring or stopping breathing during sleep (sleep apnea)', 'Excessive daytime sleepiness causing safety concerns', 'Sleepwalking or sleep-related injuries'],
            source: 'National Sleep Foundation, AASM',
        },
        hypertension: {
            title: 'High Blood Pressure (Hypertension)',
            tags: 'blood pressure hypertension high blood pressure systolic diastolic bp heart cardiovascular',
            overview: 'Hypertension is persistent high blood pressure (≥130/80 mmHg). Often called the "silent killer" because it usually has no symptoms but increases risk of heart attack and stroke.',
            symptoms: ['Usually no symptoms (silent disease)', 'Severe: headaches, shortness of breath, nosebleeds', 'Dizziness or flushing', 'Blood spots in eyes', 'Chest pain in severe cases'],
            treatment: ['Lifestyle changes: DASH diet, exercise, weight loss', 'Reduce sodium intake to under 2,300 mg/day', 'Regular blood pressure monitoring', 'Medications as prescribed: ACE inhibitors, ARBs, diuretics, beta-blockers', 'Limit alcohol consumption', 'Quit smoking'],
            prevention: ['Eat a heart-healthy diet (DASH diet)', 'Exercise at least 150 minutes per week', 'Maintain healthy weight (BMI 18.5-24.9)', 'Manage stress', 'Limit sodium, alcohol, and caffeine', 'Regular health checkups'],
            emergency: ['BP reading above 180/120 mmHg (hypertensive crisis)', 'Severe headache with vision changes', 'Chest pain, difficulty breathing', 'Blood in urine', 'Sudden confusion or difficulty speaking'],
            source: 'American Heart Association, CDC',
        },
        asthma: {
            title: 'Asthma Management',
            tags: 'asthma wheezing breathing difficulty inhaler bronchospasm respiratory shortness breath chest tight',
            overview: 'Asthma is a chronic respiratory condition causing airway inflammation and narrowing, leading to breathing difficulties. Triggers include allergens, exercise, cold air, and stress.',
            symptoms: ['Wheezing (whistling sound when breathing)', 'Shortness of breath', 'Chest tightness or pain', 'Coughing, especially at night or early morning', 'Difficulty sleeping due to breathing problems', 'Worsening symptoms during exercise or illness'],
            treatment: ['Quick-relief inhaler (rescue inhaler) for acute symptoms', 'Long-term control medications (inhaled corticosteroids)', 'Identify and avoid triggers', 'Use a peak flow meter to monitor lung function', 'Create an asthma action plan with your doctor', 'Allergy medications if allergies trigger asthma'],
            prevention: ['Identify and avoid your personal triggers', 'Get vaccinated against flu and pneumonia', 'Monitor air quality and pollen counts', 'Use dust-proof covers on pillows and mattresses', 'Keep indoor humidity between 30-50%', 'Take controller medications as prescribed'],
            emergency: ['Severe shortness of breath unable to speak in full sentences', 'Lips or fingernails turning blue', 'No improvement after using rescue inhaler', 'Rapid worsening of symptoms', 'Chest retractions (skin pulling in around ribs)'],
            source: 'American Academy of Allergy, Asthma & Immunology',
        },
        uti: {
            title: 'Urinary Tract Infection (UTI)',
            tags: 'uti urinary tract infection burning urination bladder kidney infection pyelonephritis cystitis',
            overview: 'UTIs occur when bacteria enter the urinary tract. They commonly affect the bladder (cystitis) and can spread to the kidneys (pyelonephritis). More common in women.',
            symptoms: ['Burning sensation during urination', 'Frequent, urgent need to urinate', 'Passing small amounts of urine', 'Cloudy or strong-smelling urine', 'Pink, red, or cola-colored urine (blood)', 'Pelvic pain (in women)', 'Fever and chills if infection reaches kidneys'],
            treatment: ['Antibiotics prescribed by a doctor (primary treatment)', 'Drink plenty of water to flush bacteria', 'Take pain relievers for discomfort', 'Use a heating pad on your abdomen', 'Avoid irritants: caffeine, alcohol, spicy food', 'Complete the full course of antibiotics'],
            prevention: ['Drink plenty of fluids, especially water', 'Wipe from front to back', 'Urinate soon after sexual intercourse', 'Avoid potentially irritating feminine products', 'Consider cranberry supplements (some evidence of benefit)', 'Don\'t hold urine for long periods'],
            emergency: ['High fever with severe back or flank pain', 'Nausea, vomiting with UTI symptoms (kidney infection)', 'Blood in urine that persists', 'Symptoms in pregnant women (urgent)'],
            source: 'American Urological Association, NIDDK',
        },
    };

    // Build knowledge index
    let knowledgeVectors = null;

    function buildKnowledgeIndex() {
        if (knowledgeVectors) return;
        knowledgeVectors = {};

        const allDocs = {};
        for (const key in KNOWLEDGE_BASE) {
            const kb = KNOWLEDGE_BASE[key];
            const fullText = [
                kb.title, kb.tags, kb.overview,
                kb.symptoms.join(' '), kb.treatment.join(' '),
                kb.prevention.join(' '), kb.emergency.join(' '),
            ].join(' ');
            allDocs[key] = fullText;
        }

        // Compute IDF for knowledge base
        const N = Object.keys(allDocs).length;
        const docFreq = {};
        const tokenCache = {};

        for (const key in allDocs) {
            const tokens = tokenize(allDocs[key]);
            tokenCache[key] = tokens;
            const unique = new Set(tokens);
            unique.forEach(t => { docFreq[t] = (docFreq[t] || 0) + 1; });
        }

        const idf = {};
        for (const term in docFreq) {
            idf[term] = Math.log((N + 1) / (docFreq[term] + 1)) + 1;
        }

        // Build vectors
        for (const key in allDocs) {
            const tf = computeTF(tokenCache[key]);
            const tfidf = {};
            for (const term in tf) {
                tfidf[term] = tf[term] * (idf[term] || 1);
            }
            knowledgeVectors[key] = { vector: tfidf, idf: idf };
        }
    }

    /**
     * Retrieve the best matching knowledge article
     * @param {string} userText
     * @returns {{ found: boolean, article: object|null, matchScore: number }}
     */
    function retrieveKnowledge(userText) {
        buildKnowledgeIndex();

        const tokens = tokenize(userText);
        if (tokens.length === 0) return { found: false, article: null, matchScore: 0 };

        // Use first article's IDF for query vectorization
        const firstKey = Object.keys(knowledgeVectors)[0];
        const idf = knowledgeVectors[firstKey].idf;

        const tf = computeTF(tokens);
        const queryVec = {};
        for (const term in tf) {
            queryVec[term] = tf[term] * (idf[term] || 0.5);
        }

        let bestKey = null;
        let bestScore = 0;

        for (const key in knowledgeVectors) {
            const sim = cosineSimilarity(queryVec, knowledgeVectors[key].vector);
            if (sim > bestScore) {
                bestScore = sim;
                bestKey = key;
            }
        }

        if (bestKey && bestScore > 0.03) {
            return {
                found: true,
                article: { key: bestKey, ...KNOWLEDGE_BASE[bestKey] },
                matchScore: Math.round(bestScore * 100),
            };
        }

        return { found: false, article: null, matchScore: 0 };
    }

    /**
     * Format a knowledge article into an HTML response
     */
    function formatKnowledgeResponse(article) {
        if (!article) return '';

        let html = `<b>📋 ${article.title}</b><br><br>`;
        html += `${article.overview}<br><br>`;

        html += `<b>🔍 Key Symptoms:</b><br>`;
        article.symptoms.forEach(s => { html += `• ${s}<br>`; });
        html += `<br>`;

        html += `<b>💊 Treatment & Management:</b><br>`;
        article.treatment.forEach(t => { html += `• ${t}<br>`; });
        html += `<br>`;

        html += `<b>🛡️ Prevention:</b><br>`;
        article.prevention.forEach(p => { html += `• ${p}<br>`; });
        html += `<br>`;

        html += `<b>⚠️ Seek Medical Attention If:</b><br>`;
        article.emergency.forEach(e => { html += `• ${e}<br>`; });
        html += `<br>`;

        html += `<em class="rag-source">📖 Source: ${article.source}</em>`;
        return html;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SECTION 4: EMERGENCY DETECTION MODEL                           ║
    // ╚══════════════════════════════════════════════════════════════════╝

    const EMERGENCY_PATTERNS = {
        critical: {
            weight: 1.0,
            terms: [
                'heart attack', 'cardiac arrest', 'not breathing', 'stopped breathing',
                'stroke', 'anaphylaxis', 'anaphylactic shock', 'choking to death',
                'losing consciousness', 'lost consciousness', 'unresponsive',
                'severe hemorrhage', 'massive bleeding',
            ],
            patterns: [
                /\b(i'?m|i am|he'?s|she'?s|they'?re)\s+(dying|going to die)\b/i,
                /\bcan'?t\s+breathe?\s*(at\s+all)?\b/i,
                /\bheart\s+(is\s+)?(stop|racing\s+uncontroll)/i,
                /\b(suicid|kill\s+(my|him|her|them)self)\b/i,
            ],
        },
        high: {
            weight: 0.8,
            terms: [
                'chest pain', 'difficulty breathing', 'severe bleeding',
                'unconscious', 'seizure', 'convulsion', 'overdose',
                'allergic shock', 'can\'t breathe', 'cannot breathe',
                'choking', 'severe allergic reaction', 'collapse',
                'passing out', 'fainted', 'face drooping', 'arm weakness',
                'speech difficulty', 'suicide', 'self harm',
            ],
            patterns: [
                /\bchest\s+(pain|tight|pressure|crush)\b/i,
                /\b(severe|extreme|unbearable)\s+(pain|bleed)/i,
                /\bwant\s+to\s+(die|end\s+(it|my\s+life))\b/i,
            ],
        },
        moderate: {
            weight: 0.6,
            terms: [
                'high fever', 'blood in stool', 'blood in urine', 'coughing blood',
                'severe headache', 'vision loss', 'sudden numbness',
                'severe abdominal pain', 'poisoning', 'head injury',
                'broken bone', 'fracture', 'deep cut', 'severe burn',
                'drug reaction', 'bitten by snake', 'electric shock',
            ],
            patterns: [
                /\b(can'?t|cannot)\s+(move|feel|see|walk|stand)\b/i,
                /\bsudden(ly)?\s+(blind|deaf|paralyz|numb|weak)\b/i,
            ],
        },
    };

    /**
     * Detect emergency with severity scoring
     * @param {string} text
     * @returns {{ isEmergency: boolean, severity: string, score: number, matchedTerms: string[] }}
     */
    function detectEmergency(text) {
        const lower = text.toLowerCase();
        let totalScore = 0;
        let maxWeight = 0;
        const matchedTerms = [];

        for (const level in EMERGENCY_PATTERNS) {
            const { weight, terms, patterns } = EMERGENCY_PATTERNS[level];

            // Check keyword matches
            for (const term of terms) {
                if (lower.includes(term)) {
                    totalScore += weight;
                    maxWeight = Math.max(maxWeight, weight);
                    matchedTerms.push(term);
                }
            }

            // Check regex pattern matches
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    totalScore += weight;
                    maxWeight = Math.max(maxWeight, weight);
                    const match = text.match(pattern);
                    if (match) matchedTerms.push(match[0]);
                }
            }
        }

        // Normalize score (cap at 1.0)
        const score = Math.min(totalScore, 1.0);

        // Determine severity
        let severity = 'none';
        if (score >= 0.6 || maxWeight >= 1.0) severity = 'critical';
        else if (score >= 0.3) severity = 'high';
        else if (score > 0) severity = 'moderate';

        return {
            isEmergency: score >= 0.3,
            severity,
            score: Math.round(score * 100) / 100,
            matchedTerms: [...new Set(matchedTerms)],
        };
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SECTION 5: UNIFIED RESPONSE GENERATOR                          ║
    // ╚══════════════════════════════════════════════════════════════════╝

    /**
     * Generate a complete response combining all ML subsystems
     * @param {string} userText
     * @returns {{ responseHTML: string, emergency: object, predictions: Array }}
     */
    function generateResponse(userText) {
        const emergency = detectEmergency(userText);
        const classification = classifySymptoms(userText);
        const knowledge = retrieveKnowledge(userText);

        let html = '';

        // Emergency warning
        if (emergency.isEmergency) {
            const sevLabel = emergency.severity === 'critical' ? '🚨 CRITICAL' : emergency.severity === 'high' ? '⚠️ HIGH RISK' : '⚡ MODERATE RISK';
            html += `<div class="ml-emergency-inline">`;
            html += `<b>${sevLabel} — Emergency Indicators Detected</b><br>`;
            html += `Matched: ${emergency.matchedTerms.join(', ')}<br>`;
            html += `<em>Please contact emergency services immediately or call 911.</em>`;
            html += `</div><br>`;
        }

        // Symptom predictions
        if (classification.predictions.length > 0) {
            html += `<div class="ml-predictions">`;
            html += `<b>🧠 AI Symptom Analysis</b>`;
            html += `<div class="prediction-subtitle">Based on your description, here are the most likely conditions:</div>`;
            html += `<div class="prediction-cards">`;
            classification.predictions.forEach((p, i) => {
                const barColor = i === 0 ? 'var(--accent)' : i === 1 ? 'var(--green)' : 'var(--yellow)';
                html += `<div class="prediction-card">`;
                html += `<div class="prediction-header">`;
                html += `<span class="prediction-rank">#${i + 1}</span>`;
                html += `<span class="prediction-name">${p.disease}</span>`;
                html += `<span class="prediction-pct">${p.confidence}%</span>`;
                html += `</div>`;
                html += `<div class="prediction-bar"><div class="prediction-fill" style="width:${p.confidence}%;background:${barColor}"></div></div>`;
                html += `</div>`;
            });
            html += `</div></div><br>`;
        }

        // Knowledge response
        if (knowledge.found) {
            html += formatKnowledgeResponse(knowledge.article);
        } else if (classification.predictions.length === 0) {
            // Fallback
            html += `Thank you for your question! While I can provide general medical information, I want to ensure you get the most relevant advice.<br><br>`;
            html += `<b>Here's what I can help with:</b><br>`;
            html += `• Symptom analysis & disease information<br>`;
            html += `• First aid instructions<br>`;
            html += `• Medication general information<br>`;
            html += `• Mental health resources<br>`;
            html += `• Nutrition & wellness tips<br>`;
            html += `• Preventive care recommendations<br><br>`;
            html += `Try describing your symptoms in detail, or select a quick topic from the suggestions below.`;
        }

        // Safety disclaimer
        html += `<br><br><em class="msg-disclaimer">⚕️ This is AI-generated general information, not medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.</em>`;

        return {
            responseHTML: html,
            emergency,
            predictions: classification.predictions,
        };
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  PUBLIC API                                                      ║
    // ╚══════════════════════════════════════════════════════════════════╝

    return {
        classifySymptoms,
        retrieveKnowledge,
        formatKnowledgeResponse,
        detectEmergency,
        generateResponse,
        // Expose for testing
        _tokenize: tokenize,
        _cosineSimilarity: cosineSimilarity,
        _stem: stem,
    };
})();
