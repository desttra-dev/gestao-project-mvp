'use client'

interface Props {
  value: string
  options: { value: string; label: string }[]
}

export function MonthSelector({ value, options }: Props) {
  return (
    <form method="GET" action="/professor/historico">
      <select
        name="mes"
        defaultValue={value}
        onChange={e => (e.target.form as HTMLFormElement).submit()}
        style={{
          padding: '6px 10px', border: '1.5px solid #d4e8d4', borderRadius: '8px',
          fontSize: '13px', color: '#0d2e1e', background: 'white', cursor: 'pointer', outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label.charAt(0).toUpperCase() + o.label.slice(1)}
          </option>
        ))}
      </select>
    </form>
  )
}
