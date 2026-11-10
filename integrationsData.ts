export interface IntegrationService {
    id: string;
    name: string;
    category: 'payments' | 'database' | 'auth' | 'ai' | 'email' | 'analytics' | 'search';
    categoryLabel: string;
    badge: string;
    icon: string;
    desc: string;
    defaultEnvKeys: Record<string, string>;
    boilerplateSnippet: string;
    usageExampleSnippet: string;
    features: string[];
}

export const INTEGRATION_CATEGORIES = [
    { id: 'all', label: 'All Services' },
    { id: 'payments', label: 'Payments' },
    { id: 'database', label: 'Database' },
    { id: 'auth', label: 'Auth & SSO' },
    { id: 'ai', label: 'AI & Models' },
    { id: 'email', label: 'Email' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'search', label: 'Search' },
] as const;

export const INTEGRATION_PRESETS = [
    { 
        name: '⚡ SaaS Core', 
        ids: ['stripe', 'supabase', 'auth0'], 
        desc: 'Stripe + Supabase + Auth0' 
    },
    { 
        name: '💳 Payment Portal', 
        ids: ['stripe', 'resend'], 
        desc: 'Stripe Subscriptions + Resend Receipts' 
    },
    { 
        name: '🔐 Enterprise SSO', 
        ids: ['auth0', 'supabase'], 
        desc: 'Auth0 Single Sign-On + Supabase Postgres' 
    },
    { 
        name: '🤖 AI Native', 
        ids: ['ai_sdk', 'supabase', 'resend'], 
        desc: 'Gemini/OpenAI + Realtime DB + Resend' 
    },
    { 
        name: '🛍️ Modern E-Com', 
        ids: ['stripe', 'supabase', 'algolia', 'posthog'], 
        desc: 'Stripe + Supabase + Algolia + PostHog' 
    }
];

export const AVAILABLE_INTEGRATIONS: IntegrationService[] = [
    {
        id: 'stripe',
        name: 'Stripe',
        category: 'payments',
        categoryLabel: 'Payments & Billing',
        badge: 'Checkout & Subscriptions',
        icon: '💳',
        desc: 'Checkout sessions, recurring subscription billing, customer portal & webhook handlers',
        features: [
            'Stripe.js client checkout session redirect',
            'Subscription pricing tier binding stencils',
            'Customer billing management portal hook',
            'Secure webhook event handler verification'
        ],
        defaultEnvKeys: {
            STRIPE_PUBLISHABLE_KEY: 'pk_test_51MockStripeKey9876543210ABCXYZ',
            STRIPE_SECRET_KEY: 'sk_test_mock_stripe_secret_key_abcdef123456',
            STRIPE_WEBHOOK_SECRET: 'whsec_mock_stripe_webhook_secret_123456'
        },
        boilerplateSnippet: `// lib/stripe.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      'pk_test_51MockStripeKey9876543210ABCXYZ'
    );
  }
  return stripePromise;
};

export async function createCheckoutSession(priceId: string, customerEmail?: string) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, customerEmail }),
  });
  const data = await response.json();
  if (data.sessionId) {
    const stripe = await getStripe();
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    }
  }
  return data;
}`,
        usageExampleSnippet: `<button 
  onClick={() => createCheckoutSession('price_pro_tier_123')}
  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs"
>
  Upgrade with Stripe Checkout
</button>`
    },
    {
        id: 'supabase',
        name: 'Supabase',
        category: 'database',
        categoryLabel: 'Database & Realtime',
        badge: 'Postgres & Row-Level Security',
        icon: '⚡',
        desc: 'PostgreSQL database, real-time table sync, Row-Level Security (RLS) & Auth listeners',
        features: [
            'Client initialization with anon key',
            'Real-time Postgres changes subscription listener',
            'Data query wrappers with fallback mock state',
            'Row-Level Security (RLS) policies stencil'
        ],
        defaultEnvKeys: {
            NEXT_PUBLIC_SUPABASE_URL: 'https://mock-project-id.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_supabase_anon_token_998877'
        },
        boilerplateSnippet: `// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_supabase_anon_token_998877';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function subscribeToTable<T = any>(table: string, onEvent: (payload: T) => void) {
  return supabase
    .channel(\`realtime:\${table}\`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      onEvent(payload.new as T);
    })
    .subscribe();
}`,
        usageExampleSnippet: `useEffect(() => {
  const sub = subscribeToTable('orders', (order) => {
    console.log('Realtime order update:', order);
  });
  return () => { sub.unsubscribe(); };
}, []);`
    },
    {
        id: 'auth0',
        name: 'Auth0',
        category: 'auth',
        categoryLabel: 'Authentication & Identity',
        badge: 'Universal SSO & Enterprise',
        icon: '🔐',
        desc: 'Enterprise Single Sign-On (SSO), social login providers, MFA & JWT token handling',
        features: [
            'Auth0Provider wrapper context setup',
            'useAuth0 hook session states and user tokens',
            'Sign In / Sign Out action redirect buttons',
            'Protected component route stencils'
        ],
        defaultEnvKeys: {
            AUTH0_DOMAIN: 'dev-mock-tenant.us.auth0.com',
            AUTH0_CLIENT_ID: 'mock_auth0_client_id_998877',
            AUTH0_CLIENT_SECRET: 'mock_auth0_client_secret_xyz123',
            AUTH0_BASE_URL: 'http://localhost:3000'
        },
        boilerplateSnippet: `// lib/auth0.tsx
import React from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "dev-mock-tenant.us.auth0.com";
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "mock_auth0_client_id_998877";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : ''
      }}
    >
      {children}
    </Auth0Provider>
  );
}

export function useAuthSession() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  return { user, isAuthenticated, isLoading, loginWithRedirect, logout };
}`,
        usageExampleSnippet: `const { user, isAuthenticated, loginWithRedirect, logout } = useAuthSession();
return isAuthenticated ? (
  <div className="flex items-center gap-2">
    <img src={user?.picture} alt={user?.name} className="w-6 h-6 rounded-full" />
    <span>{user?.name}</span>
    <button onClick={() => logout()}>Sign Out</button>
  </div>
) : (
  <button onClick={() => loginWithRedirect()}>Sign In with Auth0</button>
);`
    },
    {
        id: 'firebase',
        name: 'Firebase',
        category: 'database',
        categoryLabel: 'Database & Backend',
        badge: 'Firestore & Cloud Auth',
        icon: '🔥',
        desc: 'Firestore NoSQL document store, Google authentication & offline client cache',
        features: [
            'Firebase modular SDK initialization',
            'Firestore collection listener (onSnapshot)',
            'Google Auth credential provider hook',
            'Firestore security rules stub'
        ],
        defaultEnvKeys: {
            FIREBASE_PROJECT_ID: 'ai-studio-7cfb8a32',
            FIREBASE_API_KEY: 'AIzaSyMockKeyForFirebaseDevEnv123'
        },
        boilerplateSnippet: `// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-studio-7cfb8a32',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyMockKeyForFirebaseDevEnv123'
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);`,
        usageExampleSnippet: `const unsub = onSnapshot(collection(db, 'records'), (snap) => {
  setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});`
    },
    {
        id: 'clerk',
        name: 'Clerk',
        category: 'auth',
        categoryLabel: 'Authentication & Identity',
        badge: 'Prebuilt Auth UI',
        icon: '🛡️',
        desc: 'Drop-in authentication components, organization management & profile cards',
        features: [
            'ClerkProvider root wrapper',
            'Prebuilt SignInButton & UserButton modal',
            'useUser & useAuth hooks',
            'Multi-session account switching'
        ],
        defaultEnvKeys: {
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2xlcmsubW9jay5kZXYk',
            CLERK_SECRET_KEY: 'sk_test_mock_clerk_secret_key_456'
        },
        boilerplateSnippet: `// lib/clerk.tsx
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function ClerkAuthHeader() {
  return (
    <header className="flex justify-between items-center p-3 border-b border-white/10">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-3 py-1.5 bg-emerald-500 text-black font-semibold rounded-lg text-xs">
            Sign In with Clerk
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}`,
        usageExampleSnippet: `<ClerkAuthHeader />`
    },
    {
        id: 'resend',
        name: 'Resend',
        category: 'email',
        categoryLabel: 'Email & Messaging',
        badge: 'Transactional Email',
        icon: '📫',
        desc: 'Developer-first email delivery API, React email templates & event webhooks',
        features: [
            'Resend SDK client instance',
            'Transactional email dispatch with HTML payload',
            'Contact list & subscriber management',
            'Deliverability error handling'
        ],
        defaultEnvKeys: {
            RESEND_API_KEY: 're_mock_1234567890abcdef_secret'
        },
        boilerplateSnippet: `// lib/resend.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_1234567890abcdef_secret');

export async function sendEmailNotification(to: string, subject: string, bodyText: string) {
  return await resend.emails.send({
    from: 'notifications@resend.dev',
    to,
    subject,
    html: \`<div><h2>Notification</h2><p>\${bodyText}</p></div>\`
  });
}`,
        usageExampleSnippet: `await sendEmailNotification('user@example.com', 'Welcome Aboard', 'Your workspace is ready!');`
    },
    {
        id: 'ai_sdk',
        name: 'Gemini / OpenAI API',
        category: 'ai',
        categoryLabel: 'AI & Intelligence',
        badge: 'Frontier AI Models',
        icon: '🤖',
        desc: 'LLM inference, streaming tokens, multi-modal vision & structured function calls',
        features: [
            '@google/genai TypeScript SDK client',
            'Streaming token generation handler',
            'System instructions & temperature configuration',
            'Multi-modal asset prompt support'
        ],
        defaultEnvKeys: {
            GEMINI_API_KEY: 'AIzaSyMockKey_Gemini_Dev_Studio_2026',
            OPENAI_API_KEY: 'sk-mock-openai-key-dev-studio-998877'
        },
        boilerplateSnippet: `// lib/ai.ts
import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyMockKey_Gemini_Dev_Studio_2026'
});

export async function generateAIResponse(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text;
}`,
        usageExampleSnippet: `const answer = await generateAIResponse('Summarize user onboarding checklist');`
    },
    {
        id: 'posthog',
        name: 'PostHog',
        category: 'analytics',
        categoryLabel: 'Analytics & Telemetry',
        badge: 'Product Telemetry',
        icon: '📊',
        desc: 'Product analytics, event telemetry, session replays & feature flag evaluations',
        features: [
            'posthog-js client initialization',
            'Custom event telemetry capture helper',
            'Feature flag evaluation state',
            'Session replay opt-in'
        ],
        defaultEnvKeys: {
            NEXT_PUBLIC_POSTHOG_KEY: 'phc_mock_posthog_client_key_999888',
            NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com'
        },
        boilerplateSnippet: `// lib/posthog.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_mock_posthog_client_key_999888', {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true
    });
  }
}

export function trackEvent(name: string, properties?: Record<string, any>) {
  posthog.capture(name, properties);
}`,
        usageExampleSnippet: `trackEvent('checkout_button_clicked', { plan: 'pro_monthly' });`
    },
    {
        id: 'algolia',
        name: 'Algolia',
        category: 'search',
        categoryLabel: 'Search & Discovery',
        badge: 'InstantSearch',
        icon: '🔍',
        desc: 'Sub-50ms instant search autocomplete, multi-facet filtering & typo tolerance',
        features: [
            'Algolia search client initialization',
            'InstantSearch autocomplete box binding',
            'Facet filtering & refinement list',
            'Search hit card template'
        ],
        defaultEnvKeys: {
            NEXT_PUBLIC_ALGOLIA_APP_ID: 'MOCK_APP_ID_123',
            NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: 'mock_algolia_search_only_api_key'
        },
        boilerplateSnippet: `// lib/algolia.ts
import algoliasearch from 'algoliasearch/lite';

export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'MOCK_APP_ID_123',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || 'mock_algolia_search_only_api_key'
);`,
        usageExampleSnippet: `const { results } = await searchClient.search([{ indexName: 'products', query: 'wireless keyboard' }]);`
    }
];
