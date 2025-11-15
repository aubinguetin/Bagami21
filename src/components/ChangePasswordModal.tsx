"use client";

import React, { useState } from 'react'
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useT } from '@/lib/i18n-helpers'

type Props = {
  open: boolean
  onClose: () => void
}

const useSchema = () => {
  const { settings } = useT();
  return yup.object({
    currentPassword: yup.string().optional(),
    newPassword: yup
      .string()
      .required(settings('changePassword.requirements.newPasswordRequired'))
      .min(8, settings('changePassword.requirements.minLength'))
      .matches(/[A-Z]/, settings('changePassword.requirements.uppercase'))
      .matches(/[a-z]/, settings('changePassword.requirements.lowercase'))
      .matches(/[0-9]/, settings('changePassword.requirements.number'))
      .matches(/[^A-Za-z0-9]/, settings('changePassword.requirements.special')),
    confirmPassword: yup
      .string()
      .required(settings('changePassword.requirements.confirmRequired'))
      .oneOf([yup.ref('newPassword')], settings('changePassword.requirements.passwordsMatch')),
  })
}

type FormValues = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { settings } = useT();
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const schema = useSchema();
  const { register, handleSubmit, formState: { errors, isValid }, watch, reset } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || settings('changePassword.error'))
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        reset()
        onClose()
      }, 1200)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : settings('changePassword.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const newPassword = watch('newPassword') || ''
  const checks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  }
  const score = Object.values(checks).filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{settings('changePassword.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">{settings('changePassword.success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {apiError && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                  {apiError}
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{settings('changePassword.currentPassword.label')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('currentPassword')}
                    type={showCurrent ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder={settings('changePassword.currentPassword.placeholder')}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{settings('changePassword.currentPassword.hint')}</p>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{settings('changePassword.newPassword.label')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('newPassword')}
                    type={showNew ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder={settings('changePassword.newPassword.placeholder')}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                )}

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          score < 2 ? 'bg-red-500 w-1/5' :
                          score < 4 ? 'bg-yellow-500 w-3/5' :
                          score === 4 ? 'bg-orange-500 w-4/5' :
                          'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[11px]">
                      <div className={`${checks.length ? 'text-green-600' : 'text-gray-500'}`}>{settings('changePassword.requirements.lengthLabel')}</div>
                      <div className={`${checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>{settings('changePassword.requirements.uppercaseLabel')}</div>
                      <div className={`${checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>{settings('changePassword.requirements.lowercaseLabel')}</div>
                      <div className={`${checks.number ? 'text-green-600' : 'text-gray-500'}`}>{settings('changePassword.requirements.numberLabel')}</div>
                      <div className={`${checks.special ? 'text-green-600' : 'text-gray-500'}`}>{settings('changePassword.requirements.specialLabel')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{settings('changePassword.confirmPassword.label')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirm ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder={settings('changePassword.confirmPassword.placeholder')}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? settings('changePassword.submitting') : settings('changePassword.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
