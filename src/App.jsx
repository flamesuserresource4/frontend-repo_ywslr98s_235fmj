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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">ABC Test Auto-Grader</h1>
          <p className="text-gray-600 mt-2">Paste the key and students' answers. We'll handle formatting quirks like dots, parentheses, hyphens, spaces, and case.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer Key</label>
              <textarea
                value={answerKey}
                onChange={(e) => setAnswerKey(e.target.value)}
                rows={10}
                className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example:\n1) A\n2) B\n3) C\n...\nOr compact: ABCABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Submissions</label>
              <textarea
                value={submissions}
                onChange={(e) => setSubmissions(e.target.value)}
                rows={10}
                className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Example:\nAlice\n1) a\n2) b\n3) c\n\nBob\n1a\n2b\n3c`}
              />
              <p className="text-xs text-gray-500 mt-2">Tip: First non-empty line in each block is the student name. Answers can be like "1a", "1. A", "1) a", "ABC...".</p>
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded"
              >
                {loading ? 'Grading…' : 'Grade Now'}
              </button>
              <button
                type="button"
                onClick={fillSample}
                className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded"
              >
                Fill Sample
              </button>
              <a href="/test" className="ml-auto text-blue-600 hover:underline">Check backend</a>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow p-5 overflow-auto">
            {!result ? (
              <div className="text-gray-500">
                Results will appear here. After grading, you'll see per-student reports, ranking, and most-missed questions.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
                  <button onClick={downloadReport} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm">Download Report</button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">Total students</p>
                    <p className="text-2xl font-bold">{result.summary.total_students}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">Most missed</p>
                    {result.summary.most_missed_questions?.length ? (
                      <ul className="text-sm text-gray-800 list-disc ml-5">
                        {result.summary.most_missed_questions.map((q) => (
                          <li key={q.question}>Q{q.question}: missed by {q.missed_by}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-800">—</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ranking</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Score</th>
                          <th className="py-2 pr-4">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.summary.ranking.map((r, idx) => (
                          <tr key={r.name} className="border-t border-gray-100">
                            <td className="py-2 pr-4">{idx + 1}</td>
                            <td className="py-2 pr-4">{r.name}</td>
                            <td className="py-2 pr-4">{r.raw_score}</td>
                            <td className="py-2 pr-4">{r.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Per-student reports</h3>
                  {result.reports.map((r) => (
                    <div key={r.name} className="border border-gray-200 rounded p-3">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-gray-800">{r.name}</span>
                        <span className="text-sm text-gray-700">{r.raw_score}/{r.total_questions} ({r.percentage}%)</span>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{r.suggested_grade}</span>
                      </div>
                      {r.missed.length ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-600">
                                <th className="py-1 pr-4">Question</th>
                                <th className="py-1 pr-4">Student</th>
                                <th className="py-1 pr-4">Key</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.missed.map((m) => (
                                <tr key={m.question} className="border-t border-gray-100">
                                  <td className="py-1 pr-4">{m.question}</td>
                                  <td className="py-1 pr-4">{m.student_answer || '—'}</td>
                                  <td className="py-1 pr-4">{m.correct_answer}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-green-700">Perfect score. No misses.</p>
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
