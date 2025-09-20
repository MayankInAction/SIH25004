import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icon } from './icons';
import { Registration, ChatMessage, BreedInfo } from '../types';
import { startGeneralChat, sendMessageToGeneralChat, getBreedFacts } from '../services/geminiService';
import { ALL_BREEDS } from '../constants';
import { UpdateRecordModal } from './UpdateRecordModal';
import { useLanguage } from '../contexts/LanguageContext';


const GeneralChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    startGeneralChat();
    setMessages([{ role: 'model', parts: [{ text: t('dashboard.chatbot.greeting') }] }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-secondary-600 text-white shadow-lg flex items-center justify-center hover:bg-secondary-700 transition-all duration-300 ease-in-out z-50
          ${isOpen ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-full' : 'w-auto h-12 sm:h-14 px-4 sm:px-6 rounded-full'}`}
        aria-label={isOpen ? t('dashboard.chatbot.closeAssistant') : t('dashboard.chatbot.openAssistant')}
      >
        {isOpen ? (
           <Icon name="close" className="w-7 h-7 sm:w-8 sm:h-8"/>
        ) : (
          <div className="flex items-center gap-2">
            <Icon name="chat-bubble" className="w-5 h-5 sm:w-6 sm:h-6"/>
            <span className="font-semibold text-sm sm:text-base whitespace-nowrap">{t('dashboard.chatbot.aiAssistant')}</span>
          </div>
        )}
      </button>

      <div className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] max-w-sm bg-cream-50 rounded-2xl shadow-2xl border border-cream-200 transition-all duration-300 ease-in-out z-40 origin-bottom-right ${isOpen ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0 pointer-events-none'}`}>
        <div className="p-4 border-b border-secondary-300 bg-secondary-700 text-white rounded-t-2xl flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="ai-sparkles" className="w-6 h-6 text-white"/> {t('dashboard.chatbot.title')}</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white"><Icon name="close" className="w-5 h-5"/></button>
        </div>
        <div className="flex-grow p-4 h-96 overflow-y-auto space-y-4 bg-cream-100">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-secondary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>}
              <div className={`p-3 rounded-2xl max-w-xs text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent-500 text-white rounded-br-none' : 'bg-white text-primary-900 rounded-bl-none'}`}>
                {msg.parts[0].text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
               <div className="w-8 h-8 rounded-full bg-secondary-800 flex items-center justify-center text-white text-lg flex-shrink-0">🐮</div>
              <div className="p-3 rounded-2xl bg-white text-gray-500 text-sm rounded-bl-none shadow-sm">{t('generic.thinking')}</div>
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
            placeholder={t('dashboard.chatbot.placeholder')}
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-secondary-500 focus:border-secondary-500 bg-white text-gray-900"
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading} className="px-4 bg-secondary-600 text-white rounded-r-md hover:bg-secondary-700 disabled:bg-gray-400 flex items-center justify-center transition-transform active:scale-95">
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

const BreedLearningHubModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [breeds, setBreeds] = useState<BreedInfo[]>(ALL_BREEDS);
    const [selectedBreed, setSelectedBreed] = useState<BreedInfo | null>(null);
    const [isLoadingFacts, setIsLoadingFacts] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();
    const defaultFactText = 'Detailed facts for this breed are being compiled and will be available soon.';

    const filteredBreeds = useMemo(() => {
        if (!searchTerm) return breeds;
        return breeds.filter(breed =>
            breed.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, breeds]);

    const handleSelectBreed = async (breed: BreedInfo) => {
        setSelectedBreed(breed);
        if (breed.facts === defaultFactText) {
            setIsLoadingFacts(true);
            try {
                const result = await getBreedFacts(breed.name, breed.species);
                if (!result.error) {
                    const updatedBreed = { ...breed, facts: result.facts, sources: result.sources };
                    setSelectedBreed(updatedBreed);
                    // Update the main list to cache the result
                    setBreeds(prevBreeds =>
                        prevBreeds.map(b => b.name === breed.name ? updatedBreed : b)
                    );
                } else {
                    setSelectedBreed({ ...breed, facts: result.facts });
                }
            } finally {
                setIsLoadingFacts(false);
            }
        }
    };
    
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
                        <Icon name="book-open" className="w-6 h-6 text-accent-yellow-600"/> {t('dashboard.hub.title')}
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
                            placeholder={t('dashboard.hub.searchPlaceholder', { count: ALL_BREEDS.length })}
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setSelectedBreed(null); }}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-accent-yellow-500 focus:border-accent-yellow-500"
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="overflow-y-auto border border-cream-200 rounded-lg bg-white max-h-[55vh]">
                       <ul className="divide-y divide-cream-200">
                           {filteredBreeds.length > 0 ? filteredBreeds.map(breed => (
                               <li key={breed.name}>
                                   <button onClick={() => handleSelectBreed(breed)} className={`w-full text-left p-3 hover:bg-cream-100 ${selectedBreed?.name === breed.name ? 'bg-accent-yellow-100' : ''}`}>
                                        <p className="font-semibold text-primary-800">{breed.name}</p>
                                        <p className="text-sm text-primary-700">{t(`species.${breed.species.toLowerCase()}`)}</p>
                                   </button>
                               </li>
                           )) : (
                               <li className="p-4 text-center text-gray-500">{t('dashboard.hub.noBreeds')}</li>
                           )}
                       </ul>
                    </div>
                    <div className="overflow-y-auto border border-cream-200 rounded-lg bg-white p-4 max-h-[55vh]">
                       {isLoadingFacts ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <Icon name="ai-sparkles" className="w-12 h-12 text-gray-400 animate-pulse mb-2"/>
                                <p className="font-semibold">{t('dashboard.hub.fetching')}</p>
                                <p className="text-sm">{t('dashboard.hub.wait')}</p>
                            </div>
                        ) : selectedBreed ? (
                            <div>
                                <h3 className="text-lg font-bold text-primary-900">{selectedBreed.name}</h3>
                                <p className="text-sm font-semibold text-accent-yellow-600 mb-2">{t(`species.${selectedBreed.species.toLowerCase()}`)}</p>
                                <p className="text-primary-800 whitespace-pre-wrap">{selectedBreed.facts}</p>
                                {selectedBreed.sources && selectedBreed.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-cream-200">
                                        <h4 className="text-sm font-bold text-primary-800 mb-2">{t('dashboard.hub.sources')}:</h4>
                                        <ul className="space-y-1 list-disc list-inside">
                                            {selectedBreed.sources.map((source, index) => (
                                                <li key={index} className="text-sm text-secondary-700 hover:text-secondary-600 truncate">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline" title={source.title}>
                                                        {source.title || new URL(source.uri).hostname}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                 <Icon name="book-open" className="w-12 h-12 text-gray-400 mb-2"/>
                                 <p>{t('dashboard.hub.selectBreed')}</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactElement}> = ({title, value, icon}) => {
    const isNumber = typeof value === 'number';
    // Initialize with 0 for numbers to start animation from, or the string value itself.
    const [displayValue, setDisplayValue] = useState(isNumber ? 0 : value);

    useEffect(() => {
        if (!isNumber) {
            // If the value is not a number, just update it directly.
            setDisplayValue(value);
            return;
        }

        const endValue = value as number;
        const duration = 1000; // 1 second animation
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) {
                startTime = timestamp;
            }
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentNumber = Math.floor(progress * endValue);
            
            setDisplayValue(currentNumber);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [value, isNumber]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200 flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-700 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-primary-700">{title}</p>
                {/* Use tabular-nums to prevent layout shift during animation */}
                <p className="text-2xl font-bold text-primary-900 tabular-nums">{displayValue}</p>
            </div>
        </div>
    );
};

const ActivityStatCard: React.FC<{period: string, count: number, iconName: 'calendar-days' | 'calendar-week' | 'calendar'}> = ({period, count, iconName}) => {
    const [displayCount, setDisplayCount] = useState(0);
    const { t } = useLanguage();

    useEffect(() => {
        const endValue = count;
        const duration = 1000; // 1 second animation
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) {
                startTime = timestamp;
            }
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentNumber = Math.floor(progress * endValue);
            
            setDisplayCount(currentNumber);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [count]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200 flex items-start">
            <div className="p-3 rounded-lg bg-secondary-100 text-secondary-700 mr-4">
                <Icon name={iconName} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-primary-700">{period}</p>
                <p className="text-3xl font-bold text-primary-900 tabular-nums">{displayCount}</p>
                <p className="text-xs text-primary-600 -mt-1">{t('dashboard.regs')}</p>
            </div>
        </div>
    );
};


const QuickActionCard: React.FC<{ title: string; description: string; iconName: 'ai-sparkles' | 'history' | 'chart' | 'pencil-square' | 'light-bulb'; onClick: () => void; accent: 'green' | 'teal' | 'yellow' | 'green-dark' }> = ({ title, description, iconName, onClick, accent }) => {
    const { t } = useLanguage();
    const accents = {
        green: 'bg-accent-100 text-accent-700',
        teal: 'bg-secondary-100 text-secondary-700',
        yellow: 'bg-accent-yellow-100 text-accent-yellow-700',
        'green-dark': 'bg-primary-100 text-primary-700',
    };
    const accentColors = {
        green: 'text-accent-600',
        teal: 'text-secondary-600',
        yellow: 'text-accent-yellow-600',
        'green-dark': 'text-primary-600',
    };
    return (
        <button
          onClick={onClick}
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg border border-cream-200 transition-all duration-300 ease-out hover:-translate-y-1 text-left w-full flex flex-col group"
        >
          <div className="flex-grow">
            <div className={`p-3 rounded-lg mr-4 w-12 h-12 mb-4 ${accents[accent]}`}>
                <Icon name={iconName} className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-primary-900">{title}</h2>
            <p className="text-primary-700 text-sm mt-1">{description}</p>
          </div>
           <div className={`mt-4 ${accentColors[accent]} font-bold flex items-center text-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
            {t('dashboard.go')} <Icon name="chevron-right" className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
    );
};

const RegistrationCarouselItem: React.FC<{registration: Registration, onClick: () => void}> = ({registration, onClick}) => {
    const { t } = useLanguage();
    const firstAnimal = registration.animals[0];
    const hasError = firstAnimal?.aiResult?.error;
    const status = hasError ? t('status.failed') : t('status.approved');
    const statusColor = hasError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

    return (
        <button onClick={onClick} className="flex-shrink-0 w-60 sm:w-64 bg-white rounded-xl shadow-sm border border-cream-200 p-3 text-left hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="w-full h-32 bg-cream-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                 {firstAnimal?.photos?.[0]?.previewUrl ? (
                    <img src={firstAnimal.photos[0].previewUrl} alt="Animal" className="w-full h-full object-cover"/>
                 ) : (
                    <Icon name="cow" className="w-16 h-16 text-gray-400" />
                 )}
            </div>
            <p className="font-bold text-primary-900 truncate">{firstAnimal?.aiResult?.breedName || t('generic.unknownBreed')}</p>
            <p className="text-sm text-primary-700 truncate">{registration.owner.name}</p>
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{new Date(registration.timestamp).toLocaleDateString()}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>{status}</span>
            </div>
        </button>
    );
};


export const Dashboard: React.FC<{
  registrations: Registration[];
  onNavigate: (view: 'REGISTRATION' | 'HISTORY' | 'ANALYTICS' | 'QUICK_ID') => void;
  onViewRegistration: (registration: Registration) => void;
  onEditRegistration: (registration: Registration) => void;
}> = ({ registrations, onNavigate, onViewRegistration, onEditRegistration }) => {
  const [isLearningHubOpen, setIsLearningHubOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const headers = [
        'Registration ID', 'Timestamp', 'Owner Name', 'Owner Mobile', 'Owner ID Type', 'Owner ID Number', 'Owner State', 'Owner District', 'Owner Village',
        'Animal UID', 'Species', 'Sex', 'Age', 'Breed Name', 'Confidence', 'AI Analysis Status', 'AI Reasoning', 'Milk Yield Potential', 'Care Notes', 'AI Error'
    ];

    const escapeCSV = (value: any) => {
        const str = String(value ?? '');
        if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = registrations.flatMap(reg => 
        reg.animals.map(animal => [
            reg.id,
            reg.timestamp,
            reg.owner.name,
            reg.owner.mobile,
            reg.owner.idType,
            reg.owner.idNumber,
            reg.owner.state,
            reg.owner.district,
            reg.owner.village,
            animal.id,
            animal.species,
            animal.sex,
            `${animal.ageValue} ${animal.ageUnit}`,
            animal.aiResult.breedName,
            animal.aiResult.confidence,
            animal.aiResult.error ? 'Failed' : 'Success',
            animal.aiResult.reasoning,
            animal.aiResult.milkYieldPotential,
            animal.aiResult.careNotes,
            animal.aiResult.error || ''
        ].map(escapeCSV).join(','))
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "pashuvision_registrations.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { totalAnimals, mostCommonBreed, sortedRegistrations } = useMemo(() => {
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
        mostCommonBreed: sortedBreeds[0]?.[0] || 'N/A',
        sortedRegistrations: registrations.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  }, [registrations]);
  
  const recentUserRegistrations = useMemo(() => 
    sortedRegistrations.filter(reg => !reg.isSample), 
  [sortedRegistrations]);
  
  const activityStats = useMemo(() => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      startOfWeek.setHours(0,0,0,0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      registrations.forEach(reg => {
          const regDate = new Date(reg.timestamp);
          if (regDate >= startOfToday) {
              todayCount++;
          }
          if (regDate >= startOfWeek) {
              weekCount++;
          }
          if (regDate >= startOfMonth) {
              monthCount++;
          }
      });

      return { todayCount, weekCount, monthCount };
  }, [registrations]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
       <div className="relative bg-gradient-to-br from-primary-900 to-primary-800 text-white p-6 sm:p-8 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute -top-10 -right-10 text-primary-700 opacity-20">
            <span className="text-9xl">🐮</span>
        </div>
        <div className={`transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {language === 'hi' ? (
              <>
                <span className="text-accent-400">पशुVision</span>{t('dashboard.welcome')}
              </>
            ) : (
              <>
                {t('dashboard.welcome')} <span className="text-accent-400">पशुVision</span>
              </>
            )}
          </h1>
        </div>
        <div className={`transition-all duration-700 ease-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-primary-200 mt-2 text-base sm:text-lg">
            {t('dashboard.welcomeSub')}
          </p>
        </div>
        <div className={`transition-all duration-700 ease-out delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm text-primary-300 mt-4 pt-4 border-t border-primary-700/50">
            {t('dashboard.ministry')}
          </p>
        </div>
      </div>


      {/* At-a-glance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard title={t('dashboard.totalAnimals')} value={totalAnimals} icon={<Icon name="cow" className="w-6 h-6" />} />
          <StatCard title={t('dashboard.totalRegs')} value={registrations.length} icon={<Icon name="history" className="w-6 h-6" />} />
          <StatCard title={t('dashboard.commonBreed')} value={mostCommonBreed} icon={<Icon name="ai-sparkles" className="w-6 h-6" />} />
      </div>

      {/* Registration Activity */}
      <div>
        <h3 className="text-xl font-bold text-primary-900 mb-4">{t('dashboard.recentActivity')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <ActivityStatCard period={t('dashboard.today')} count={activityStats.todayCount} iconName="calendar-days" />
            <ActivityStatCard period={t('dashboard.thisWeek')} count={activityStats.weekCount} iconName="calendar-week" />
            <ActivityStatCard period={t('dashboard.thisMonth')} count={activityStats.monthCount} iconName="calendar" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <QuickActionCard title={t('dashboard.actions.newReg')} description={t('dashboard.actions.newRegDesc')} iconName="ai-sparkles" accent="green" onClick={() => onNavigate('REGISTRATION')} />
        <QuickActionCard title={t('dashboard.actions.quickId')} description={t('dashboard.actions.quickIdDesc')} iconName="light-bulb" accent="teal" onClick={() => onNavigate('QUICK_ID')} />
        <QuickActionCard title={t('dashboard.actions.update')} description={t('dashboard.actions.updateDesc')} iconName="pencil-square" accent="yellow" onClick={() => setIsUpdateModalOpen(true)} />
        <QuickActionCard title={t('dashboard.actions.analytics')} description={t('dashboard.actions.analyticsDesc')} iconName="chart" accent="green-dark" onClick={() => onNavigate('ANALYTICS')} />
        <QuickActionCard title={t('dashboard.actions.history')} description={t('dashboard.actions.historyDesc')} iconName="history" accent="green-dark" onClick={() => onNavigate('HISTORY')} />
      </div>
      
      {/* Recent Registrations Carousel */}
       <div>
        <h3 className="text-xl font-bold text-primary-900 mb-4">{t('dashboard.recentRegs')}</h3>
         {recentUserRegistrations.length > 0 ? (
            <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4">
              {recentUserRegistrations.map((reg) => (
                  <RegistrationCarouselItem key={reg.id} registration={reg} onClick={() => onViewRegistration(reg)} />
              ))}
            </div>
         ) : (
            <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-cream-200">
                <p className="text-primary-700">{t('dashboard.noNewRegs')}</p>
            </div>
         )}
      </div>
      
      {/* Registration Database Table */}
      <div>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-primary-900">{t('dashboard.regDb')}</h3>
              <button onClick={handleExportCSV} disabled={registrations.length === 0} className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-md text-sm font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors">
                  <Icon name="upload" className="w-4 h-4" />
                  {t('dashboard.export')}
              </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[450px]">
                  <table className="w-full text-sm text-left text-primary-800">
                      <thead className="text-xs text-primary-700 uppercase bg-cream-100 sticky top-0 z-10">
                          <tr>
                              <th scope="col" className="px-6 py-3">{t('dashboard.table.date')}</th>
                              <th scope="col" className="px-6 py-3">{t('dashboard.table.owner')}</th>
                              <th scope="col" className="px-6 py-3">{t('dashboard.table.location')}</th>
                              <th scope="col" className="px-6 py-3">{t('dashboard.table.breeds')}</th>
                              <th scope="col" className="px-6 py-3">{t('dashboard.table.status')}</th>
                              <th scope="col" className="px-6 py-3 text-right">{t('dashboard.table.actions')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {sortedRegistrations.map(reg => {
                              const successCount = reg.animals.filter(a => !a.aiResult.error).length;
                              const totalCount = reg.animals.length;
                              let status, statusColor;
                              if (successCount === totalCount) {
                                  status = t('status.success');
                                  statusColor = 'bg-green-100 text-green-800';
                              } else if (successCount > 0) {
                                  status = t('status.partial');
                                  statusColor = 'bg-yellow-100 text-yellow-800';
                              } else {
                                  status = t('status.failed');
                                  statusColor = 'bg-red-100 text-red-800';
                              }

                              const breeds = reg.animals
                                  .map(a => a.aiResult.error ? null : a.aiResult.breedName)
                                  .filter(Boolean)
                                  .join(', ');

                              return (
                                  <tr key={reg.id} className="bg-white border-b border-cream-200 last:border-b-0 hover:bg-cream-50">
                                      <td className="px-6 py-4 font-medium text-primary-900 whitespace-nowrap">{new Date(reg.timestamp).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">{reg.owner.name}</td>
                                      <td className="px-6 py-4">{`${reg.owner.district}, ${reg.owner.state}`}</td>
                                      <td className="px-6 py-4">{breeds || 'N/A'}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{status}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => onViewRegistration(reg)} className="font-medium text-accent-600 hover:underline">{t('buttons.view')}</button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
               {registrations.length === 0 && (
                  <div className="text-center p-8 text-primary-700">{t('dashboard.noRegs')}</div>
              )}
          </div>
      </div>

      {/* Learning Hub */}
      <div className="grid grid-cols-1 gap-6">
          <button onClick={() => setIsLearningHubOpen(true)} className="bg-white p-6 rounded-xl shadow-sm border border-cream-200 text-left hover:shadow-lg transition-shadow hover:-translate-y-1">
            <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><Icon name="book-open" className="w-5 h-5 text-accent-yellow-600"/>{t('dashboard.hub.title')}</h3>
            <p className="text-sm text-primary-700">{t('dashboard.hub.desc')}</p>
             <div className="mt-4 text-accent-yellow-600 font-bold flex items-center text-sm">
                {t('dashboard.hub.open')} <Icon name="chevron-right" className="w-4 h-4 ml-1" />
            </div>
          </button>
      </div>
      
      <GeneralChatbot />
      <BreedLearningHubModal isOpen={isLearningHubOpen} onClose={() => setIsLearningHubOpen(false)} />
      <UpdateRecordModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        onEditRegistration={onEditRegistration}
        registrations={registrations}
      />
    </div>
  );
};