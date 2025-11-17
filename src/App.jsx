import { useState } from 'react'

function App() {
  const [answerKey, setAnswerKey] = useState('1) A\n2) B\n3) C\n4) A\n5) B')
  const [submissions, setSubmissions] = useState('Alice\n1) a\n2) b\n3) c\n4) a\n5) c\n\nBob\n1a\n2b\n3) D\n4) a\n5) b')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${baseUrl}/api/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_key: answerKey, submissions })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const makeTextReport = (data) => {
    if (!data) return ''
    const lines = []
    lines.push('=== Aggregate Summary ===')
    lines.push(`Total students: ${data.summary.total_students}`)
    if (data.summary.ranking?.length) {
      lines.push('Ranking:')
      data.summary.ranking.forEach((r, idx) => {
        lines.push(`${idx + 1}. ${r.name} — ${r.raw_score} pts (${r.percentage}%)`)
      })
    }
    if (data.summary.most_missed_questions?.length) {
      lines.push('Most missed question(s):')
      data.summary.most_missed_questions.forEach((q) => {
        lines.push(`Q${q.question} missed by ${q.missed_by}`)
      })
    }
    lines.push('')
    lines.push('=== Per-student Reports ===')
    data.reports.forEach((r) => {
      lines.push(`\nName: ${r.name}`)
      lines.push(`Score: ${r.raw_score}/${r.total_questions} (${r.percentage}%)`)
      lines.push(`Suggested grade: ${r.suggested_grade}`)
      if (r.missed?.length) {
        lines.push('Missed:')
        r.missed.forEach((m) => {
          lines.push(` - Q${m.question}: student=${m.student_answer ?? '-'} | key=${m.correct_answer}`)
        })
      } else {
        lines.push('Missed: none')
      }
    })
    return lines.join('\n')
  }

  const downloadReport = () => {
    const text = makeTextReport(result)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grading-report.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fillSample = () => {
    setAnswerKey('1) A\n2) B\n3) C\n4) A\n5) B\n6) C')
    setSubmissions(
      [
        'Alice',
        '1) a',
        '2) b',
        '3) c',
        '4) a',
        '5) c',
        '6) c',
        '',
        'Bob',
        '1a',
        '2b',
        '3) D',
        '4) a',
        '5) b',
        '6) a',
        '',
        'Charlie',
        'ABCABC',
      ].join('\n')
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(60,130,246,0.08),transparent_60%),linear-gradient(to_bottom_right,#f6f7fb,#ffffff)] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">ABC Test Auto‑Grader</h1>
            <a href="/test" className="hidden md:inline-flex text-slate-700 hover:text-slate-900 text-sm underline-offset-4 hover:underline">Check backend</a>
          </div>
          <p className="mt-3 text-slate-600 text-base md:text-lg max-w-3xl">Paste the key and submissions. Formatting quirks like dots, parentheses, hyphens, spaces, and case are handled automatically.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="relative overflow-hidden bg-white/70 backdrop-blur border border-slate-200 shadow-sm rounded-2xl p-6 transition">
            <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(40%_60%_at_50%_0%,black,transparent)] bg-gradient-to-b from-white/60 to-transparent" />
            <div className="relative space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500 mb-2">Answer Key</label>
                <textarea
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  rows={10}
                  className="w-full bg-white/70 backdrop-blur border border-slate-300/70 focus:border-slate-400 rounded-xl p-4 focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400"
                  placeholder="Example:\n1) A\n2) B\n3) C\n...\nOr compact: ABCABC"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500 mb-2">Student Submissions</label>
                <textarea
                  value={submissions}
                  onChange={(e) => setSubmissions(e.target.value)}
                  rows={10}
                  className="w-full bg-white/70 backdrop-blur border border-slate-300/70 focus:border-slate-400 rounded-xl p-4 focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400"
                  placeholder={`Example:\nAlice\n1) a\n2) b\n3) c\n\nBob\n1a\n2b\n3c`}
                />
                <p className="text-xs text-slate-500 mt-2">First non‑empty line in each block is the student name. Answers can be like "1a", "1. A", "1) a", or compact "ABC…".</p>
              </div>
              {error && (
                <div className="text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Grading…' : 'Grade Now'}
                </button>
                <button
                  type="button"
                  onClick={fillSample}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 bg-white text-slate-900 border border-slate-300 hover:border-slate-400 shadow-sm text-sm font-medium transition"
                >
                  Fill Sample
                </button>
                <a href="/test" className="md:hidden ml-auto text-slate-700 hover:text-slate-900 text-sm underline-offset-4 hover:underline">Check backend</a>
              </div>
            </div>
          </form>

          <div className="bg-white/70 backdrop-blur border border-slate-200 shadow-sm rounded-2xl p-6 overflow-auto">
            {!result ? (
              <div className="text-slate-500">
                Results will appear here. After grading, you'll see per‑student reports, ranking, and most‑missed questions.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Summary</h2>
                  <button onClick={downloadReport} className="inline-flex items-center rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-black transition">Download Report</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Total students</p>
                    <p className="text-3xl font-semibold">{result.summary.total_students}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Most missed</p>
                    {result.summary.most_missed_questions?.length ? (
                      <ul className="text-sm text-slate-800 list-disc ml-5">
                        {result.summary.most_missed_questions.map((q) => (
                          <li key={q.question}>Q{q.question}: missed by {q.missed_by}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-800">—</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold tracking-tight mb-3">Ranking</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/60">
                        <tr className="text-left text-slate-600">
                          <th className="py-2.5 pl-4 pr-4">#</th>
                          <th className="py-2.5 pr-4">Name</th>
                          <th className="py-2.5 pr-4">Score</th>
                          <th className="py-2.5 pr-4">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.summary.ranking.map((r, idx) => (
                          <tr key={r.name} className="border-t border-slate-100">
                            <td className="py-2.5 pl-4 pr-4">{idx + 1}</td>
                            <td className="py-2.5 pr-4">{r.name}</td>
                            <td className="py-2.5 pr-4">{r.raw_score}</td>
                            <td className="py-2.5 pr-4">{r.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="font-semibold tracking-tight">Per‑student reports</h3>
                  {result.reports.map((r) => (
                    <div key={r.name} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-lg font-semibold">{r.name}</span>
                        <span className="text-sm text-slate-700">{r.raw_score}/{r.total_questions} ({r.percentage}%)</span>
                        <span className="ml-auto text-xs rounded-full border border-slate-300 px-2 py-0.5 text-slate-700 bg-slate-50">{r.suggested_grade}</span>
                      </div>
                      {r.missed.length ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50/60">
                              <tr className="text-left text-slate-600">
                                <th className="py-2 pl-3 pr-4">Question</th>
                                <th className="py-2 pr-4">Student</th>
                                <th className="py-2 pr-4">Key</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.missed.map((m) => (
                                <tr key={m.question} className="border-t border-slate-100">
                                  <td className="py-2 pl-3 pr-4">{m.question}</td>
                                  <td className="py-2 pr-4">{m.student_answer || '—'}</td>
                                  <td className="py-2 pr-4">{m.correct_answer}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-emerald-700">Perfect score. No misses.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
