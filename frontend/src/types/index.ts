export interface ResumeProfile {
  skills: string[]
  job_titles: string[]
  years_experience: number | null
  education: string | null
  summary: string
  search_term: string
  raw_text: string
}

export interface Job {
  id: string
  title: string
  company: string
  city: string
  state: string
  country: string
  is_remote: boolean
  job_type: string
  salary: string | null
  description: string
  job_url: string
  site: string
  date_posted: string
  score: number
  score_reason: string
}

export interface SearchResponse {
  jobs: Job[]
  total: number
}

export type AppStep = 'upload' | 'searching' | 'results'
