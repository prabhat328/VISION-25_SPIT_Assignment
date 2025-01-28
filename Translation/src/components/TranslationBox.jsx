import React from 'react';
import { FaMicrophone, FaVolumeUp, FaCopy } from 'react-icons/fa';

const TranslationBox = ({ 
  text, 
  placeholder, 
  onChange, 
  language, 
  onLanguageChange,
  isSource,
  onStartRecording,
  onPlayAudio,
  onCopy
}) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ];

  return (
    <div className="w-full">
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full mb-2 p-2 rounded border border-gray-300 bg-white"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-40 p-4 rounded border border-gray-300 resize-none"
        />
        
        <div className="absolute bottom-2 right-2 flex gap-2">
          {isSource && (
            <button
              onClick={onStartRecording}
              className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              <FaMicrophone />
            </button>
          )}
          
          <button
            onClick={onPlayAudio}
            className="p-2 rounded bg-green-500 text-white hover:bg-green-600"
          >
            <FaVolumeUp />
          </button>
          
          <button
            onClick={onCopy}
            className="p-2 rounded bg-gray-500 text-white hover:bg-gray-600"
          >
            <FaCopy />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationBox;