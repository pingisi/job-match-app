import { useState } from 'react'
import { SlidersHorizontal, Briefcase } from 'lucide-react'
import type { Job, ResumeProfile } from '../types'
import JobCard from './JobCard'

interface Props {
  jobs: Job[]
  profile: ResumeProfile
  onNewSearch: () => void
}

export default function JobResults({ jobs, profile, onNewSearch }: Props) {
  const [minScore, setMinScore] = useState(0)

  const filtered = jobs.filter((j) => j.score >= minScore)

  return (
    <div>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {filtered.length}{' '}
            <span className="text-slate-400 font-normal">of {jobs.length}</span> jobs found
          </h2>
          <p className="text-slate-500 text-sm">
            Sorted by AI match score · {profile.search_term}
          </p>
        </div>
        <button
          onClick={onNewSearch}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
        >
          ← New Search
        </button>
      </div>

      {/* Score filter */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
        <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <label className="text-sm font-medium text-slate-700 flex-shrink-0 w-32">
          Min score: <span className="text-blue-600">{minScore}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
      </div>

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Briefcase className="w-12 h-12" />
          <p className="font-medium">No jobs match your filter</p>
          <p className="text-sm">Try lowering the minimum score</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
