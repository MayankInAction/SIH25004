import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Registration, ChatMessage, BreedInfo } from '../types';
import { startGeneralChat, sendMessageToGeneralChat } from '../services/geminiService';
import { ANNOUNCEMENTS, ALL_BREEDS } from '../constants';
import { UpdateRecordModal } from './UpdateRecordModal';


const GeneralChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startGeneralChat();
    setMessages([{ role: 'model', parts: [{ text: "Hello! I am पशुHelper. How can I assist you with cattle or buffalo breeds today?" }] }]);
  }, []);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', parts: [{ text: userInput }] }];
    setMessages(newMessages);
    setIsLoading(true);
    setUserInput('');

    const response = await sendMessageToGeneralChat(userInput);
    
    setMessages([...newMessages, { role: 'model', parts: [{ text: response }] }]);
    setIsLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-accent-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-accent-600 transition-transform hover:scale-110 active:scale-100 z-50"
        aria-label="Open AI Assistant"
      >
        <Icon name={isOpen ? 'close' : 'help-circle'} className="w-8 h-8"/>
      </button>

      <div className={`fixed bottom-24 right-6 w-full max-w-sm bg-cream-50 rounded-2xl shadow-2xl border border-cream-200 transition-all duration-300 ease-in-out z-40 origin-bottom-right ${isOpen ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0 pointer-events-none'}`}>
        <div className="p-4 border-b border-cream-200 bg-white text-primary-900 rounded-t-2xl flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="ai-sparkles" className="w-6 h-6 text-accent-500"/> AI Assistant: पशुHelper</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" className="w-5 h-5"/></button>
        </div>
        <div className="flex-grow p-4 h-96 overflow-y-auto space-y-4 bg-cream-100">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>}
              <div className={`p-3 rounded-2xl max-w-xs text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent-500 text-white rounded-br-none' : 'bg-white text-primary-900 rounded-bl-none'}`}>
                {msg.parts[0].text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
               <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>
              <div className="p-3 rounded-2xl bg-white text-gray-500 text-sm rounded-bl-none shadow-sm">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t border-cream-200 flex bg-white rounded-b-2xl">
          <input 
            type="text" 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about breeds..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900"
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading} className="px-4 bg-accent-500 text-white rounded-r-md hover:bg-accent-600 disabled:bg-gray-400 flex items-center justify-center transition-transform active:scale-95">
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

const BreedLearningHubModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBreed, setSelectedBreed] = useState<BreedInfo | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const filteredBreeds = useMemo(() => {
        if (!searchTerm) return ALL_BREEDS;
        return ALL_BREEDS.filter(breed =>
            breed.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);
    
    useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      if (isOpen) {
        document.addEventListener('keydown', handleEsc);
        modalRef.current?.focus();
      }
      return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} tabIndex={-1} className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cream-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                        <Icon name="book-open" className="w-6 h-6 text-accent-600"/> Breed Learning Hub
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-200">
                        <Icon name="close" className="w-6 h-6 text-gray-500"/>
                    </button>
                </div>
                <div className="p-4">
                     <div className="relative">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input
                            type="text"
                            placeholder={`Search ${ALL_BREEDS.length} recognized breeds...`}
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setSelectedBreed(null); }}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-accent-500 focus:border-accent-500"
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="overflow-y-auto border border-cream-200 rounded-lg bg-white max-h-[55vh]">
                       <ul className="divide-y divide-cream-200">
                           {filteredBreeds.length > 0 ? filteredBreeds.map(breed => (
                               <li key={breed.name}>
                                   <button onClick={() => setSelectedBreed(breed)} className={`w-full text-left p-3 hover:bg-cream-100 ${selectedBreed?.name === breed.name ? 'bg-accent-100' : ''}`}>
                                        <p className="font-semibold text-primary-800">{breed.name}</p>
                                        <p className="text-sm text-secondary-700">{breed.species}</p>
                                   </button>
                               </li>
                           )) : (
                               <li className="p-4 text-center text-gray-500">No breeds found.</li>
                           )}
                       </ul>
                    </div>
                    <div className="overflow-y-auto border border-cream-200 rounded-lg bg-white p-4 max-h-[55vh]">
                        {selectedBreed ? (
                            <div>
                                <h3 className="text-lg font-bold text-primary-900">{selectedBreed.name}</h3>
                                <p className="text-sm font-semibold text-accent-600 mb-2">{selectedBreed.species}</p>
                                <p className="text-secondary-800 whitespace-pre-wrap">{selectedBreed.facts}</p>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                 <Icon name="book-open" className="w-12 h-12 text-gray-400 mb-2"/>
                                 <p>Select a breed from the left to view its facts.</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactElement}> = ({title, value, icon}) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200 flex items-center">
        <div className="p-3 rounded-full bg-primary-100 text-primary-700 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-secondary-700">{title}</p>
            <p className="text-2xl font-bold text-primary-900">{value}</p>
        </div>
    </div>
);

const QuickActionCard: React.FC<{ title: string; description: string; icon: 'ai-sparkles' | 'history' | 'chart' | 'pencil-square'; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg border border-cream-200 transition-all duration-300 ease-out hover:-translate-y-1 text-left w-full flex flex-col group"
    >
      <div className="flex-grow">
        <div className="p-3 bg-accent-100 rounded-lg mr-4 w-12 h-12 mb-4">
            <Icon name={icon} className="w-6 h-6 text-accent-600" />
        </div>
        <h2 className="text-lg font-bold text-primary-900">{title}</h2>
        <p className="text-secondary-700 text-sm mt-1">{description}</p>
      </div>
       <div className="mt-4 text-accent-600 font-bold flex items-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Go <Icon name="chevron-right" className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
);

const RegistrationCarouselItem: React.FC<{registration: Registration, onClick: () => void}> = ({registration, onClick}) => {
    const firstAnimal = registration.animals[0];
    const hasError = firstAnimal?.aiResult?.error;
    const status = hasError ? 'Failed' : 'Approved';
    const statusColor = hasError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

    return (
        <button onClick={onClick} className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-cream-200 p-3 text-left hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="w-full h-32 bg-cream-100 rounded-lg overflow-hidden mb-3">
                 <img src={firstAnimal?.photos[0]?.previewUrl} alt="Animal" className="w-full h-full object-cover"/>
            </div>
            <p className="font-bold text-primary-900 truncate">{firstAnimal?.aiResult?.breedName || 'Unknown Breed'}</p>
            <p className="text-sm text-secondary-700 truncate">{registration.owner.name}</p>
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{new Date(registration.timestamp).toLocaleDateString()}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>{status}</span>
            </div>
        </button>
    );
};


export const Dashboard: React.FC<{
  onNavigate: (view: 'REGISTRATION' | 'HISTORY' | 'ANALYTICS') => void;
  onViewRegistration: (registration: Registration) => void;
  onEditRegistration: (registration: Registration) => void;
}> = ({ onNavigate, onViewRegistration, onEditRegistration }) => {
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const [isLearningHubOpen, setIsLearningHubOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { totalAnimals, mostCommonBreed } = useMemo(() => {
    const breedCounts: { [key:string]: number } = {};
    let animalCount = 0;
    
    registrations.forEach(reg => {
      animalCount += reg.animals.length;
      reg.animals.forEach(animal => {
        if (!animal.aiResult.error) {
          const breedName = animal.aiResult.breedName;
          breedCounts[breedName] = (breedCounts[breedName] || 0) + 1;
        }
      });
    });

    const sortedBreeds = Object.entries(breedCounts).sort((a, b) => b[1] - a[1]);
    
    return {
        totalAnimals: animalCount,
        mostCommonBreed: sortedBreeds[0]?.[0] || 'N/A'
    };
  }, [registrations]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Welcome to पशुVision</h1>
        <p className="text-secondary-700 mt-1">Your AI-powered assistant for accurate livestock management.</p>
      </div>

      {/* At-a-glance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Animals Registered" value={totalAnimals} icon={<Icon name="cow" className="w-6 h-6" />} />
          <StatCard title="Total Registrations" value={registrations.length} icon={<Icon name="history" className="w-6 h-6" />} />
          <StatCard title="Most Common Breed" value={mostCommonBreed} icon={<Icon name="ai-sparkles" className="w-6 h-6" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard title="New Registration" description="Start a new entry." icon="ai-sparkles" onClick={() => onNavigate('REGISTRATION')} />
        <QuickActionCard title="Registration History" description="Review past reports." icon="history" onClick={() => onNavigate('HISTORY')} />
        <QuickActionCard title="Analytics" description="View breed trends." icon="chart" onClick={() => onNavigate('ANALYTICS')} />
        <QuickActionCard title="Update Record" description="Find & edit a registration." icon="pencil-square" onClick={() => setIsUpdateModalOpen(true)} />
      </div>
      
      {/* Recent Registrations Carousel */}
       <div>
        <h3 className="text-xl font-bold text-primary-900 mb-4">Recent Registrations</h3>
         {registrations.length > 0 ? (
            <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4">
              {registrations
                .slice()
                .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((reg) => (
                  <RegistrationCarouselItem key={reg.id} registration={reg} onClick={() => onViewRegistration(reg)} />
              ))}
            </div>
         ) : (
            <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-cream-200">
                <p className="text-secondary-700">No registrations yet — Start one to see it appear here! 🐮</p>
            </div>
         )}
      </div>

      {/* What's New & Learning Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><Icon name="megaphone" className="w-5 h-5 text-accent-600"/>Announcements</h3>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map(ann => (
                  <div key={ann.id}>
                    <h4 className="font-semibold text-primary-800">{ann.title}</h4>
                    <p className="text-sm text-secondary-700">{ann.content} <a href="#" className="text-accent-600 font-semibold hover:underline">{ann.linkText}</a></p>
                  </div>
              ))}
            </div>
          </div>
          <button onClick={() => setIsLearningHubOpen(true)} className="bg-white p-6 rounded-xl shadow-sm border border-cream-200 text-left hover:shadow-lg transition-shadow hover:-translate-y-1">
            <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><Icon name="book-open" className="w-5 h-5 text-accent-600"/>Breed Learning Hub</h3>
            <p className="text-sm text-secondary-700">Explore facts and information about all 74 officially recognized breeds of cattle and buffalo in India. Use the search to quickly find a specific breed.</p>
             <div className="mt-4 text-accent-600 font-bold flex items-center text-sm">
                Open Hub <Icon name="chevron-right" className="w-4 h-4 ml-1" />
            </div>
          </button>
      </div>
      
      <GeneralChatbot />
      <BreedLearningHubModal isOpen={isLearningHubOpen} onClose={() => setIsLearningHubOpen(false)} />
      <UpdateRecordModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        onEditRegistration={onEditRegistration}
      />
    </div>
  );
};