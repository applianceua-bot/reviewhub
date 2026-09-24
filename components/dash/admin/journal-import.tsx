'use client'

import { useActionState, useRef, useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { importRemovalJournal, type ImportState } from '@/app/admin/removal-actions'
import { buttonClass } from '@/components/dash/styles'
import { cn } from '@/lib/utils'

const COLUMNS = '#, Date, Mail, Link, Platform, Service, Process, Type'

// Fictional rows that show the expected format.
const SAMPLE_CSV =
  '#\tDate\tMail\tLink\tPlatform\tService\tProcess\tType\n' +
  '1\t2/1/2026\treviewer.one@example.com\thttps://www.trustpilot.com/reviews/example-0001\tTrustpilot\tNordvik Pay\tPublish\tfake\n' +
  '2\t2/2/2026\treviewer.two@example.com\thttps://www.trustpilot.com/reviews/example-0002\tTrustpilot\tNordvik Pay\tRemoved\tfake\n' +
  '3\t2/3/2026\t\thttps://www.reviews.io/company-review/example-0003\treview.io\tLumo Travel\tPublish\treal\n' +
  '4\t2/5/2026\t\thttps://www.hellopeter.com/example/reviews/0004\tHellopeter\tLumo Travel\tPending\t\n'

export function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/tab-separated-values' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'review-log-example.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function SampleCsvButton() {
  return (
    <button type="button" onClick={downloadSample} className={buttonClass('secondary', 'h-8 text-xs')}>
      <Download className="size-3.5" />
      Пример CSV
    </button>
  )
}

/** Drag-and-drop journal upload, same as repcontrol's "Загрузка журнала". */
export function JournalImport() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importRemovalJournal, {})
  const [dragActive, setDragActive] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // A dropped file is put into the hidden input and submitted like a picked one.
  function submitFile(file: File) {
    const dt = new DataTransfer()
    dt.items.add(file)
    inputRef.current!.files = dt.files
    formRef.current!.requestSubmit()
  }

  return (
    <form ref={formRef} action={action}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const file = e.dataTransfer.files?.[0]
          if (file) submitFile(file)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && formRef.current?.requestSubmit()}
        />
        {pending ? (
          <Loader2 className="mb-1 size-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mb-1 size-5 text-muted-foreground" />
        )}
        <div className="text-sm font-semibold">{pending ? 'Загружаю…' : 'Перетащите файл сюда или нажмите для выбора'}</div>
        <div className="text-xs text-muted-foreground">{COLUMNS}</div>
        {state.note && <div className="mt-1 max-w-3xl text-xs text-primary">{state.note}</div>}
        {state.error && <div className="mt-1 text-xs text-negative">{state.error}</div>}
      </div>
    </form>
  )
}
