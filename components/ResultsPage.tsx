import React, { useState, useEffect, useRef } from 'react';
import { AnimalResult, OwnerData, Confidence, ChatMessage, Registration } from '../types';
import { Icon } from './icons';
import { startChat, sendMessageToChat } from '../services/geminiService';

interface ResultsPageProps {
  results: AnimalResult[];
  owner: OwnerData;
  onFinish: () => void;
  registration: Registration | null;
  onViewReport: (registration: Registration) => void;
}

const ConfidenceBadge: React.FC<{ level: Confidence }> = ({ level }) => {
  const styles = {
    High: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-red-100 text-red-800 border-red-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium border ${styles[level]}`}>{level} Confidence</span>;
};

const ExplorePromptButton: React.FC<{ iconName: 'syringe' | 'building-library' | 'light-bulb', text: string, onClick: () => void, disabled: boolean }> = ({ iconName, text, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 text-left p-3 bg-cream-50 hover:bg-cream-100 border border-cream-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
        <div className="p-2 bg-secondary-100 rounded-md">
            <Icon name={iconName} className="w-5 h-5 text-secondary-700" />
        </div>
        <span className="flex-grow font-semibold text-primary-800 text-sm">{text}</span>
        <Icon name="chevron-right" className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1" />
    </button>
);

const AnimalResultCardWithChat: React.FC<{ animal: AnimalResult; index: number }> = ({ animal, index }) => {
  const [activeChat, setActiveChat] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animal.aiResult.error) {
      startChat(animal.aiResult.breedName);
      setActiveChat([{ role: 'model', parts: [{ text: `Hello! I can answer questions about the ${animal.aiResult.breedName} breed. How can I help?` }] }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal.aiResult.breedName, animal.aiResult.error, animal.id]); // Added animal.id to re-trigger effect on tab change

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const newHistory: ChatMessage[] = [...activeChat, { role: 'user', parts: [{ text: message }] }];
    setActiveChat(newHistory);
    setIsLoading(true);

    if (message === userInput) {
      setUserInput('');
    }

    const response = await sendMessageToChat(message);

    setActiveChat([...newHistory, { role: 'model', parts: [{ text: response }] }]);
    setIsLoading(false);
  };
  
  const handleExploreClick = (topic: 'vaccinations' | 'schemes' | 'benefits') => {
    const breedName = animal.aiResult.breedName;
    const species = animal.species.toLowerCase();
    let prompt = '';
    switch (topic) {
        case 'vaccinations':
            prompt = `What are the recommended vaccinations for a ${breedName} ${species}? Please provide a typical schedule.`;
            break;
        case 'schemes':
            prompt = `List some government schemes that might apply to an owner of a ${breedName} ${species} in India.`;
            break;
        case 'benefits':
            prompt = `What are the key benefits, characteristics, and care tips for the ${breedName} breed?`;
            break;
    }
    handleSendMessage(prompt);
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
      <h2 className="text-xl font-bold text-primary-900 mb-4">Result for Animal #{index + 1} ({animal.species})</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4 overflow-hidden rounded-lg aspect-video">
            <img src={animal.photos[0].previewUrl} alt="Analyzed animal" className="w-full h-full object-cover" />
          </div>
          {animal.aiResult.error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-bold text-red-800">Analysis Failed</h3>
              <p className="text-red-700 mt-1">{animal.aiResult.error}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-primary-800">{animal.aiResult.breedName}</h3>
                  <ConfidenceBadge level={animal.aiResult.confidence} />
                </div>
                <ResultDetail label="AI Reasoning" content={animal.aiResult.reasoning} />
                <ResultDetail label="Milk Yield Potential" content={animal.aiResult.milkYieldPotential} />
                <ResultDetail label="General Care Notes" content={animal.aiResult.careNotes} />
              </div>

              <div className="pt-6 mt-6 border-t border-cream-200">
                <h4 className="font-semibold text-primary-800 mb-3">Explore Further with AI:</h4>
                <div className="space-y-2">
                  <ExplorePromptButton
                      iconName="syringe"
                      text="Recommended Vaccinations"
                      onClick={() => handleExploreClick('vaccinations')}
                      disabled={isLoading}
                  />
                  <ExplorePromptButton
                      iconName="building-library"
                      text="Applicable Govt. Schemes"
                      onClick={() => handleExploreClick('schemes')}
                      disabled={isLoading}
                  />
                  <ExplorePromptButton
                      iconName="light-bulb"
                      text="Breed Benefits & Tips"
                      onClick={() => handleExploreClick('benefits')}
                      disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        {!animal.aiResult.error && (
          <div className="flex flex-col bg-cream-50 rounded-lg border border-secondary-200 min-h-[400px]">
            <div className="p-3 border-b border-secondary-200 bg-secondary-100 rounded-t-lg">
              <h4 className="font-bold text-secondary-900 flex items-center gap-2"><Icon name="chat-bubble" className="w-5 h-5"/>Ask about {animal.aiResult.breedName}</h4>
            </div>
            <div className="flex-grow p-4 space-y-4 h-64 overflow-y-auto">
              {activeChat.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-secondary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>}
                  <div className={`p-3 rounded-2xl max-w-xs text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent-500 text-white rounded-br-none' : 'bg-white text-primary-900 rounded-bl-none'}`}>
                     {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                   <div className="w-8 h-8 rounded-full bg-secondary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>
                   <div className="p-3 rounded-2xl bg-white text-gray-500 text-sm rounded-bl-none shadow-sm">Thinking...</div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-secondary-200 flex bg-secondary-50">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                placeholder="Ask a question..."
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-secondary-500 focus:border-secondary-500 bg-white text-gray-900"
                disabled={isLoading}
              />
              <button onClick={() => handleSendMessage(userInput)} disabled={isLoading} className="p-2 bg-secondary-600 text-white rounded-r-md hover:bg-secondary-700 disabled:bg-gray-400 transition-transform duration-150 active:scale-95">
                <Icon name="send" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export const ResultsPage: React.FC<ResultsPageProps> = ({ results, owner, onFinish, registration, onViewReport }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeAnimalIndex, setActiveAnimalIndex] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center bg-white p-8 rounded-xl border border-cream-200">
        <div className={`transition-all duration-500 ease-out transform ${isMounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <Icon name="check" className="w-16 h-16 mx-auto text-accent-600 bg-accent-100 rounded-full p-3" />
        </div>
        <h1 className="text-3xl font-bold mt-4 text-primary-900">AI Analysis Complete</h1>
        <p className="text-primary-700 mt-2">Registration for owner <span className="font-semibold text-primary-900">{owner.name}</span> has been successfully created.</p>
      </div>

      {/* Tabs for multiple animals */}
      {results.length > 1 && (
        <div className="border-b border-cream-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {results.map((animal, index) => (
              <button
                key={animal.id}
                onClick={() => setActiveAnimalIndex(index)}
                className={`
                  ${index === activeAnimalIndex
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all
                `}
              >
                Animal #{index + 1} - {animal.aiResult.error ? 'Analysis Failed' : animal.aiResult.breedName}
              </button>
            ))}
          </nav>
        </div>
      )}

      {results.length > 0 && (
         <div 
            key={results[activeAnimalIndex].id} // Add key to force re-mount of child component on tab change
            className={`transition-all duration-500 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <AnimalResultCardWithChat animal={results[activeAnimalIndex]} index={activeAnimalIndex} />
          </div>
      )}


      <div className="text-center mt-10 flex justify-center items-center gap-4">
        <button 
          onClick={onFinish} 
          className="px-8 py-3 border border-gray-300 text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-transform duration-150 active:scale-95"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => registration && onViewReport(registration)} 
          disabled={!registration}
          className="px-8 py-3 bg-accent-500 text-white font-semibold rounded-lg shadow-md hover:bg-accent-600 transition-transform duration-150 active:scale-95 disabled:bg-accent-300"
        >
          View Official Report
        </button>
      </div>
    </div>
  );
};

const ResultDetail: React.FC<{label: string, content: string}> = ({label, content}) => (
    <div>
        <h4 className="font-semibold text-primary-800">{label}</h4>
        <p className="text-primary-900">{content}</p>
    </div>
);