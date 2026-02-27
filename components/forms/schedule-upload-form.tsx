'use client'

import { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
// Note: You will need to create this server action next!
// import { uploadScheduleCsv } from '@/app/(dashboard)/admin/schedules/actions'

export function ScheduleUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setStatus('idle')
    } else {
      setFile(null)
      setStatus('error')
      setErrorMessage('Please upload a valid .csv file.')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setStatus('idle')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // TODO: Call your Server Action here
      // const result = await uploadScheduleCsv(formData)
      
      // Simulating network request for now
      await new Promise(resolve => setTimeout(resolve, 1500)) 

      setStatus('success')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error.message || 'Failed to process the CSV file.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Bulk Upload Schedules</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV file containing the master schedule. The system will automatically link classes to teachers via their email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag & Drop Area / File Input */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="csv-upload"
          />
          <label 
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            {file ? (
              <>
                <FileText className="w-10 h-10 text-blue-500" />
                <span className="font-medium text-blue-700">{file.name}</span>
                <span className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-400" />
                <span className="font-medium text-slate-700">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-500">CSV files only</span>
              </>
            )}
          </label>
        </div>

        {/* Status Messages */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
            <CheckCircle2 className="w-4 h-4" />
            Schedules successfully uploaded and processed!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <a 
            href="/template.csv" 
            download 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Download CSV Template
          </a>
          
          <button
            type="submit"
            disabled={!file || isUploading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upload and Process'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}