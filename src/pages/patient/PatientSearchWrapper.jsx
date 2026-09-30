import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EspecialistasLanding from './EspecialistasLanding';
import EspecialistasPresencialSearch from './EspecialistasPresencialSearch';
import LocationConsentGate from './components/LocationConsentGate';

const PatientSearchWrapper = () => {
    const [view, setView] = useState('landing');
    const navigate = useNavigate();

    const handleBack = () => {
        if (view === 'landing') {
            navigate(-1);
        } else {
            setView('landing');
        }
    };

    if (view === 'presencial') {
        return (
            <LocationConsentGate>
                {(patientPos) => (
                    <div className="relative">
                        <EspecialistasPresencialSearch 
                            apiUrl={import.meta.env.VITE_API_URL || 'http://localhost:8000'} 
                            onBack={handleBack} 
                            initialPos={patientPos}
                        />
                    </div>
                )}
            </LocationConsentGate>
        );
    }

    return (
        <EspecialistasLanding
            onBack={handleBack}
            onSelectVideo={() => setView('video')}
            onSelectPresencial={() => setView('presencial')}
            onMyAppointments={() => navigate('/patient/appointments')}
        />
    );
};

export default PatientSearchWrapper;
