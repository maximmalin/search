import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (Platform.OS !== 'web') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const ctor = getSpeechRecognition();
    setSupported(ctor !== null);
  }, []);

  const startListening = useCallback(() => {
    const ctor = getSpeechRecognition();
    if (!ctor) {
      Alert.alert(
        'Voice search unavailable',
        'Voice search is supported in the Chrome, Edge, and Safari browsers on desktop and mobile web.',
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      const recognition = new ctor();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setListening(false);
        if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
          Alert.alert('Voice search error', 'Could not capture audio. Check microphone permissions.');
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      Alert.alert('Voice search error', 'Could not start voice recognition.');
    }
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening };
}
