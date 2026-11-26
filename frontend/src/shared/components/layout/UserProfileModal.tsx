import { useState } from 'react'
import { apiUsers, apiErrorMessage } from '@/shared/lib/api'
import { showToast } from '@/shared/components/ui/toast'
import { Field, Input, Button } from '@/shared/components/ui/field'
import { ROLE_LABEL } from '@/shared/types'
import type { User } from '@/shared/types'

type UserProfileModalProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [view, setView] = useState<'profile' | 'change-password'>('profile')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen || !user) return null

  const handleClose = () => {
    setView('profile')
    setCurrentPassword('')
    setPassword('')
    setPasswordConfirmation('')
    setErrors({})
    onClose()
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const errs: Record<string, string> = {}
    if (!currentPassword) {
      errs.current_password = 'Password saat ini wajib diisi.'
    }
    if (password.length < 8) {
      errs.password = 'Password baru minimal 8 karakter.'
    }
    if (password !== passwordConfirmation) {
      errs.password_confirmation = 'Konfirmasi password baru tidak cocok.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await apiUsers.update(user.id, {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      showToast('Password Anda berhasil diperbarui.', 'success')
      handleClose()
    } catch (err: any) {
      const respErrors = err?.response?.data?.errors
      if (respErrors) {
        const mapped: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(respErrors)) {
          mapped[key] = Array.isArray(msgs) ? (msgs[0] as string) : String(msgs)
        }
        setErrors(mapped)
      } else {
        setErrors({ general: apiErrorMessage(err, 'Gagal memperbarui password. Periksa data Anda.') })
      }
    } finally {
      setLoading(false)
    }
  }

  const assignedPosyandus = user.posyandus?.length
    ? user.posyandus
    : user.posyandu
      ? [user.posyandu]
      : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="mobile-dialog-panel w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view === 'change-password' && (
              <button
                type="button"
                onClick={() => {
                  setView('profile')
                  setErrors({})
                }}
                className="text-slate-400 hover:text-slate-700 mr-1 text-sm font-semibold transition"
                title="Kembali ke profil"
              >
                ←
              </button>
            )}
            <h3 className="font-bold text-slate-800">
              {view === 'profile' ? 'Profil Pengguna' : 'Ubah Kata Sandi'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {view === 'profile' ? (
          /* Tampilan Profil */
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-100 text-teal-800">
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Nomor Telepon</span>
                <span className="font-medium text-slate-800">{user.phone || '-'}</span>
              </div>

              {user.kader?.jabatan && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Jabatan Kader</span>
                  <span className="font-medium text-slate-800">{user.kader.jabatan}</span>
                </div>
              )}

              {user.parent?.nama_lengkap && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nama Orang Tua Terkait</span>
                  <span className="font-medium text-slate-800">{user.parent.nama_lengkap}</span>
                </div>
              )}

              <div className="py-2">
                <span className="text-slate-500 block mb-1.5">Penugasan Posyandu:</span>
                {assignedPosyandus.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {assignedPosyandus.map((p) => (
                      <span
                        key={p.id}
                        className="px-2.5 py-1 bg-teal-50 border border-teal-200/70 text-teal-800 rounded-lg text-[11px] font-medium"
                      >
                        {p.nama_posyandu} {p.kode_posyandu ? `(${p.kode_posyandu})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium text-slate-700">Semua Posyandu (Akses Penuh)</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setView('change-password')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition"
              >
                <span>🔑</span> Ubah Kata Sandi Akun
              </button>
              <Button type="button" variant="outline" onClick={handleClose}>
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          /* Form Ubah Password */
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {errors.general && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
                {errors.general}
              </div>
            )}

            <Field label="Password Saat Ini" required error={errors.current_password}>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (errors.current_password) setErrors((prev) => ({ ...prev, current_password: '' }))
                  }}
                  hasError={!!errors.current_password}
                  placeholder="Masukkan password saat ini"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? 'Tutup' : 'Lihat'}
                </button>
              </div>
            </Field>

            <Field label="Password Baru" required hint="Minimal 8 karakter" error={errors.password}>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  hasError={!!errors.password}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showNew ? 'Tutup' : 'Lihat'}
                </button>
              </div>
            </Field>

            <Field label="Konfirmasi Password Baru" required error={errors.password_confirmation}>
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value)
                  if (errors.password_confirmation) setErrors((prev) => ({ ...prev, password_confirmation: '' }))
                }}
                hasError={!!errors.password_confirmation}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                required
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setView('profile')
                  setErrors({})
                }}
                disabled={loading}
              >
                Kembali
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
