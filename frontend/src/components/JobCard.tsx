import { useState } from 'react'
import {
  ExternalLink,
  FileText,
  RefreshCw,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
} from 'lucide-react'
import type { Job, ResumeProfile } from '../types'
import Modal from './Modal'
import api from '../api/client'

interface Props {
  job: Job
  profile: ResumeProfile
}

type ModalType = 'cover_letter' | 'rewrite' | null

const SITE_LABELS: Record<string, string> = {
  indeed: 'Indeed',
  linkedin: 'LinkedIn',
  glassdoor: 'Glassdoor',
  zip_recruiter: 'ZipRecruiter',
}

function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-red-100 text-red-700 border-red-200'

  return (
    <div className={`px-3 py-1 rounded-full border font-bold text-sm whitespace-nowrap ${colour}`}>
      {score}% match
    </div>
  )
}

export default function JobCard({ job, profile }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [modalContent, setModalContent] = useState<string | null>(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const openModal = async (type: ModalType) => {
    setModal(type)
    setModalContent(null)
    setIsModalLoading(true)

    try {
      if (type === 'cover_letter') {
        const { data } = await api.post<{ cover_letter: string }>('/ai/cover-letter', {
          profile: {
            skills: profile.skills,
            job_titles: profile.job_titles,
            years_experience: profile.years_experience,
            education: profile.education,
            summary: profile.summary,
            search_term: profile.search_term,
          },
          job,
        })
        setModalContent(data.cover_letter)
      } else {
        const { data } = await api.post<{ rewritten_resume: string }>('/ai/rewrite', {
          original_resume_text: profile.raw_text,
          job,
        })
        setModalContent(data.rewritten_resume)
      }
    } catch {
      setModalContent('Generation failed. Please try again.')
    } finally {
      setIsModalLoading(false)
    }
  }

  const location = [job.city, job.state, job.is_remote ? '(Remote)' : null]
    .filter(Boolean)
    .join(', ')

  const descPreview = job.description.slice(0, 260)
  const hasMore = job.description.length > 260

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
        {/* Title + score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 leading-snug">{job.title}</h3>
            <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          </div>
          <ScoreBadge score={job.score} />
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
          {job.job_type && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {job.job_type}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {job.salary}
            </span>
          )}
          {job.date_posted && job.date_posted !== 'None' && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {job.date_posted}
            </span>
          )}
          <span className="ml-auto bg-slate-100 px-2 py-0.5 rounded-full">
            {SITE_LABELS[job.site] ?? job.site}
          </span>
        </div>

        {/* AI score reason */}
        {job.score_reason && (
          <p className="text-xs text-slate-500 italic bg-slate-50 px-3 py-2 rounded-lg mb-3">
            {job.score_reason}
          </p>
        )}

        {/* Description preview */}
        {job.description && (
          <div className="mb-4 flex-1">
            <p className="text-sm text-slate-600 leading-relaxed">
              {isExpanded ? job.description : descPreview + (hasMore ? '…' : '')}
            </p>
            {hasMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 text-xs mt-1 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 mt-auto">
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apply Now
          </a>
          <button
            onClick={() => openModal('cover_letter')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Cover Letter
          </button>
          <button
            onClick={() => openModal('rewrite')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Rewrite Resume
          </button>
        </div>
      </div>

      {modal && (
        <Modal
          title={
            modal === 'cover_letter'
              ? `Cover Letter — ${job.title} at ${job.company}`
              : `Resume Rewrite — ${job.title} at ${job.company}`
          }
          content={modalContent}
          isLoading={isModalLoading}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
