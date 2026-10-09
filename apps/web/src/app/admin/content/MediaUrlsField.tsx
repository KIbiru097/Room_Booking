"use client"

export default function MediaUrlsField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="mt-3 block rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <span className="font-bold text-[#0b1528]">Media URLs</span>
      <span className="mt-1 block text-xs text-slate-500">
        Add one verified image URL per line. URLs are stored with the place
        attribution record.
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://…"
        className="mt-2 min-h-16 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e4bd55]"
      />
    </label>
  )
}
