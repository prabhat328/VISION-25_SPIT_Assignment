import { useState, useEffect } from "react";
import axios from "axios";
import TranslationBox from "./components/TranslationBox";

function App() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const translateText = async () => {
    if (!sourceText) return;

    const encodedParams = new URLSearchParams();
    encodedParams.append("source_language", sourceLanguage);
    encodedParams.append("target_language", targetLanguage);
    encodedParams.append("text", sourceText);

    try {
      const response = await axios.post(
        "https://text-translator2.p.rapidapi.com/translate",
        encodedParams,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-RapidAPI-Key":
              "73b545d31emsh2f9fd043de82084p1db691jsn5e0b9b2be49b",
            "X-RapidAPI-Host": "text-translator2.p.rapidapi.com",
          },
        }
      );

      if (response.data && response.data.data) {
        setTranslatedText(response.data.data.translatedText);
      } else {
        setError("Failed to fetch the translated text");
        setTranslatedText("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Translation failed"
      );
      setTranslatedText("");
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      translateText();
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [sourceText, targetLanguage]);

  const startRecording = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = sourceLanguage;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
      };

      recognition.start();
    } else {
      setError("Speech recognition is not supported in this browser.");
    }
  };

  const playAudio = async (text, language) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setError("Text-to-speech failed. Please try again.");
    }
  };

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (error) {
      setError("Failed to copy text. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-white mb-10 drop-shadow-lg">
          🌍 Multi-Language Translator
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TranslationBox
              text={sourceText}
              placeholder="Enter text to translate..."
              onChange={setSourceText}
              language={sourceLanguage}
              onLanguageChange={setSourceLanguage}
              isSource={true}
              onStartRecording={startRecording}
              onPlayAudio={() => playAudio(sourceText, sourceLanguage)}
              onCopy={() => copyToClipboard(sourceText)}
            />

            <TranslationBox
              text={translatedText}
              placeholder="Translation will appear here..."
              onChange={setTranslatedText}
              language={targetLanguage}
              onLanguageChange={setTargetLanguage}
              isSource={false}
              onPlayAudio={() => playAudio(translatedText, targetLanguage)}
              onCopy={() => copyToClipboard(translatedText)}
            />
          </div>

          <div className="text-center">
            <button
              onClick={translateText}
              className="px-6 py-3 bg-gradient-to-r from-green-400 to-teal-500 text-white text-lg font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200"
            >
              Translate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
