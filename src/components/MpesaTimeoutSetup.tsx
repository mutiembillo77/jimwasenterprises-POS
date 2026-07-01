import { useState } from 'react';
import {
  Clock,
  Copy,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  generateTimeoutURL,
  validateTimeoutURL,
  testTimeoutURL,
  getDeploymentGuide,
  suggestTimeoutURL,
} from '../lib/mpesa-timeout-url';

interface MpesaTimeoutSetupProps {
  timeoutUrl?: string;
  onUrlChange: (url: string) => void;
  isEditing?: boolean;
}

export function MpesaTimeoutSetup({ timeoutUrl, onUrlChange, isEditing = false }: MpesaTimeoutSetupProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'test' | 'guide'>('setup');
  const [customUrl, setCustomUrl] = useState(timeoutUrl || '');
  const [deploymentType, setDeploymentType] = useState<'auto' | 'vercel' | 'firebase' | 'aws' | 'custom' | 'ngrok'>('auto');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestion = suggestTimeoutURL();

  const handleValidate = async () => {
    if (!customUrl) {
      setValidationResult({ error: 'Please enter a timeout URL' });
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateTimeoutURL(customUrl);
      setValidationResult(result);
    } finally {
      setIsValidating(false);
    }
  };

  const handleTest = async () => {
    if (!customUrl) {
      setTestResult({ error: 'Please enter a timeout URL' });
      return;
    }

    setIsTesting(true);
    try {
      const result = await testTimeoutURL(customUrl);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySuggestion = () => {
    setCustomUrl(suggestion.suggested_url);
    setDeploymentType(suggestion.deployment_type as any);
  };

  const deploymentGuide = deploymentType !== 'auto' ? getDeploymentGuide(deploymentType) : null;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-700 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <Clock className="text-blue-400" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">M-Pesa Timeout URL</h3>
            <p className="text-sm text-slate-400">
              Called when STK PUSH prompt expires or customer cancels payment
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {['setup', 'test', 'guide'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'setup' && 'Setup'}
            {tab === 'test' && 'Test'}
            {tab === 'guide' && 'Guide'}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Auto-Suggestion */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300">Suggested Timeout URL</p>
                  <p className="text-xs text-blue-200 mt-1 mb-3">
                    Based on your current environment: <span className="font-mono">{suggestion.deployment_type}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-slate-900 p-2 rounded text-blue-200 font-mono truncate">
                      {suggestion.suggested_url}
                    </code>
                    <button
                      onClick={() => handleCopy(suggestion.suggested_url)}
                      className="p-2 hover:bg-slate-700 rounded transition"
                      title="Copy URL"
                    >
                      <Copy size={16} className="text-blue-400" />
                    </button>
                    <button
                      onClick={handleApplySuggestion}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Timeout URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/mpesa/timeout"
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                  disabled={!isEditing}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                M-Pesa will POST timeout notifications to this endpoint
              </p>
            </div>

            {/* Deployment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Deployment Type</label>
              <select
                value={deploymentType}
                onChange={(e) => setDeploymentType(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                disabled={!isEditing}
              >
                <option value="auto">Auto-Detect</option>
                <option value="vercel">Vercel</option>
                <option value="firebase">Firebase Cloud Functions</option>
                <option value="aws">AWS Lambda</option>
                <option value="custom">Custom VPS/Server</option>
                <option value="ngrok">Ngrok (Development)</option>
              </select>
            </div>

            {/* Validation Button */}
            {isEditing && (
              <button
                onClick={handleValidate}
                disabled={isValidating || !customUrl}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isValidating ? 'Validating...' : 'Validate URL'}
              </button>
            )}

            {/* Validation Result */}
            {validationResult && (
              <div className={`rounded-lg p-4 ${validationResult.valid ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'}`}>
                <div className="flex items-start gap-2">
                  {validationResult.valid ? (
                    <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                      {validationResult.valid ? 'URL is valid' : 'Validation failed'}
                    </p>
                    {validationResult.errors && validationResult.errors.length > 0 && (
                      <ul className="text-xs mt-2 space-y-1">
                        {validationResult.errors.map((error: string, idx: number) => (
                          <li key={idx} className={validationResult.valid ? 'text-emerald-200' : 'text-red-200'}>
                            • {error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
              <p className="text-sm text-amber-200">
                Send a sample timeout webhook to verify your endpoint is working correctly
              </p>
            </div>

            {isEditing && (
              <button
                onClick={handleTest}
                disabled={isTesting || !customUrl}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isTesting ? 'Sending test...' : 'Send Test Webhook'}
              </button>
            )}

            {testResult && (
              <div className={`rounded-lg p-4 ${testResult.success ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'}`}>
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${testResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                    {testResult.success ? 'Test successful' : 'Test failed'}
                  </p>
                  {testResult.statusCode && (
                    <p className="text-xs text-slate-300">
                      Response Code: <span className="font-mono">{testResult.statusCode}</span>
                    </p>
                  )}
                  {testResult.error && (
                    <p className={`text-xs ${testResult.success ? 'text-emerald-200' : 'text-red-200'}`}>
                      {testResult.error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {deploymentGuide && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Setup Steps for {deploymentGuide.deployment}</h4>
                  <ol className="space-y-2">
                    {deploymentGuide.setup_steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="font-bold text-blue-400 flex-shrink-0">{idx + 1}.</span>
                        <span className="text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Endpoint URL Format:</p>
                  <code className="text-xs text-blue-200 font-mono block bg-slate-800 p-2 rounded truncate">
                    {deploymentGuide.endpoint_url_format}
                  </code>
                </div>

                {deploymentGuide.notes && deploymentGuide.notes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Important Notes:</p>
                    <ul className="space-y-1">
                      {deploymentGuide.notes.map((note, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-300">
                          <span className="text-blue-400">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!deploymentGuide && (
              <div className="text-center py-6">
                <HelpCircle className="mx-auto text-slate-400 mb-2" size={24} />
                <p className="text-sm text-slate-400">Select a deployment type to view setup instructions</p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-slate-700 rounded-lg p-4 space-y-3">
          <p className="text-sm text-slate-300 flex items-start gap-2">
            <HelpCircle size={16} className="flex-shrink-0 mt-0.5 text-blue-400" />
            <span>Timeout webhooks are sent when:</span>
          </p>
          <ul className="text-sm text-slate-400 space-y-1 pl-7">
            <li>• Customer cancels the M-Pesa prompt</li>
            <li>• STK PUSH prompt expires (default 2 minutes)</li>
            <li>• Network error prevents completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
