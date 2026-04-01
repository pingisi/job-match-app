import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react'
import type { ResumeProfile } from '../types'
import api from '../api/client'

interface Props {
  onParsed: (profile: ResumeProfile) => void
}

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export default function ResumeUpload({ onParsed }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedProfile, setParsedProfile] = useState<ResumeProfile | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ResumeProfile>('/resume/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setParsedProfile(data)
      onParsed(data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to parse resume. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200',
          isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={onFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-600 font-medium">Parsing your resume with AI…</p>
          </div>
        ) : parsedProfile ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="text-green-700 font-semibold">Resume parsed successfully!</p>
            <p className="text-slate-400 text-sm">Click to upload a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-blue-50 rounded-full">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-lg">
                Drop your resume here or{' '}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-slate-400 text-sm mt-1">PDF or DOCX · Max 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
      )}

      {parsedProfile && (
        <div className="mt-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Detected Profile</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-500">Target Role: </span>
              <span className="text-slate-800">{parsedProfile.search_term}</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Experience: </span>
              <span className="text-slate-800">{parsedProfile.years_experience ?? '?'} years</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Skills: </span>
              <span className="text-slate-800">
                {parsedProfile.skills.slice(0, 8).join(', ')}
                {parsedProfile.skills.length > 8 && ` +${parsedProfile.skills.length - 8} more`}
              </span>
            </div>
            {parsedProfile.summary && (
              <div>
                <span className="font-medium text-slate-500">Summary: </span>
                <span className="text-slate-800">{parsedProfile.summary}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
