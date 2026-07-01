// M-Pesa Callback URL Setup Component
// Helps users configure and test the callback URL

import { useState } from 'react';
import {
  Globe,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  generateCallbackURL,
  validateCallbackURL,
  getDeploymentGuide,
  testCallbackURL,
  getCommonCallbackURLs,
  type CallbackURLConfig,
} from '../lib/mpesa-callback-url';

interface MpesaCallbackSetupProps {
  currentCallbackUrl?: string;
  onCallbackUrlChange?: (url: string) => void;
  environment: 'sandbox' | 'production';
}

export function MpesaCallbackSetup({
  currentCallbackUrl = '',
  onCallbackUrlChange,
  environment,
}: MpesaCallbackSetupProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'test'>('select');
  const [selectedDeployment, setSelectedDeployment] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [customCallbackUrl, setCustomCallbackUrl] = useState<string>(currentCallbackUrl);
  const [callbackConfig, setCallbackConfig] = useState<CallbackURLConfig | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const deploymentGuides = [
    { key: 'vercel', name: 'Vercel (Recommended)', icon: '▲' },
    { key: 'firebase', name: 'Firebase Cloud Functions', icon: '🔥' },
    { key: 'aws_lambda', name: 'AWS Lambda', icon: '⚡' },
    { key: 'custom_vps', name: 'Custom VPS / Domain', icon: '🖥️' },
    { key: 'localhost_ngrok', name: 'Localhost with Ngrok (Dev)', icon: '🔗' },
  ];

  const commonUrls = getCommonCallbackURLs();

  const handleGenerateUrl = () => {
    if (!baseUrl) {
      alert('Please enter your base URL');
      return;
    }

    try {
      const config = generateCallbackURL(baseUrl);
      setCallbackConfig(config);
      setCustomCallbackUrl(config.full_url);
      onCallbackUrlChange?.(config.full_url);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleValidateUrl = async () => {
    if (!customCallbackUrl) {
      alert('Please enter a callback URL');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCallbackURL(customCallbackUrl);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        reachable: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestCallback = async () => {
    if (!customCallbackUrl) {
      alert('Please enter a callback URL');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testCallbackURL(customCallbackUrl);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(customCallbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedGuide = selectedDeployment ? getDeploymentGuide(selectedDeployment) : null;

  return (
    <div className="space-y-6">
      {/* Environment Warning */}
      {environment === 'production' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-200">Production Environment</p>
            <p className="text-sm text-red-300">Ensure callback URL is on a public HTTPS server with proper SSL certificate.</p>
          </div>
        </div>
      )}

      {/* Step 1: Select Deployment Type */}
      {step === 'select' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} />
            Where is your POS system deployed?
          </h3>
          <p className="text-slate-400 text-sm">
            Select your deployment platform to get specific callback URL configuration instructions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deploymentGuides.map((guide) => (
              <button
                key={guide.key}
                onClick={() => {
                  setSelectedDeployment(guide.key);
                  setStep('configure');
                }}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition border border-slate-600 hover:border-emerald-500"
              >
                <div className="text-2xl mb-2">{guide.icon}</div>
                <p className="font-medium text-white">{guide.name}</p>
              </button>
            ))}
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">
              <span className="font-medium">Not sure?</span> We recommend Vercel for easy deployment with automatic HTTPS and global CDN.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Configure URL */}
      {step === 'configure' && selectedGuide && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('select')}
            className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
          >
            ← Back to deployment selection
          </button>

          <h3 className="text-lg font-semibold text-white">{selectedGuide.deployment} Setup</h3>

          {/* Setup Steps */}
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-slate-300 text-sm">Setup Steps:</p>
            {selectedGuide.setup_steps.map((step, idx) => (
              <div key={idx} className="text-sm text-slate-400">
                {step}
              </div>
            ))}
          </div>

          {/* Manual URL Entry */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Your Callback URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCallbackUrl}
                onChange={(e) => setCustomCallbackUrl(e.target.value)}
                placeholder={selectedGuide.example_url}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                title="Copy URL"
              >
                {copied ? <CheckCircle size={18} className="text-emerald-400" /> : <Copy size={18} className="text-slate-400" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">Example: {selectedGuide.example_url}</p>
          </div>

          {/* Quick Select */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Or select from common patterns:</p>
            <div className="space-y-1">
              {Object.entries(commonUrls).map(([label, pattern]) => (
                <button
                  key={label}
                  onClick={() => setCustomCallbackUrl(pattern)}
                  className="w-full text-left px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleValidateUrl}
              disabled={isValidating || !customCallbackUrl}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {isValidating ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Validate URL
            </button>
            <button
              onClick={() => setStep('test')}
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              Next: Test
            </button>
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-lg border ${
                validationResult.valid
                  ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300'
                  : 'bg-red-900/20 border-red-700 text-red-300'
              } text-sm`}
            >
              {validationResult.valid ? (
                <p>✓ Callback URL format is valid</p>
              ) : (
                <div className="space-y-1">
                  {validationResult.errors.map((error, idx) => (
                    <p key={idx}>• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Test Callback */}
      {step === 'test' && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('configure')}
            className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
          >
            ← Back to configuration
          </button>

          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <RefreshCw size={20} />
            Test Callback Endpoint
          </h3>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-400">
              Test your callback URL by sending a sample M-Pesa webhook payload. This will help verify that your endpoint is properly configured.
            </p>
            <div className="bg-slate-800 rounded p-2 text-xs font-mono text-slate-300 overflow-auto max-h-40">
              Callback URL: {customCallbackUrl}
            </div>
          </div>

          <button
            onClick={handleTestCallback}
            disabled={isTesting || !customCallbackUrl}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {isTesting ? <RefreshCw size={18} className="animate-spin" /> : <ExternalLink size={18} />}
            {isTesting ? 'Testing...' : 'Send Test Webhook'}
          </button>

          {testResult && (
            <div
              className={`p-4 rounded-lg border space-y-2 ${
                testResult.success
                  ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300'
                  : 'bg-red-900/20 border-red-700 text-red-300'
              } text-sm`}
            >
              <p className="font-medium">
                {testResult.success ? '✓ Test Successful' : '✗ Test Failed'}
              </p>
              {testResult.statusCode && <p>Status Code: {testResult.statusCode}</p>}
              {testResult.responseTime && <p>Response Time: {testResult.responseTime}ms</p>}
              {testResult.errors?.length > 0 && (
                <div className="space-y-1">
                  {testResult.errors.map((error, idx) => (
                    <p key={idx}>• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex gap-3">
            <HelpCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-200 text-sm">Need Help?</p>
              <ul className="text-xs text-blue-300 mt-2 space-y-1">
                <li>• Ensure your callback endpoint accepts POST requests</li>
                <li>• Check that your server is running and reachable</li>
                <li>• Verify firewall/security group rules allow incoming webhooks</li>
                <li>• Use Ngrok for local testing during development</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => {
              onCallbackUrlChange?.(customCallbackUrl);
              setStep('select');
              setCustomCallbackUrl('');
              setValidationResult(null);
              setTestResult(null);
            }}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
          >
            Save Callback URL
          </button>
        </div>
      )}
    </div>
  );
}
