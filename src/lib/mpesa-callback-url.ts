// M-Pesa Callback URL Configuration Manager
// Handles callback URL generation, validation, and deployment scenarios

export interface CallbackURLConfig {
  base_url: string;
  endpoint_path: string;
  full_url: string;
  deployment_type: 'vercel' | 'firebase' | 'custom' | 'localhost';
  is_public: boolean;
  verified: boolean;
  last_verified?: string;
}

export interface CallbackDeploymentGuide {
  deployment: string;
  setup_steps: string[];
  endpoint_url_format: string;
  example_url: string;
  environment_setup: Record<string, string>;
  notes: string[];
}

/**
 * Generate callback URL based on deployment environment
 */
export function generateCallbackURL(
  baseUrl: string,
  endpointPath: string = '/api/mpesa/callback'
): CallbackURLConfig {
  try {
    const url = new URL(endpointPath, baseUrl);
    const fullUrl = url.toString();

    // Validate URL
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      throw new Error('Callback URL must use HTTP or HTTPS');
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
    throw new Error(`Invalid callback URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate callback URL format and accessibility
 */
export async function validateCallbackURL(callbackUrl: string): Promise<{
  valid: boolean;
  reachable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let reachable = false;

  // Basic format validation
  try {
    new URL(callbackUrl);
  } catch {
    errors.push('Invalid URL format');
    return { valid: false, reachable: false, errors };
  }

  // Check if HTTPS (required for production)
  if (!callbackUrl.startsWith('https://')) {
    if (callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1')) {
      // Local dev is OK with HTTP
    } else {
      errors.push('Production URLs must use HTTPS');
    }
  }

  // Test reachability
  try {
    const response = await fetch(callbackUrl, {
      method: 'OPTIONS',
      headers: {
        'User-Agent': 'M-Pesa-Callback-Validator/1.0',
      },
    });
    reachable = response.ok || response.status === 405; // 405 is OK (method not allowed)
  } catch (error) {
    // Network error doesn't necessarily mean URL is invalid
    if (callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1')) {
      reachable = false; // Can't validate local URLs externally
    } else {
      errors.push(`Callback URL not reachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    reachable,
    errors,
  };
}

/**
 * Get deployment guide for specific environment
 */
export function getDeploymentGuide(deploymentType: string): CallbackDeploymentGuide | null {
  const guides: Record<string, CallbackDeploymentGuide> = {
    vercel: {
      deployment: 'Vercel',
      setup_steps: [
        '1. Deploy your Next.js backend to Vercel',
        '2. Create an API route at pages/api/mpesa/callback.ts (or app/api/mpesa/callback/route.ts)',
        '3. Add M-Pesa environment variables to Vercel project settings',
        '4. Use your Vercel deployment URL as the base',
        '5. Set callback URL to: https://your-project.vercel.app/api/mpesa/callback',
      ],
      endpoint_url_format: 'https://{project-name}.vercel.app/api/mpesa/callback',
      example_url: 'https://jimwas-pos.vercel.app/api/mpesa/callback',
      environment_setup: {
        'MPESA_CALLBACK_URL': 'https://your-project.vercel.app/api/mpesa/callback',
        'MPESA_CONSUMER_KEY': 'your-consumer-key',
        'MPESA_CONSUMER_SECRET': 'your-consumer-secret',
      },
      notes: [
        'Vercel functions have a timeout of 60 seconds - ensure callback processing completes within this time',
        'Use serverless middleware for webhook signature validation',
        'Store webhook verification status in the database',
      ],
    },
    firebase: {
      deployment: 'Firebase Cloud Functions',
      setup_steps: [
        '1. Create a new Cloud Function for HTTP triggers',
        '2. Name your function mpesa-callback or similar',
        '3. Deploy function with Node.js 16+ runtime',
        '4. Set trigger to "HTTPS" and allow unauthenticated invocations',
        '5. Copy the function URL and use as callback_url',
      ],
      endpoint_url_format: 'https://{region}-{project}.cloudfunctions.net/mpesa-callback',
      example_url: 'https://us-central1-jimwas-pos.cloudfunctions.net/mpesa-callback',
      environment_setup: {
        'MPESA_CALLBACK_URL': 'https://us-central1-jimwas-pos.cloudfunctions.net/mpesa-callback',
        'MPESA_CONSUMER_KEY': 'your-consumer-key',
        'MPESA_CONSUMER_SECRET': 'your-consumer-secret',
      },
      notes: [
        'Cloud Functions have a 540 second timeout (more forgiving)',
        'Use Firestore for storing webhook state',
        'Enable CORS if needed for testing',
      ],
    },
    aws_lambda: {
      deployment: 'AWS Lambda + API Gateway',
      setup_steps: [
        '1. Create a Lambda function (Node.js 18+)',
        '2. Create an API Gateway and trigger for the Lambda',
        '3. Enable CORS if needed',
        '4. Deploy and copy the API Gateway URL',
        '5. Append /mpesa-callback to the URL',
      ],
      endpoint_url_format: 'https://{api-id}.execute-api.{region}.amazonaws.com/prod/mpesa-callback',
      example_url: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/mpesa-callback',
      environment_setup: {
        'MPESA_CALLBACK_URL': 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/mpesa-callback',
        'MPESA_CONSUMER_KEY': 'your-consumer-key',
        'MPESA_CONSUMER_SECRET': 'your-consumer-secret',
      },
      notes: [
        'Lambda timeout is typically 15 minutes',
        'Use DynamoDB for storing webhook state',
        'Ensure API Gateway allows POST requests',
      ],
    },
    custom_vps: {
      deployment: 'Custom VPS / Dedicated Server',
      setup_steps: [
        '1. Set up Node.js backend on your VPS',
        '2. Create an Express/Fastify endpoint for /api/mpesa/callback',
        '3. Configure domain and SSL certificate (Let\'s Encrypt)',
        '4. Set up reverse proxy (Nginx/Apache)',
        '5. Use your domain as the callback URL',
      ],
      endpoint_url_format: 'https://your-domain.com/api/mpesa/callback',
      example_url: 'https://pos.jimwasenterprises.com/api/mpesa/callback',
      environment_setup: {
        'MPESA_CALLBACK_URL': 'https://your-domain.com/api/mpesa/callback',
        'MPESA_CONSUMER_KEY': 'your-consumer-key',
        'MPESA_CONSUMER_SECRET': 'your-consumer-secret',
      },
      notes: [
        'You have full control over timeout and resources',
        'Ensure SSL/TLS is properly configured',
        'Set up monitoring and logging for webhook processing',
      ],
    },
    localhost_ngrok: {
      deployment: 'Localhost with Ngrok (Development)',
      setup_steps: [
        '1. Install ngrok from https://ngrok.com',
        '2. Start your local server on http://localhost:3000',
        '3. Run: ngrok http 3000',
        '4. Copy the HTTPS URL provided by ngrok (e.g., https://abc123.ngrok.io)',
        '5. Use this URL with /api/mpesa/callback appended',
      ],
      endpoint_url_format: 'https://{random}.ngrok.io/api/mpesa/callback',
      example_url: 'https://abc123.ngrok.io/api/mpesa/callback',
      environment_setup: {
        'MPESA_CALLBACK_URL': 'https://abc123.ngrok.io/api/mpesa/callback',
        'MPESA_CONSUMER_KEY': 'sandbox-key',
        'MPESA_CONSUMER_SECRET': 'sandbox-secret',
      },
      notes: [
        'Ngrok URL changes on restart - regenerate callback URL each time',
        'Perfect for testing webhooks during development',
        'M-Pesa sandbox environment is ideal with ngrok',
      ],
    },
  };

  return guides[deploymentType] || null;
}

/**
 * Format callback URL with common deployment scenarios
 */
export function getCommonCallbackURLs(): Record<string, string> {
  return {
    'Vercel (recommended)': 'https://your-app.vercel.app/api/mpesa/callback',
    'Firebase Cloud Functions': 'https://region-project.cloudfunctions.net/mpesa-callback',
    'AWS Lambda': 'https://api-id.execute-api.region.amazonaws.com/prod/mpesa-callback',
    'Custom Domain': 'https://your-domain.com/api/mpesa/callback',
    'Localhost (dev)': 'http://localhost:3000/api/mpesa/callback',
    'Ngrok (local tunnel)': 'https://random123.ngrok.io/api/mpesa/callback',
  };
}

/**
 * Test callback URL with sample M-Pesa webhook
 */
export async function testCallbackURL(callbackUrl: string): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const startTime = Date.now();

  try {
    const samplePayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'test-merchant-123',
          CheckoutRequestID: 'test-checkout-456',
          ResultCode: 0,
          ResultDesc: 'The service request has been accepted successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1000 },
              { Name: 'MpesaReceiptNumber', Value: 'LK431H35OP' },
              { Name: 'PhoneNumber', Value: 254712345678 },
              { Name: 'TransactionTimestamp', Value: 20231225120000 },
            ],
          },
        },
      },
    };

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'M-Pesa-Callback-Test/1.0',
      },
      body: JSON.stringify(samplePayload),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        responseTime,
        errors: [],
      };
    } else {
      errors.push(`Server returned status ${response.status}`);
      return {
        success: false,
        statusCode: response.status,
        responseTime,
        errors,
      };
    }
  } catch (error) {
    errors.push(`Failed to reach callback URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      responseTime: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Get environment variable setup instructions
 */
export function getEnvironmentSetupInstructions(): string {
  return `# M-Pesa Callback URL Environment Setup

## Required Environment Variables

Set these in your deployment platform:

\`\`\`
MPESA_CALLBACK_URL=https://your-deployment.com/api/mpesa/callback
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORT_CODE=your-short-code
MPESA_ENVIRONMENT=sandbox  # or 'production'
\`\`\

## Vercel Setup

1. Go to Project Settings > Environment Variables
2. Add each variable listed above
3. Redeploy to apply changes

## Firebase Setup

1. Go to Cloud Functions > Runtime settings
2. Set environment variables
3. Redeploy function

## AWS Lambda Setup

1. Go to Lambda function configuration
2. Set environment variables
3. Redeploy or update function code

## Important Notes

- **HTTPS Required**: M-Pesa requires HTTPS for production callback URLs
- **Unique Per Environment**: Different URLs for sandbox and production
- **Whitelist M-Pesa IPs**: Contact Safaricom for their API server IPs to whitelist
- **Test First**: Always test with M-Pesa sandbox before going live
`;
}
