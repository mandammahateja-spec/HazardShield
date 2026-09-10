/**
 * Multilingual Voice & SMS Alert Engine
 * Utilizes Web Speech API and Web Audio API for browser-native emergency broadcasts.
 */

export interface AlertMessagePayload {
  zoneId: string;
  zoneName: string;
  hazardType: string;
  riskScore: number;
  shelterName: string;
  language: 'hi' | 'en' | 'mr';
  headline: string;
  smsBody: string;
  voiceScript: string;
  senderId: string;
  dispatchedAt: string;
  recipientCount: number;
}

export function generateEmergencyAlert(
  zoneName: string,
  hazardType: string,
  riskScore: number,
  shelterName: string = 'Designated High-Ground Community Shelter'
): Record<'hi' | 'en' | 'mr', AlertMessagePayload> {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    hi: {
      zoneId: 'current',
      zoneName,
      hazardType,
      riskScore,
      shelterName,
      language: 'hi',
      headline: 'आपातकालीन आपदा चेतावनी: तत्काल सुरक्षित स्थान पर जाएं',
      smsBody: `[NDMA-DISASTER] चेतावनी: ${zoneName} में वर्षा एवं जोखिम स्कोर ${riskScore}% तक पहुंच गया है। सभी नागरिक तुरंत सुरक्षित आश्रय '${shelterName}' की ओर प्रस्थान करें। आपातकालीन नंबर: 1077`,
      voiceScript: `चेतावनी! चेतावनी! जिला आपदा प्रबंधन प्राधिकरण द्वारा आवश्यक सूचना। ${zoneName} में जोखिम सूचकांक ${riskScore} प्रतिशत पार कर गया है। सभी निवासी तुरंत निकटतम सुरक्षित आश्रय ${shelterName} में पहुंचे। मार्ग पर सतर्क रहें।`,
      senderId: 'GOV-DDMA-ALERT',
      dispatchedAt: timestamp,
      recipientCount: 14850,
    },
    en: {
      zoneId: 'current',
      zoneName,
      hazardType,
      riskScore,
      shelterName,
      language: 'en',
      headline: 'CIVIL EMERGENCY ALERT: IMMEDIATE RELOCATION ADVISED',
      smsBody: `[NDMA-ALERT] CRITICAL: Dynamic Risk in ${zoneName} has reached ${riskScore}%. Immediate evacuation active. Head to designated shelter: ${shelterName}. Helpline: 1077.`,
      voiceScript: `Emergency Alert from the District Disaster Management Authority. Attention residents of ${zoneName}. The Dynamic Risk Score has escalated to ${riskScore} percent. Please evacuate immediately via identified safe corridors to ${shelterName}.`,
      senderId: 'GOV-DDMA-ALERT',
      dispatchedAt: timestamp,
      recipientCount: 14850,
    },
    mr: {
      zoneId: 'current',
      zoneName,
      hazardType,
      riskScore,
      shelterName,
      language: 'mr',
      headline: 'आपत्कालीन इशारा: तात्काळ सुरक्षित स्थळी स्थलांतर करा',
      smsBody: `[NDMA-इशारा] सतर्कता: ${zoneName} मध्ये धोका पातळी ${riskScore}% वर पोहोचली आहे. कृपया तात्काळ सुरक्षित निवारक केंद्र '${shelterName}' कडे रवाना व्हा. मदत कक्ष: 1077.`,
      voiceScript: `आपत्कालीन सतर्कतेचा इशारा. ${zoneName} येथील सर्व नागरिकांना कळविण्यात येते की धोका पातळी ${riskScore} टक्क्यांवर गेली आहे. तात्काळ सुरक्षित आश्रय केंद्रात जावे.`,
      senderId: 'GOV-DDMA-ALERT',
      dispatchedAt: timestamp,
      recipientCount: 14850,
    },
  };
}

/**
 * Emits an authentic dual-tone emergency siren pulse using Web Audio API before TTS speech.
 */
export function playAlertSiren(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return resolve();

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      // Modulate frequency between 600Hz and 950Hz (standard civil defense alert tone)
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.5);

      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);

      setTimeout(() => {
        resolve();
      }, 600);
    } catch {
      resolve();
    }
  });
}

/**
 * Plays the voice alert aloud using browser-native SpeechSynthesis.
 */
export async function speakAlertMessage(
  script: string,
  lang: 'hi' | 'en' | 'mr' = 'hi',
  withSiren: boolean = true
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  if (withSiren) {
    await playAlertSiren();
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(script);

  const langCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
  utterance.lang = langCode;
  utterance.rate = lang === 'hi' ? 0.92 : 0.98; // Slightly deliberate pace for civil alert clarity
  utterance.pitch = 1.05;
  utterance.volume = 1.0;

  // Attempt to select an appropriate voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
