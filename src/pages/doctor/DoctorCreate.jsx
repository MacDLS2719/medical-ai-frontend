import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import StepperHeader from './components/StepperHeader';
import Step1Personal from './components/Step1Personal';
import Step2Professional from './components/Step2Professional';
import Step3Professional from './components/Step3Professional';
import Step4OptionalProfile from './components/Step4Professional';
import Step5Subscription from '../../components/suscription/Step5Subscription';
import Step6Success from './components/Step6Success';

const parseBirthDate = (str) => {
  if (!str) return null;
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[\/\-\s]+/).filter(Boolean);
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
};

export default function DoctorCreate() {
  const { loginAsDoctor } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Paso 1
    firstName: '',
    lastName: '',
    birthDate: '',
    country: 'Colombia',
    email: '',
    phone: '',
    language: 'Español',
    password: '',
    confirmPassword: '',
    identityDoc: null,
    colegiationCert: null,
    termsAccepted: false,

    // Paso 2
    specialty: '',
    colegiatedNumber: '',
    professionalCollege: '',
    collegeCountry: '',
    experienceYears: '',
    subspecialty: '',
    bio: '',
    clinicName: '',
    address: '',
    city: '',
    zipCode: '',
    latitude: null,
    longitude: null,
    consultationPhone: '',
    website: '',

    // Paso 4 - Perfil Opcional
    profilePhoto: null,
    clinicImages: [],
    presentationVideo: null,

    // Paso 5 - Suscripción
    subscriptionPlanId: null,
    subscriptionPlanSlug: null,
    subscriptionPlanName: null
  });

  const updateFormData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (stepNumber) => setCurrentStep(stepNumber);

  const handleRegisterDoctor = async (planId, paymentMethod = 'none') => {
    setIsSubmitting(true);
    setError(null);

    const yearsExp = formData.experienceYears
      ? parseInt(formData.experienceYears.toString().replace(/\D/g, '')) || null
      : null;

    // planId se pasa directamente para evitar el delay de setState, pero ignoramos eventos de React
    const resolvedPlanId = typeof planId === 'number' || typeof planId === 'string' ? planId : formData.subscriptionPlanId || null;

    const payload = {
      first_name: formData.firstName.trim() || 'Médico',
      last_name: formData.lastName.trim() || 'General',
      email: formData.email.trim(),
      medical_license: formData.colegiatedNumber.trim() || `LIC-${Date.now()}`,
      specialty: formData.specialty.trim() || 'Medicina General',
      phone: formData.phone?.trim() || null,
      date_of_birth: parseBirthDate(formData.birthDate),
      residence_country: formData.country || 'Colombia',
      country: formData.country || 'Colombia',
      city: formData.city?.trim() || null,
      address: formData.address?.trim() || null,
      postal_code: formData.zipCode?.trim() || null,
      latitude: formData.latitude !== null && formData.latitude !== undefined && formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== null && formData.longitude !== undefined && formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      consultation_phone: formData.consultationPhone?.trim() || null,
      website: formData.website?.trim() || null,
      professional_registration_number: formData.colegiatedNumber?.trim() || null,
      professional_college: formData.professionalCollege?.trim() || null,
      college_country: formData.collegeCountry?.trim() || null,
      years_of_experience: yearsExp,
      professional_description: formData.bio?.trim() || null,
      experience: formData.bio?.trim() || null,
      language: formData.language === 'Inglés' ? 'en' : 'es',
      password: formData.password || null,
      subscription_plan_id: resolvedPlanId
    };

    const submitUserRegistration = async (payload, apiUrl) => {
      const response = await fetch(`${apiUrl}/doctor-profile/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let doctorUser;
      if (response.ok) {
        const responseData = await response.json();
        const subInfo = responseData.subscription || {
          id: formData.subscriptionPlanId || 2,
          name: formData.subscriptionPlanName || 'Plan Profesional',
          slug: formData.subscriptionPlanSlug || 'pro',
          price: 99,
          is_free: false
        };

        const realUserId = responseData.user_id || responseData.id;
        if (!realUserId) {
          throw new Error('El servidor no devolvió un ID de usuario válido. Intente de nuevo.');
        }

        doctorUser = {
          id: realUserId,
          role: 'doctor',
          name: `Dr. ${formData.firstName} ${formData.lastName}`.trim() || 'Dr. Médico',
          email: formData.email,
          subscription: subInfo
        };

        // Subir fotos o documentos opcionales si se seleccionaron
        const filesToUpload = [];
        if (formData.profilePhoto) filesToUpload.push({ file: formData.profilePhoto, type: 'profile_picture' });
        if (formData.identityDoc) filesToUpload.push({ file: formData.identityDoc, type: 'additional_document' });
        if (formData.colegiationCert) filesToUpload.push({ file: formData.colegiationCert, type: 'certificate' });
        if (formData.clinicImages && formData.clinicImages.length > 0) {
          formData.clinicImages.forEach((img) => filesToUpload.push({ file: img, type: 'gallery' }));
        }

        for (const item of filesToUpload) {
          try {
            const fileData = new FormData();
            fileData.append('media_type', item.type);
            fileData.append('file', item.file);
            await fetch(`${apiUrl}/doctor-profile/media?user_id=${doctorUser.id}`, {
              method: 'POST',
              body: fileData
            });
          } catch (e) {
            console.warn('Error subiendo archivo:', item.type, e);
          }
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 400 && errData.detail) {
          throw new Error(errData.detail);
        } else {
          throw new Error(errData.detail || 'Error al registrar el perfil médico.');
        }
      }

      loginAsDoctor(doctorUser);
      return doctorUser;
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      if (paymentMethod === 'paddle') {
        const paddleRes = await fetch(`${apiUrl}/paddle/checkout?plan_id=${resolvedPlanId}`, { method: 'POST' });
        if (!paddleRes.ok) {
          const errText = await paddleRes.text();
          throw new Error('Error al cargar la pasarela de pago: ' + errText);
        }
        const paddleData = await paddleRes.json();

        if (window.Paddle) {
          window.Paddle.Environment.set(paddleData.environment);
          window.Paddle.Initialize({
            token: paddleData.client_token,
            eventCallback: function(data) {
              if (data.name === "checkout.completed") {
                submitUserRegistration(payload, apiUrl);
              }
            }
          });

          window.Paddle.Checkout.open({
            settings: {
              displayMode: "overlay",
              theme: "light",
              locale: "es",
              successUrl: window.location.origin + "/doctor/dashboard"
            },
            items: [
              {
                priceId: paddleData.price_id,
                quantity: 1
              }
            ]
          });
          
          setIsSubmitting(false);
          return; // Esperamos al callback
        } else {
          throw new Error('Paddle no está cargado');
        }
      } else if (paymentMethod === 'stripe') {
        // Crear usuario primero (Stripe redirige, por lo que perderíamos los datos)
        const doctorUser = await submitUserRegistration(payload, apiUrl);
        
        if (doctorUser && doctorUser.id) {
          const successUrl = window.location.origin + "/doctor/dashboard?session_id={CHECKOUT_SESSION_ID}";
          const cancelUrl = window.location.origin + "/doctor/dashboard?cancel=true";
          
          const stripeRes = await fetch(`${apiUrl}/stripe/create-checkout-session?user_id=${doctorUser.id}&plan_id=${resolvedPlanId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`, {
            method: 'POST'
          });
          
          if (stripeRes.ok) {
            const stripeData = await stripeRes.json();
            window.location.href = stripeData.checkout_url;
            return; // Redirigiendo a Stripe
          } else {
            const errText = await stripeRes.text();
            console.warn("Error creando sesión de Stripe", errText);
            setError("El usuario fue creado pero hubo un error al abrir Stripe: " + errText);
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        await submitUserRegistration(payload, apiUrl);
        setCurrentStep(6);
      }

    } catch (err) {
      console.error('Error in doctor registration:', err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('fetch'))) {
        const localDoctor = {
          id: Date.now(),
          role: 'doctor',
          name: `Dr. ${formData.firstName} ${formData.lastName}`.trim() || 'Dr. Médico',
          email: formData.email,
          subscription: {
            id: formData.subscriptionPlanId || 2,
            name: formData.subscriptionPlanName || 'Plan Profesional',
            slug: formData.subscriptionPlanSlug || 'pro',
            price: 99,
            is_free: false
          }
        };
        loginAsDoctor(localDoctor);
        setCurrentStep(6);
      } else {
        setError(err.message || 'Error al crear la cuenta.');
        alert(err.message || 'Error al crear la cuenta.');
      }
    } finally {
      if (paymentMethod === 'none') setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen h-auto bg-[#F8FAFC] flex flex-col font-sans text-slate-800 overflow-y-auto">

      {/* Dynamic Content Area */}
      <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-6">
        {/* Stepper Header */}
        {currentStep < 6 && <StepperHeader currentStep={currentStep} />}

        {error && currentStep < 6 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Paso 1 */}
        {currentStep === 1 && (
          <Step1Personal 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
          />
        )}

        {/* Paso 2 */}
        {currentStep === 2 && (
          <Step2Professional 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
            onPrev={prevStep}
          />
        )}

        {/* Paso 3 */}
        {currentStep === 3 && (
          <Step3Professional 
            formData={formData} 
            onNext={nextStep} 
            onPrev={prevStep}
            goToStep={goToStep}
          />
        )}

        {/* Paso 4: Perfil Opcional */}
        {currentStep === 4 && (
          <Step4OptionalProfile 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
            onPrev={prevStep}
          />
        )}

        {/* Paso 5: Suscripción */}
        {currentStep === 5 && (
          <Step5Subscription 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleRegisterDoctor}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Paso 6: Éxito */}
        {currentStep === 6 && <Step6Success formData={formData} />}
      </div>
    </div>
  );
}