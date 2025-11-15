'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiFileText, FiSave, FiEye, FiEdit, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function TermsPolicyPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load existing terms and policy
  useEffect(() => {
    const fetchTermsPolicy = async () => {
      try {
        const response = await fetch('/api/backoffice/terms-policy');
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || getDefaultTemplate());
        } else {
          setContent(getDefaultTemplate());
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        setContent(getDefaultTemplate());
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsPolicy();
  }, []);

  const getDefaultTemplate = () => {
    return `<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;">
  <h1 style="color: #f97316; border-bottom: 3px solid #f97316; padding-bottom: 10px; margin-bottom: 20px;">
    TERMS AND POLICY
  </h1>
  
  <p style="margin-bottom: 15px;">
    Welcome to Bagami! By using our platform, you agree to these terms and policies.
  </p>
  
  <h2 style="color: #1e293b; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em;">
    1. USER RESPONSIBILITIES
  </h2>
  <p style="margin-bottom: 15px;">
    Users must provide accurate information and use the platform responsibly.
  </p>
  
  <h2 style="color: #1e293b; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em;">
    2. PRIVACY POLICY
  </h2>
  <p style="margin-bottom: 15px;">
    We are committed to protecting your privacy and personal data.
  </p>
  
  <h2 style="color: #1e293b; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em;">
    3. PAYMENT TERMS
  </h2>
  <p style="margin-bottom: 15px;">
    All payments are processed securely through our platform.
  </p>
  
  <h2 style="color: #1e293b; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em;">
    4. DELIVERY TERMS
  </h2>
  <ul style="margin-bottom: 15px; padding-left: 20px;">
    <li>Travelers must declare all items they are carrying</li>
    <li>Senders must accurately describe items</li>
    <li>Prohibited items cannot be transported</li>
  </ul>
  
  <h2 style="color: #1e293b; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em;">
    5. CONTACT INFORMATION
  </h2>
  <p style="margin-bottom: 15px;">
    For questions or concerns, please contact us at <a href="mailto:support@bagami.com" style="color: #f97316;">support@bagami.com</a>
  </p>
</div>`;
  };

  const handleSave = async () => {
    setError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/backoffice/terms-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          adminId: session?.user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save terms and policy');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save terms and policy');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
              <FiFileText className="w-8 h-8 text-white" />
            </div>
            Terms and Policy
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your platform&apos;s terms and policy content
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isPreview ? (
              <>
                <FiEdit className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4" />
                Preview
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Changes Saved Successfully!</h3>
            <p className="text-sm text-green-700 mt-1">
              The terms and policy have been updated and are now visible to users.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Editor / Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isPreview ? (
          <div className="p-8 min-h-[500px]">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-300px)]">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">HTML Editor</h3>
              <p className="text-sm text-slate-600 mt-1">
                Write your terms and policy using HTML. Use inline styles for formatting.
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-6 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset bg-white"
                placeholder="Enter HTML content here..."
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* HTML Tips */}
      {!isPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">HTML Formatting Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use <code className="bg-blue-100 px-1 rounded">&lt;h1&gt;</code>, <code className="bg-blue-100 px-1 rounded">&lt;h2&gt;</code> for headings</li>
            <li>Use <code className="bg-blue-100 px-1 rounded">&lt;p&gt;</code> for paragraphs</li>
            <li>Use <code className="bg-blue-100 px-1 rounded">&lt;ul&gt;</code> and <code className="bg-blue-100 px-1 rounded">&lt;li&gt;</code> for lists</li>
            <li>Use inline CSS with <code className="bg-blue-100 px-1 rounded">style=&quot;&quot;</code> for custom styling</li>
            <li>Example: <code className="bg-blue-100 px-1 rounded">&lt;p style=&quot;color: red;&quot;&gt;Text&lt;/p&gt;</code></li>
          </ul>
        </div>
      )}

      {/* Public URL Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="font-semibold text-slate-900 mb-2">Public Access:</h4>
        <p className="text-sm text-slate-600 mb-2">
          Users can view the terms and policy at:
        </p>
        <a 
          href="/terms-and-policy" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-700 font-medium text-sm underline"
        >
          {typeof window !== 'undefined' ? window.location.origin : ''}/terms-and-policy
        </a>
      </div>
    </div>
  );
}
