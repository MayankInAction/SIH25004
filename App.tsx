import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { RegistrationWizard } from './components/RegistrationWizard';
import { HistoryPage } from './components/HistoryPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { QuickIdTool } from './components/QuickIdTool';
import { Registration } from './types';
import * as databaseService from './services/databaseService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

type View = 'DASHBOARD' | 'REGISTRATION' | 'HISTORY' | 'ANALYTICS' | 'QUICK_ID';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [registrationToEdit, setRegistrationToEdit] = useState<Registration | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    databaseService.getAllRegistrations().then(data => {
      setRegistrations(data);
      setIsLoading(false);
    });
  }, []);

  const handleRegistrationComplete = async (completedReg: Registration) => {
    if (registrationToEdit) { // Update
        await databaseService.updateRegistration(completedReg);
        setRegistrations(prev => prev.map(r => r.id === completedReg.id ? completedReg : r));
    } else { // Create
        await databaseService.saveRegistration(completedReg);
        setRegistrations(prev => [...prev, completedReg]);
    }
  };

  const navigateTo = (view: View) => {
    setSelectedRegistration(null);
    setRegistrationToEdit(null);
    setGlobalSearchTerm('');
    setCurrentView(view);
  };
  
  const handleViewRegistration = (registration: Registration) => {
      setSelectedRegistration(registration);
      setCurrentView('HISTORY');
  };
  
  const handleEditRegistration = (registration: Registration) => {
      setRegistrationToEdit(registration);
      setCurrentView('REGISTRATION');
  };

  const handleGlobalSearch = (term: string) => {
    setGlobalSearchTerm(term);
    setCurrentView('HISTORY');
  }

  const renderView = () => {
    switch (currentView) {
      case 'REGISTRATION':
        return <RegistrationWizard 
                    onBackToDashboard={() => navigateTo('DASHBOARD')}
                    registrationToUpdate={registrationToEdit}
                    onViewReport={handleViewRegistration}
                    onComplete={handleRegistrationComplete}
                />;
      case 'HISTORY':
        return <HistoryPage 
                    registrations={registrations}
                    selectedRegistration={selectedRegistration} 
                    onBack={() => navigateTo('DASHBOARD')} 
                    onEdit={handleEditRegistration}
                    initialSearchTerm={globalSearchTerm}
                />;
      case 'ANALYTICS':
        return <AnalyticsPage registrations={registrations} onBack={() => navigateTo('DASHBOARD')} />;
      case 'QUICK_ID':
        return <QuickIdTool onBackToDashboard={() => navigateTo('DASHBOARD')} />;
      case 'DASHBOARD':
      default:
        return <Dashboard 
                    registrations={registrations}
                    onNavigate={navigateTo} 
                    onViewRegistration={handleViewRegistration}
                    onEditRegistration={handleEditRegistration}
                />;
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
            <div className="text-center">
                <span className="text-5xl animate-bounce">🐮</span>
                <p className="mt-4 text-xl font-semibold text-primary-800">{t('app.connectingDb')}</p>
                <p className="text-sm text-primary-700">{t('app.loadingRecords')}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-primary-900 font-sans">
      <Header onSearch={handleGlobalSearch} showSearch={currentView === 'DASHBOARD'}/>
      <main className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;
