import React from 'react'

// Minimal markdown renderer for legal documents (no external deps).
// Supports: ## / ### headings, "- " and "1. " lists, pipe tables,
// **bold**, [links](url), "---" dividers, paragraphs.

function renderBold(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) nodes.push(renderBold(text.slice(last, m.index), `${keyPrefix}-t${i}`))
    nodes.push(
      <a
        key={`${keyPrefix}-a${i}`}
        href={m[2]}
        className="text-sky-400 underline hover:text-sky-300"
        {...(m[2].startsWith('http')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {m[1]}
      </a>,
    )
    last = m.index + m[0].length
    i++
  }
  if (last < text.length) nodes.push(renderBold(text.slice(last), `${keyPrefix}-e`))
  return nodes
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function LegalMarkdown({ source }: { source: string }) {
  const lines = source.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={key++} className="text-xl font-semibold text-white mt-8 mb-3">
          {renderInline(trimmed.slice(4), `h3-${key}`)}
        </h3>,
      )
      i++
      continue
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const text = trimmed.startsWith('## ') ? trimmed.slice(3) : trimmed.slice(2)
      blocks.push(
        <h2 key={key++} className="text-2xl font-semibold text-white mt-10 mb-4">
          {renderInline(text, `h2-${key}`)}
        </h2>,
      )
      i++
      continue
    }

    if (trimmed === '---') {
      blocks.push(<hr key={key++} className="border-gray-700 my-8" />)
      i++
      continue
    }

    // Pipe table: header row followed by a |---| separator row
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())
    ) {
      const header = splitTableRow(trimmed)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i].trim()))
        i++
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {header.map((cell, c) => (
                  <th
                    key={c}
                    className="text-left text-white font-semibold border-b border-gray-600 py-2 pr-4"
                  >
                    {renderInline(cell, `th-${key}-${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="text-gray-300 border-b border-gray-800 py-2 pr-4 align-top">
                      {renderInline(cell, `td-${key}-${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Lists
    if (/^[-*] /.test(trimmed) || /^\d+\. /.test(trimmed)) {
      const ordered = /^\d+\. /.test(trimmed)
      const items: string[] = []
      while (i < lines.length) {
        const t = lines[i].trim()
        const match = ordered ? t.match(/^\d+\. (.*)/) : t.match(/^[-*] (.*)/)
        if (!match) break
        items.push(match[1])
        i++
      }
      const ListTag = ordered ? 'ol' : 'ul'
      blocks.push(
        <ListTag
          key={key++}
          className={`${ordered ? 'list-decimal' : 'list-disc'} pl-6 my-4 space-y-1 text-gray-300`}
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
          ))}
        </ListTag>,
      )
      continue
    }

    // Paragraph: consume until a blank line
    const para: string[] = []
    while (i < lines.length && lines[i].trim()) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push(
      <p key={key++} className="text-gray-300 my-4">
        {renderInline(para.join(' '), `p-${key}`)}
      </p>,
    )
  }

  return <div className="legal-doc max-w-none">{blocks}</div>
}
