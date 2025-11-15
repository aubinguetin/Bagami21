 'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  User,
  Shield,
  Lock,
  Globe,
  DollarSign,
  ChevronRight,
  X,
  Upload,
  Camera,
  FileText,
  CreditCard,
  CheckCircle,
  Eye,
  Trash2
} from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT, useLocale } from '@/lib/i18n-helpers';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { settings } = useT();
  const locale = useLocale();
  
  // Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'national_id' | 'passport' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    front?: File
    back?: File
    passport?: File
  }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Existing ID documents state
  const [documents, setDocuments] = useState<Array<{
    id: string;
    documentType: 'national_id' | 'passport' | string;
    frontImagePath: string | null;
    backImagePath: string | null;
    verificationStatus: string;
    uploadedAt: string;
  }>>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!session?.user?.id) return;
    setLoadingDocs(true);
    setDocsError(null);
    try {
      const res = await fetch('/api/id-documents', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load documents');
      setDocuments(data.documents || []);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (showVerifyModal) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVerifyModal, session?.user?.id]);

  // Load documents on initial mount to show status
  useEffect(() => {
    if (session?.user?.id) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: 'front' | 'back' | 'passport', file: File) => {
    // Simple client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      alert(settings('verifyIDModal.errors.invalidFileType'))
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert(settings('verifyIDModal.errors.fileSizeTooLarge'))
      return
    }

    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const handleSubmit = async () => {
    if (!selectedType) return

    const requiredFiles = selectedType === 'national_id' 
      ? ['front', 'back'] 
      : ['passport']

    const missingFiles = requiredFiles.filter(file => !uploadedFiles[file as keyof typeof uploadedFiles])
    
    if (missingFiles.length > 0) {
      alert(settings('verifyIDModal.errors.missingDocuments'))
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('documentType', selectedType)
      
      if (selectedType === 'national_id') {
        if (uploadedFiles.front) formData.append('frontImage', uploadedFiles.front)
        if (uploadedFiles.back) formData.append('backImage', uploadedFiles.back)
      } else if (selectedType === 'passport') {
        if (uploadedFiles.passport) formData.append('frontImage', uploadedFiles.passport)
      }

      const response = await fetch('/api/id-documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = settings('verifyIDModal.errors.uploadFailed')
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // Response is not JSON (likely HTML error page)
            errorMessage = `Server error (${response.status})`
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      setUploadSuccess(true)
      // Refresh existing documents list
      loadDocuments()
      
      setTimeout(() => {
        setShowVerifyModal(false)
        setUploadSuccess(false)
        setSelectedType(null)
        setUploadedFiles({})
      }, 2000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`${settings('verifyIDModal.errors.uploadFailed')}: ${error instanceof Error ? error.message : settings('verifyIDModal.errors.unknownError')}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const returnUrl = searchParams.get('returnUrl');
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.push('/profile');
                }
              }}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-semibold text-gray-900">{settings('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-16"></div>

      {/* Settings Content */}
      <div className="px-4 py-4 space-y-3 max-w-md mx-auto">
        
        {/* Account Settings Section */}
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/settings/my-information')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{settings('accountSettings.myInformation')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button 
            onClick={() => setShowVerifyModal(true)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-gray-600" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{settings('accountSettings.verifyMyID')}</span>
                {documents.length > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    documents[0].verificationStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : documents[0].verificationStatus === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {documents[0].verificationStatus === 'approved'
                      ? settings('accountSettings.verified')
                      : documents[0].verificationStatus === 'rejected'
                      ? settings('accountSettings.rejected')
                      : settings('accountSettings.pending')}
                  </span>
                )}
                {documents.length === 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {settings('accountSettings.notVerified')}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <Lock className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{settings('accountSettings.password')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Preferences Section */}
        <div className="space-y-1">
          {/* Language Switcher */}
          <div className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{settings('preferences.language')}</span>
            </div>
            <LanguageSwitcher />
          </div>

          <button 
            onClick={() => alert(locale === 'fr' ? 'Plus de devises seront bientôt disponibles.' : 'More currencies coming soon.')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{settings('preferences.currency')}</span>
            </div>
            <span className="text-sm text-gray-500">FCFA (XOF)</span>
          </button>
        </div>

        {/* Terms and Policy Section */}
        <div className="space-y-1">
          <a 
            href="/terms-and-policy"
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{settings('termsAndPolicy')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
        </div>

      </div>

      {/* Verify ID Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">{settings('verifyIDModal.title')}</h2>
              <button
                onClick={() => {
                  setShowVerifyModal(false)
                  setSelectedType(null)
                  setUploadedFiles({})
                  setUploadSuccess(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {!session ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">{settings('verifyIDModal.signInPrompt')}</p>
                  <button 
                    onClick={() => {
                      setShowVerifyModal(false)
                      router.push('/auth')
                    }}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {settings('verifyIDModal.signInButton')}
                  </button>
                </div>
              ) : uploadSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{settings('verifyIDModal.successMessage')}</h3>
                  <p className="text-gray-600">{settings('verifyIDModal.successMessage')}</p>
                </div>
              ) : (
                <>
                  {/* Existing Documents Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">{settings('verifyIDModal.existingDocuments')}</h3>
                      {loadingDocs && <span className="text-xs text-gray-500">{settings('verifyIDModal.loading')}</span>}
                    </div>
                    {docsError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{docsError}</div>
                    )}
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-xl p-3">
                            <div className="flex items-start gap-3">
                              {doc.documentType === 'passport' ? (
                                <FileText className="w-6 h-6 text-blue-500" />
                              ) : (
                                <CreditCard className="w-6 h-6 text-orange-500" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-800 capitalize">
                                    {settings(`verifyIDModal.documentType.${doc.documentType}`)}
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    doc.verificationStatus === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : doc.verificationStatus === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {doc.verificationStatus === 'approved'
                                      ? settings('verifyIDModal.status.approved')
                                      : doc.verificationStatus === 'rejected'
                                      ? settings('verifyIDModal.status.rejected')
                                      : settings('verifyIDModal.status.pending')}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                  {settings('verifyIDModal.uploadedOn')} {new Date(doc.uploadedAt).toLocaleString()}
                                </div>
                                
                                {/* Action Buttons - Now below upload time */}
                                <div className="flex items-center gap-2 mb-3">
                                  <button
                                    onClick={() => {
                                      if (doc.frontImagePath) window.open(doc.frontImagePath, '_blank')
                                      if (doc.backImagePath) window.open(doc.backImagePath, '_blank')
                                    }}
                                    className="text-gray-700 hover:text-orange-600 text-xs px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> {settings('verifyIDModal.viewDocument')}
                                  </button>
                                  <button
                                    onClick={() => setSelectedType(doc.documentType as any)}
                                    className="text-gray-700 hover:text-orange-600 text-xs px-2 py-1 rounded-md border border-gray-200"
                                  >
                                    {settings('verifyIDModal.replace')}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(settings('verifyIDModal.deleteConfirm'))) return;
                                      try {
                                        const res = await fetch('/api/id-documents', {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ id: doc.id })
                                        })
                                        const data = await res.json()
                                        if (!res.ok) throw new Error(data.error || settings('verifyIDModal.errors.deleteFailed'))
                                        await loadDocuments()
                                      } catch (e) {
                                        alert(e instanceof Error ? e.message : settings('verifyIDModal.errors.deleteFailed'))
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded-md border border-red-200 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> {settings('verifyIDModal.deleteDocument')}
                                  </button>
                                </div>
                                
                                {/* Document Images */}
                                <div className="flex gap-2">
                                  {doc.frontImagePath && (
                                    <img src={doc.frontImagePath} alt="Front" className="w-20 h-14 object-cover rounded-lg border" />
                                  )}
                                  {doc.backImagePath && (
                                    <img src={doc.backImagePath} alt="Back" className="w-20 h-14 object-cover rounded-lg border" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">{settings('verifyIDModal.noDocuments')}</div>
                    )}
                  </div>

                  {/* Document Type Selection */}
                  {!selectedType && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{settings('verifyIDModal.selectDocumentType')}</h3>
                      
                      <button
                        onClick={() => setSelectedType('national_id')}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-8 h-8 text-orange-500" />
                          <div>
                            <h4 className="font-medium text-gray-800">{settings('verifyIDModal.nationalID')}</h4>
                            <p className="text-sm text-gray-500">{settings('verifyIDModal.nationalIDDescription')}</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedType('passport')}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-800">{settings('verifyIDModal.passport')}</h4>
                            <p className="text-sm text-gray-500">{settings('verifyIDModal.passportDescription')}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* File Upload Section */}
                  {selectedType && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {settings('verifyIDModal.uploadTitle')} {selectedType === 'national_id' ? settings('verifyIDModal.nationalID') : settings('verifyIDModal.passport')}
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedType(null)
                            setUploadedFiles({})
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          {settings('verifyIDModal.changeType')}
                        </button>
                      </div>

                      {selectedType === 'national_id' && (
                        <>
                          {/* Front Side */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{settings('verifyIDModal.uploadFront')}</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                              {uploadedFiles.front ? (
                                <div className="text-green-600">
                                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-xs font-medium">{uploadedFiles.front.name}</p>
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <Upload className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-xs mb-2">{settings('verifyIDModal.frontSidePrompt')}</p>
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => frontInputRef.current?.click()}
                                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Upload className="w-3 h-3" />
                                      {settings('verifyIDModal.browse')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.capture = 'environment'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) handleFileSelect('front', file)
                                        }
                                        input.click()
                                      }}
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Camera className="w-3 h-3" />
                                      {settings('verifyIDModal.takePhoto')}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <input
                              ref={frontInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect('front', file)
                              }}
                              className="hidden"
                            />
                          </div>

                          {/* Back Side */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{settings('verifyIDModal.uploadBack')}</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                              {uploadedFiles.back ? (
                                <div className="text-green-600">
                                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-xs font-medium">{uploadedFiles.back.name}</p>
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <Upload className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-xs mb-2">{settings('verifyIDModal.backSidePrompt')}</p>
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => backInputRef.current?.click()}
                                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Upload className="w-3 h-3" />
                                      {settings('verifyIDModal.browse')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.capture = 'environment'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) handleFileSelect('back', file)
                                        }
                                        input.click()
                                      }}
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Camera className="w-3 h-3" />
                                      {settings('verifyIDModal.takePhoto')}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <input
                              ref={backInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect('back', file)
                              }}
                              className="hidden"
                            />
                          </div>
                        </>
                      )}

                      {selectedType === 'passport' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">{settings('verifyIDModal.uploadPassport')}</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                            {uploadedFiles.passport ? (
                              <div className="text-green-600">
                                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs font-medium">{uploadedFiles.passport.name}</p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <Upload className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-xs mb-2">{settings('verifyIDModal.passportPrompt')}</p>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => passportInputRef.current?.click()}
                                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    {settings('verifyIDModal.browse')}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input')
                                      input.type = 'file'
                                      input.accept = 'image/*'
                                      input.capture = 'environment'
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) handleFileSelect('passport', file)
                                      }
                                      input.click()
                                    }}
                                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <Camera className="w-3 h-3" />
                                    {settings('verifyIDModal.takePhoto')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <input
                            ref={passportInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileSelect('passport', file)
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={uploading || (
                          selectedType === 'national_id' 
                            ? !uploadedFiles.front || !uploadedFiles.back
                            : !uploadedFiles.passport
                        )}
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {uploading ? settings('verifyIDModal.uploading') : settings('verifyIDModal.uploadDocuments')}
                      </button>
                    </div>
                  )}

                  {/* Info Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-800">
                      <strong>{settings('verifyIDModal.noteTitle')}</strong> {settings('verifyIDModal.noteText')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}