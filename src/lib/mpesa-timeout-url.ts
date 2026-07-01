// M-Pesa Timeout URL Configuration Manager
// Handles timeout URL generation, validation, and deployment scenarios
// Timeout URL is called by M-Pesa when STK PUSH prompt expires (user doesn't respond)

export interface TimeoutURLConfig {
  base_url: string;
  endpoint_path: string;
  full_url: string;
  deployment_type: 'vercel' | 'firebase' | 'custom' | 'localhost';
  is_public: boolean;
  verified: boolean;
  last_verified?: string;
}

export interface TimeoutDeploymentGuide {
  deployment: string;
  setup_steps: string[];
  endpoint_url_format: string;
  example_url: string;
  environment_setup: Record<string, string>;
  notes: string[];
}

/**
 * Generate timeout URL based on deployment environment
 */
export function generateTimeoutURL(
  baseUrl: string,
  endpointPath: string = '/api/mpesa/timeout'
): TimeoutURLConfig {
  try {
    const url = new URL(endpointPath, baseUrl);
    const fullUrl = url.toString();

    // Validate URL
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      throw new Error('Timeout URL must use HTTP or HTTPS');
    }

    // Determine deployment type
    let deploymentType: 'vercel' | 'firebase' | 'custom' | 'localhost' = 'custom';
    if (baseUrl.includes('vercel.app')) deploymentType = 'vercel';
    else if (baseUrl.includes('firebase') || baseUrl.includes('cloudfunctions.net')) deploymentType = 'firebase';
    else if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) deploymentType = 'localhost';

    return {
      base_url: baseUrl,
      endpoint_path: endpointPath,
      full_url: fullUrl,
      deployment_type: deploymentType,
      is_public: !deploymentType.includes('localhost'),
      verified: false,
    };
  } catch (error) {
    throw new Error(`Invalid timeout URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate timeout URL format and accessibility
 */
export async function validateTimeoutURL(timeoutUrl: string): Promise<{
  valid: boolean;
  reachable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let reachable = false;

  // Basic format validation
  try {
    new URL(timeoutUrl);
  } catch {
    errors.push('Invalid URL format');
    return { valid: false, reachable: false, errors };
  }

  // Check if HTTPS (required for production)
  if (!timeoutUrl.startsWith('https://')) {
    if (timeoutUrl.includes('localhost') || timeoutUrl.includes('127.0.0.1')) {
      // Local dev is OK with HTTP
    } else {
      errors.push('Production timeout URLs must use HTTPS');
    }
  }

  // Check reachability with HEAD request
  try {
    const response = await fetch(timeoutUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'M-Pesa-Timeout-Validator/1.0',
      },
    });

    reachable = response.ok || response.status === 405; // 405 OK for timeouts (POST only)
  } catch (error) {
    errors.push(`URL not reachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const valid = errors.length === 0;
  return { valid, reachable, errors };
}

/**
 * Test timeout URL with sample M-Pesa timeout payload
 */
export async function testTimeoutURL(timeoutUrl: string): Promise<{
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
}> {
  try {
    // Sample M-Pesa timeout webhook payload
    const samplePayload = {
      Result: {
        ResultType: 0,
        ResultCode: 1032,
        ResultDesc: 'Request cancelled by user',
        OriginatorConversationID: 'TEST-CONV-ID-12345',
        ConversationID: 'AG_20231215_123456789abcdef',
        TransactionID: 'TEST-TXN-12345',
        ReferenceData: {
          ReferenceItem: [
            {
              Key: 'CheckoutRequestID',
              Value: 'TEST-CHECKOUT-REQUEST-ID',
            },
          ],
        },
      },
    };

    const response = await fetch(timeoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'M-Pesa-Timeout-Tester/1.0',
      },
      body: JSON.stringify(samplePayload),
    });

    const responseData = await response.text();

    return {
      success: response.ok || response.status === 200,
      statusCode: response.status,
      response: responseData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test timeout URL',
    };
  }
}

/**
 * Get deployment guide for timeout URL setup
 */
export function getDeploymentGuide(deploymentType: string): TimeoutDeploymentGuide | null {
  const guides: Record<string, TimeoutDeploymentGuide> = {
    vercel: {
      deployment: 'Vercel',
      setup_steps: [
        'Create a new API route: `pages/api/mpesa/timeout.js` or `app/api/mpesa/timeout/route.js`',
        'Export a POST handler that processes timeout webhooks',
        'Use the handler to update transaction status to "timed_out"',
        'Trigger polling retry or manual verification',
        'Deploy to Vercel',
        'Copy your deployment URL: `https://your-app.vercel.app`',
        'Set Timeout URL as: `https://your-app.vercel.app/api/mpesa/timeout`',
      ],
      endpoint_url_format: 'https://<your-project>.vercel.app/api/mpesa/timeout',
      example_url: 'https://my-pos-system.vercel.app/api/mpesa/timeout',
      environment_setup: {
        'MPESA_TIMEOUT_URL': 'https://your-app.vercel.app/api/mpesa/timeout',
        'MPESA_TIMEOUT_WEBHOOK_SECRET': 'your-secret-key',
      },
      notes: [
        'Vercel automatically scales and handles HTTPS',
        'Timeout webhooks are sent when user cancels or times out',
        'Store the secret in environment variables for validation',
        'Test with sample payloads before going live',
      ],
    },
    firebase: {
      deployment: 'Firebase Cloud Functions',
      setup_steps: [
        'Create a new Cloud Function: `npm install -g firebase-tools`',
        'Initialize Firebase: `firebase init functions`',
        'Create a timeout webhook handler in `functions/index.js`',
        'Export a function named `mpesaTimeout`',
        'Deploy: `firebase deploy --only functions:mpesaTimeout`',
        'Copy your function URL from Firebase Console',
        'Set Timeout URL to your function endpoint',
      ],
      endpoint_url_format: 'https://us-central1-<project-id>.cloudfunctions.net/mpesaTimeout',
      example_url: 'https://us-central1-my-pos-project.cloudfunctions.net/mpesaTimeout',
      environment_setup: {
        'MPESA_TIMEOUT_URL': 'https://us-central1-<project-id>.cloudfunctions.net/mpesaTimeout',
        'MPESA_TIMEOUT_WEBHOOK_SECRET': 'your-secret-key',
      },
      notes: [
        'Firebase functions are serverless and scale automatically',
        'Always use HTTPS (Firebase provides it)',
        'Set up environment variables in Firebase console',
        'Keep function execution time under 60 seconds',
      ],
    },
    aws: {
      deployment: 'AWS Lambda',
      setup_steps: [
        'Create a Lambda function for timeout handling',
        'Use AWS API Gateway to create an HTTP trigger',
        'Configure the timeout webhook handler',
        'Set environment variables for the function',
        'Deploy and copy your API Gateway URL',
        'Set Timeout URL as your API Gateway endpoint',
      ],
      endpoint_url_format: 'https://<api-id>.execute-api.<region>.amazonaws.com/prod/mpesa-timeout',
      example_url: 'https://abc123def.execute-api.us-east-1.amazonaws.com/prod/mpesa-timeout',
      environment_setup: {
        'MPESA_TIMEOUT_URL': 'https://<api-id>.execute-api.<region>.amazonaws.com/prod/mpesa-timeout',
        'MPESA_TIMEOUT_WEBHOOK_SECRET': 'your-secret-key',
      },
      notes: [
        'Lambda functions are event-driven and cost-effective',
        'API Gateway provides HTTPS endpoint',
        'Monitor CloudWatch logs for webhook processing',
        'Set appropriate memory and timeout for Lambda',
      ],
    },
    custom: {
      deployment: 'Custom VPS/Server',
      setup_steps: [
        'Set up a web server (Express.js, FastAPI, etc.)',
        'Create a timeout webhook endpoint',
        'Implement request validation and signing verification',
        'Process timeout events and update database',
        'Deploy on your server with public IP or domain',
        'Ensure HTTPS with SSL certificate (Let\'s Encrypt)',
        'Set Timeout URL to your endpoint',
      ],
      endpoint_url_format: 'https://your-domain.com/api/mpesa/timeout',
      example_url: 'https://pos-system.example.com/api/mpesa/timeout',
      environment_setup: {
        'MPESA_TIMEOUT_URL': 'https://your-domain.com/api/mpesa/timeout',
        'MPESA_TIMEOUT_WEBHOOK_SECRET': 'your-secret-key',
        'SSL_CERT_PATH': '/etc/ssl/certs/your-cert.pem',
      },
      notes: [
        'Ensure firewall allows HTTPS (port 443)',
        'Use SSL/TLS certificates (free with Let\'s Encrypt)',
        'Implement rate limiting for security',
        'Log all timeout events for debugging',
      ],
    },
    ngrok: {
      deployment: 'Ngrok (Local Development)',
      setup_steps: [
        'Install Ngrok: `npm install -g ngrok`',
        'Start your local server on port 3000 or 8000',
        'Run: `ngrok http 3000`',
        'Copy the HTTPS URL provided by Ngrok',
        'Append endpoint path: `https://<random>.ngrok.io/api/mpesa/timeout`',
        'Use this as your Timeout URL in M-Pesa settings',
        'Keep Ngrok terminal running during testing',
      ],
      endpoint_url_format: 'https://<random>.ngrok.io/api/mpesa/timeout',
      example_url: 'https://a1b2c3d4e5f6.ngrok.io/api/mpesa/timeout',
      environment_setup: {
        'MPESA_TIMEOUT_URL': 'https://<random>.ngrok.io/api/mpesa/timeout',
        'MPESA_TIMEOUT_WEBHOOK_SECRET': 'your-secret-key',
      },
      notes: [
        'Ngrok URLs change each session (use paid plan for fixed URLs)',
        'Perfect for development and testing',
        'Excellent for debugging webhook payloads',
        'Not recommended for production use',
      ],
    },
  };

  return guides[deploymentType] || null;
}

/**
 * Generate a timeout URL configuration based on current environment
 */
export function getDefaultTimeoutURL(): string {
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/mpesa/timeout`;
  }
  return 'https://your-domain.com/api/mpesa/timeout';
}

/**
 * Detect current environment and suggest appropriate timeout URL
 */
export function suggestTimeoutURL(): {
  suggested_url: string;
  deployment_type: string;
  setup_complexity: 'simple' | 'moderate' | 'complex';
  notes: string[];
} {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    if (origin.includes('vercel.app')) {
      return {
        suggested_url: `${origin}/api/mpesa/timeout`,
        deployment_type: 'vercel',
        setup_complexity: 'simple',
        notes: [
          'Vercel deployment detected',
          'HTTPS is automatically configured',
          'Use the suggested URL as-is',
        ],
      };
    }

    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return {
        suggested_url: `${origin}/api/mpesa/timeout`,
        deployment_type: 'localhost',
        setup_complexity: 'simple',
        notes: [
          'Local development detected',
          'Use Ngrok for testing with M-Pesa sandbox',
          'Ngrok will wrap your local server with HTTPS',
        ],
      };
    }

    return {
      suggested_url: `${origin}/api/mpesa/timeout`,
      deployment_type: 'custom',
      setup_complexity: 'moderate',
      notes: [
        'Custom domain detected',
        'Ensure HTTPS is enabled',
        'Have SSL certificate configured',
      ],
    };
  }

  return {
    suggested_url: 'https://your-domain.com/api/mpesa/timeout',
    deployment_type: 'custom',
    setup_complexity: 'moderate',
    notes: ['Server-side environment detected'],
  };
}
