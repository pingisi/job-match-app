import { useState } from 'react'
import { Briefcase, Search, AlertCircle } from 'lucide-react'
import ResumeUpload from './components/ResumeUpload'
import LocationSelector from './components/LocationSelector'
import JobResults from './components/JobResults'
import type { ResumeProfile, Job, AppStep } from './types'
import api from './api/client'

export default function App() {
  const [step, setStep] = useState<AppStep>('upload')
  const [profile, setProfile] = useState<ResumeProfile | null>(null)
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [hoursOld, setHoursOld] = useState(336)
  const [minScore, setMinScore] = useState(50)
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)

  const DATE_RANGES = [
    { label: 'Today', value: 24 },
    { label: 'Last 2 days', value: 48 },
    { label: 'Last 3 days', value: 72 },
    { label: 'Last week', value: 168 },
    { label: 'Last 2 weeks', value: 336 },
    { label: 'Last month', value: 720 },
  ]

  const SCORE_THRESHOLDS = [
    { label: 'Any', value: 0 },
    { label: '30%+', value: 30 },
    { label: '50%+', value: 50 },
    { label: '70%+', value: 70 },
    { label: '80%+', value: 80 },
    { label: '90%+', value: 90 },
  ]

  const handleParsed = (p: ResumeProfile) => {
    setProfile(p)
    setError(null)
  }

  const handleSearch = async () => {
    if (!profile || !country) {
      setError('Please select a country before searching.')
      return
    }
    setError(null)
    setStep('searching')

    try {
      const { data } = await api.post<{ jobs: Job[]; total: number }>('/jobs/search', {
        profile,
        location: province ? `${province}, ${country}` : country,
        country,
        province: province || null,
        hours_old: hoursOld,
      })
      setJobs(data.jobs)
      setStep('results')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Job search failed. Please try again.')
      setStep('upload')
    }
  }

  const handleNewSearch = () => {
    setStep('upload')
    setJobs([])
    setProfile(null)
    setCountry('')
    setProvince('')
    setHoursOld(336)
    setMinScore(50)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Job Match AI</h1>
            <p className="text-xs text-slate-500">Upload resume · Get AI-scored opportunities</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ── STEP 1: Upload + Location ── */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Find Your Perfect Job</h2>
              <p className="text-slate-500 mt-1">
                Upload your resume and let AI match you with the best opportunities worldwide.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Resume upload card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Step 1 · Resume
              </p>
              <ResumeUpload onParsed={handleParsed} />
            </div>

            {/* Location + search — only show after profile is ready */}
            {profile && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-4">
                  Step 2 · Location
                </p>
                <LocationSelector
                  country={country}
                  province={province}
                  onCountryChange={setCountry}
                  onProvinceChange={setProvince}
                />

                {/* Date range picker */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job posted within</label>
                  <div className="flex flex-wrap gap-2">
                    {DATE_RANGES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setHoursOld(r.value)}
                        className={[
                          'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                          hoursOld === r.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400',
                        ].join(' ')}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min score picker */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum match score
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SCORE_THRESHOLDS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setMinScore(s.value)}
                        className={[
                          'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                          minScore === s.value
                            ? s.value >= 80
                              ? 'bg-green-600 text-white border-green-600'
                              : s.value >= 50
                              ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-slate-500 text-white border-slate-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400',
                        ].join(' ')}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={!country}
                  className={[
                    'mt-6 w-full flex items-center justify-center gap-2 py-3 px-6',
                    'font-semibold rounded-xl text-white transition-all',
                    country
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-slate-300 cursor-not-allowed',
                  ].join(' ')}
                >
                  <Search className="w-5 h-5" />
                  Find Matching Jobs
                </button>

                <p className="text-xs text-slate-400 text-center mt-2">
                  Searches LinkedIn, Indeed, Glassdoor & ZipRecruiter · AI scoring may take 1–3 min
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SEARCHING ── */}
        {step === 'searching' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            {/* Animated ring */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="text-center max-w-sm">
              <p className="text-xl font-semibold text-slate-800">Searching for matching jobs…</p>
              <p className="text-slate-500 mt-2">
                Scraping job boards and scoring each posting against your profile with AI. This
                typically takes 1–3 minutes.
              </p>
            </div>

            {/* Pulsing site labels */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Indeed', 'LinkedIn', 'Glassdoor', 'Google', 'ZipRecruiter'].map((site, i) => (
                <span
                  key={site}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 shadow-sm animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {site}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && profile && (
          <JobResults jobs={jobs} profile={profile} initialMinScore={minScore} onNewSearch={handleNewSearch} />
        )}
      </main>
    </div>
  )
}
