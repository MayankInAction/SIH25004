
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { RegistrationWizard } from './components/RegistrationWizard';
import { HistoryPage } from './components/HistoryPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { Registration } from './types';

type View = 'DASHBOARD' | 'REGISTRATION' | 'HISTORY' | 'ANALYTICS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [registrationToEdit, setRegistrationToEdit] = useState<Registration | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');


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
                />;
      case 'HISTORY':
        return <HistoryPage 
                    selectedRegistration={selectedRegistration} 
                    onBack={() => navigateTo('DASHBOARD')} 
                    onEdit={handleEditRegistration}
                    // FIX: HistoryPage now accepts initialSearchTerm
                    initialSearchTerm={globalSearchTerm}
                />;
      case 'ANALYTICS':
        return <AnalyticsPage onBack={() => navigateTo('DASHBOARD')} />;
      case 'DASHBOARD':
      default:
        return <Dashboard 
                    onNavigate={navigateTo} 
                    onViewRegistration={handleViewRegistration}
                    onEditRegistration={handleEditRegistration}
                />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-primary-900 font-sans">
      {/* FIX: Header now accepts onSearch and showSearch. Show search on dashboard. */}
      <Header onSearch={handleGlobalSearch} showSearch={currentView === 'DASHBOARD'}/>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
