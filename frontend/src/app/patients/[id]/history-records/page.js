'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileText, Activity, ShieldAlert, Award, Calendar, 
  ExternalLink, ChevronRight, CheckCircle2, HeartPulse, User
} from 'lucide-react';

export default function PatientHistoryRecords() {
  const { user, token, API_BASE_URL } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigation Guard
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  // Fetch Patient Details
  useEffect(() => {
    if (!patientId || !token) return;

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to retrieve clinical patient file.');
        }
        const data = await res.json();
        setPatient(data);
        setError('');
      } catch (err) {
        console.error('Error fetching patient records:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, token]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Link href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 dark:text-slate-300">Patient File</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-teal-600 dark:text-teal-400">Diagnostic Records</span>
        </div>

        {/* Back Link Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-extrabold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xxs font-extrabold uppercase border border-amber-500/20 tracking-wider">
            Legacy Application Archive
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <strong>Failed to load patient records:</strong> {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader mb-4">
              <div></div>
              <div></div>
            </div>
            <p className="text-sm font-semibold text-slate-400 animate-pulse">Decrypting historical database records...</p>
          </div>
        ) : !patient ? (
          <div className="glass p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Patient File Not Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              The requested patient record could not be resolved in the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Left Column: Patient Profile Summary Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <User className="h-40 w-40" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{patient.name}</h2>
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                      Patient ID: {patient.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold space-y-4">
                  <div className="pt-0 flex justify-between py-2 text-slate-500 dark:text-slate-400">
                    <span>Age / Gender</span>
                    <span className="text-slate-800 dark:text-slate-200">{patient.age} yrs / <span className="capitalize">{patient.gender}</span></span>
                  </div>
                  <div className="pt-3 flex justify-between py-2 text-slate-500 dark:text-slate-400">
                    <span>Phone Number</span>
                    <span className="text-slate-800 dark:text-slate-200">{patient.phoneNumber}</span>
                  </div>
                  <div className="pt-3 flex justify-between py-2 text-slate-500 dark:text-slate-400">
                    <span>Email Address</span>
                    <span className="text-slate-800 dark:text-slate-200">{patient.email || 'None Provided'}</span>
                  </div>
                  <div className="pt-3 flex justify-between py-2 text-slate-500 dark:text-slate-400">
                    <span>Registered Date</span>
                    <span className="text-slate-800 dark:text-slate-200">{new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Clinic Notes Card */}
              <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-teal-600" />
                  Clinical Background
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs leading-5">
                  <p className="text-slate-600 dark:text-slate-300 font-semibold italic">
                    "{patient.medicalHistory || 'No historical clinical background notes are recorded in the central database.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Diagnostic Reports Archive */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Archived Diagnostic Reports</h3>
                    <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Legacy App Clinical Sync Directory
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Report Card 1 */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xxs font-extrabold bg-teal-500/10 text-teal-600 uppercase tracking-wide">Hematology</span>
                        <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          10 Days Ago
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">CBC (Complete Blood Count) Panel</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Routine profile. Hemoglobin: 14.2 g/dL (Normal). WBC: 6.8 K/uL. Platelets: 250 K/uL.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        Finalized
                      </span>
                      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-colors" title="Export PDF">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Report Card 2 */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xxs font-extrabold bg-blue-500/10 text-blue-600 uppercase tracking-wide">Radiology</span>
                        <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          3 Weeks Ago
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Chest X-Ray PA & Lateral Views</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        No focal consolidation, pneumothorax, or pleural effusion. Normal cardiac silhouette.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        Finalized
                      </span>
                      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-colors" title="Export PDF">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Report Card 3 */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xxs font-extrabold bg-amber-500/10 text-amber-600 uppercase tracking-wide">Cardiology</span>
                        <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          1 Month Ago
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">12-Lead Electrocardiogram (ECG)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Normal sinus rhythm. Heart rate: 72 bpm. PR interval, QRS duration normal. No acute ischemic changes.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        Archived
                      </span>
                      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-colors" title="Export PDF">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
