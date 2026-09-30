import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  DollarSign, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ALL_COUNTRIES } from '../../data/countries';

const FeePayments = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Forms state
  const [showBankForm, setShowBankForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    account_holder: '',
    bank_name: '',
    account_type: 'Ahorros',
    account_number: '',
    country: 'Colombia',
    currency: 'USD'
  });
  const [paymentForm, setPaymentForm] = useState({
    consultation_type: 'Videoconsulta',
    price: '',
    currency: 'USD'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      const [bankRes, paymentRes] = await Promise.all([
        fetch(`${urlBase}/doctor-payments/bank-accounts?user_id=${user.id}`),
        fetch(`${urlBase}/doctor-payments/settings?user_id=${user.id}`)
      ]);
      
      if (bankRes.ok) {
        const data = await bankRes.json();
        setBankAccounts(data);
      }
      
      if (paymentRes.ok) {
        const data = await paymentRes.json();
        setPaymentSettings(data);
      }
    } catch (err) {
      setError('Error al cargar la información. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  // Bank Account Handlers
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${urlBase}/doctor-payments/bank-accounts?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm)
      });
      if (!res.ok) throw new Error('Error saving');
      
      showNotification('Cuenta bancaria guardada exitosamente');
      setShowBankForm(false);
      setBankForm({
        account_holder: '', bank_name: '', account_type: 'Ahorros',
        account_number: '', country: 'Colombia', currency: 'USD'
      });
      fetchData();
    } catch (err) {
      showNotification('Error al guardar la cuenta', 'error');
    }
  };

  const deleteBankAccount = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    try {
      const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${urlBase}/doctor-payments/bank-accounts/${id}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error deleting');
      
      showNotification('Cuenta eliminada');
      fetchData();
    } catch (err) {
      showNotification('Error al eliminar', 'error');
    }
  };

  // Payment Settings Handlers
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const payload = {
        ...paymentForm,
        price: parseFloat(paymentForm.price)
      };
      
      const res = await fetch(`${urlBase}/doctor-payments/settings?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error saving');

      showNotification('Tarifa guardada exitosamente');
      setShowPaymentForm(false);
      setPaymentForm({
        consultation_type: 'Videoconsulta', price: '', currency: 'USD'
      });
      fetchData();
    } catch (err) {
      showNotification('Error al guardar la tarifa', 'error');
    }
  };

  const deletePaymentSetting = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarifa?')) return;
    try {
      const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${urlBase}/doctor-payments/settings/${id}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error deleting');

      showNotification('Tarifa eliminada');
      fetchData();
    } catch (err) {
      showNotification('Error al eliminar', 'error');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Cargando información...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tarifas y Métodos de Pago</h1>
        <p className="text-slate-600 mt-1">
          Gestiona tus tarifas de consulta y las cuentas bancarias donde recibirás tus pagos.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={20} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Settings Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <DollarSign className="text-blue-600" />
              Mis Tarifas
            </div>
            <button 
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {showPaymentForm ? 'Cancelar' : <><Plus size={16} /> Nueva Tarifa</>}
            </button>
          </div>

          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="bg-slate-50 p-4 rounded-xl mb-6 space-y-4 border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Consulta</label>
                <select 
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  value={paymentForm.consultation_type}
                  onChange={(e) => setPaymentForm({...paymentForm, consultation_type: e.target.value})}
                >
                  <option value="Videoconsulta">Videoconsulta</option>
                  <option value="Presencial">Presencial</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  * Este valor corresponde a la tarifa establecida por el rango de tiempo configurado en tu agenda.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                  <input 
                    type="number" required min="0" step="0.01"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100"
                    value={paymentForm.price}
                    onChange={(e) => setPaymentForm({...paymentForm, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100"
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({...paymentForm, currency: e.target.value})}
                  >
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
                <Save size={18} /> Guardar Tarifa
              </button>
            </form>
          )}

          <div className="space-y-4">
            {paymentSettings.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">No tienes tarifas configuradas aún.</p>
            ) : (
              paymentSettings.map(setting => (
                <div key={setting.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-semibold text-slate-800">{setting.consultation_type}</h4>
                    <p className="text-slate-500 text-sm">Tarifa por rango de tiempo configurado</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-800 text-lg">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: setting.currency }).format(setting.price)}
                    </span>
                    <button onClick={() => deletePaymentSetting(setting.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bank Accounts Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Building2 className="text-indigo-600" />
              Cuentas Bancarias
            </div>
            <button 
              onClick={() => setShowBankForm(!showBankForm)}
              className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              {showBankForm ? 'Cancelar' : <><Plus size={16} /> Nueva Cuenta</>}
            </button>
          </div>

          {showBankForm && (
            <form onSubmit={handleBankSubmit} className="bg-slate-50 p-4 rounded-xl mb-6 space-y-4 border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titular de la cuenta</label>
                <input 
                  type="text" required
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                  value={bankForm.account_holder}
                  onChange={(e) => setBankForm({...bankForm, account_holder: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                  <input 
                    type="text" required
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cuenta</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                    value={bankForm.account_type}
                    onChange={(e) => setBankForm({...bankForm, account_type: e.target.value})}
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">País del Banco</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                    value={bankForm.country}
                    onChange={(e) => setBankForm({...bankForm, country: e.target.value})}
                  >
                    {ALL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda de la Cuenta</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                    value={bankForm.currency}
                    onChange={(e) => setBankForm({...bankForm, currency: e.target.value})}
                  >
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Cuenta</label>
                <input 
                  type="text" required
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100"
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                <Save size={18} /> Guardar Cuenta
              </button>
            </form>
          )}

          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">No has agregado cuentas bancarias.</p>
            ) : (
              bankAccounts.map(account => (
                <div key={account.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                  <div className="flex justify-between items-start ml-2">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" />
                        {account.bank_name}
                      </h4>
                      <p className="text-slate-600 text-sm mt-1">
                        {account.account_type} •••• {account.account_number.slice(-4)}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 uppercase tracking-wide">
                        {account.account_holder}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_verified ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Verificada</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">Pendiente</span>
                      )}
                      <button onClick={() => deleteBankAccount(account.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeePayments;