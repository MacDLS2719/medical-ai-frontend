import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EspecialistasLanding from './EspecialistasLanding';
import EspecialistasVideoSearch from './EspecialistasVideoSearch';
import EspecialistasPresencialSearch from './EspecialistasPresencialSearch';
import BookAppointmentPage from './components/BookAppointmentPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export default function PatientSearchWrapper() {
  const navigate = useNavigate();

  // 'landing' | 'video' | 'presencial' | 'booking'
  const [view, setView] = useState('landing');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedModality, setSelectedModality] = useState('video');

  const handleSelectDoctor = (doctor, modality) => {
    setSelectedDoctor(doctor);
    setSelectedModality(modality);
    setView('booking');
  };

  if (view === 'landing') {
    return (
      <EspecialistasLanding
        onBack={() => navigate('/patient/home')}
        onSelectVideo={() => setView('video')}
        onSelectPresencial={() => setView('presencial')}
        onMyAppointments={() => navigate('/patient/appointments')}
      />
    );
  }

  if (view === 'video') {
    return (
      <EspecialistasVideoSearch
        apiUrl={API_URL}
        onBack={() => setView('landing')}
        onSelectDoctor={(doctor, modality) => handleSelectDoctor(doctor, modality)}
      />
    );
  }

  if (view === 'presencial') {
    return (
      <EspecialistasPresencialSearch
        apiUrl={API_URL}
        onBack={() => setView('landing')}
        onSelectDoctor={(doctor, modality) => handleSelectDoctor(doctor, modality)}
      />
    );
  }

  if (view === 'booking' && selectedDoctor) {
    return (
      <BookAppointmentPage
        doctor={selectedDoctor}
        modality={selectedModality}
        onBack={() => setView(selectedModality === 'video' ? 'video' : 'presencial')}
        onDone={() => navigate('/patient/appointments')}
      />
    );
  }

  return null;
}
