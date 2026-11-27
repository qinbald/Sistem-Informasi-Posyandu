import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiErrorMessage, apiFollowUps } from '@/shared/lib/api'
import { formatDate } from '@/shared/lib/utils'
import { ROUTES } from '@/app/routes'
import { can } from '@/shared/lib/rbac'
import type { FollowUp, Role } from '@/shared/types'

type PendingFollowUpModalProps = {
  isOpen: boolean
  onClose: () => void
  posyanduId?: string
  scopeLabel: string
  role: Role | null | undefined
}

export function PendingFollowUpModal({
  isOpen,
  onClose,
  posyanduId,
  scopeLabel,
  role,
}: PendingFollowUpModalProps) {
  const [items, setItems] = useState<FollowUp[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canViewFollowUpPage = can(role, 'view-followup')

  const loadPending = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, unknown> = {
        status: 'pending',
        per_page: 50,
      }
      if (posyanduId) {
        params.posyandu_id = posyanduId
      }
      const res = await apiFollowUps.list(params)
      setItems(res.data)
      setTotal(res.meta?.total ?? res.data.length)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat daftar anak yang perlu pemantauan.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    void loadPending()
  }, [isOpen, posyanduId])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-followup-title"
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="px-5 pt-3 pb-4 sm:px-6 sm:pt-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 id="pending-followup-title" className="font-bold text-slate-900 text-base leading-tight">
                  Perlu Pemantauan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {scopeLabel} · {loading ? 'Memuat...' : `${total} menunggu tindak lanjut`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup ringkasan"
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white border border-slate-100 animate-pulse space-y-2"
                >
                  <div className="flex justify-between gap-2">
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-amber-100 rounded-full" />
                  </div>
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-56 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-5 text-center bg-white rounded-xl border border-red-100 space-y-3">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void loadPending()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-black transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 px-4 text-center bg-white rounded-xl border border-slate-100">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 text-lg">
                ✓
              </div>
              <p className="text-sm font-semibold text-slate-800">Semua sudah tertangani</p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada anak yang menunggu tindak lanjut pada cakupan ini.
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={ROUTES.childDetail(item.child_id)}
                  onClick={onClose}
                  className="block p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs active:bg-amber-50/40 transition group"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition truncate">
                          {item.child?.nama_lengkap || `Anak #${item.child_id}`}
                        </p>
                        {item.child?.nama_panggilan && (
                          <span className="text-xs text-slate-400 truncate">
                            ({item.child.nama_panggilan})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                          {item.type}
                        </span>
                        {item.posyandu?.nama_posyandu && (
                          <span className="text-[11px] text-slate-500">
                            · {item.posyandu.nama_posyandu}
                          </span>
                        )}
                      </div>

                      {item.follow_up_date && (
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Jadwal: <span className="font-medium text-slate-700">{formatDate(item.follow_up_date)}</span>
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <span
                      className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-700 flex items-center justify-center shrink-0 mt-0.5 transition text-base"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </div>
                </Link>
              ))}

              {total > items.length && (
                <p className="text-center text-[11px] text-slate-500 pt-1">
                  Menampilkan {items.length} dari {total} data. Buka halaman Tindak Lanjut untuk melihat semua.
                </p>
              )}
            </>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-slate-100 bg-white shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
          >
            Tutup
          </button>
          {canViewFollowUpPage && (
            <Link
              to={ROUTES.followUps}
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium text-center transition shadow-xs"
            >
              Kelola di Tindak Lanjut →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
