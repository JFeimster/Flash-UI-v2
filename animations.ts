import { AnimationStyle } from './types';

export const ANIMATION_STYLES: AnimationStyle[] = [
    {
        id: 'entrance',
        name: 'Dramatic Entrance',
        description: 'Smooth fade-in with a slight upward slide and blur reveal.',
        prompt: 'Add a dramatic entrance animation to the main elements. Use CSS keyframes for a smooth fade-in, slight upward slide (20px), and a blur-to-clear transition over 0.8s with a cubic-bezier(0.16, 1, 0.3, 1) timing function.'
    },
    {
        id: 'hover-glow',
        name: 'Hover Glow & Scale',
        description: 'Interactive hover states that scale up and add a vibrant outer glow.',
        prompt: 'Add interactive hover animations to all buttons and cards. On hover, they should scale up by 3% and gain a vibrant, soft outer glow matching their primary color. Use smooth transitions (0.3s).'
    },
    {
        id: 'floating',
        name: 'Floating Motion',
        description: 'Gentle, continuous floating animation for a dynamic feel.',
        prompt: 'Add a gentle, continuous floating animation (y-axis oscillation of 5-10px) to the main container or key visual elements to make the UI feel alive and dynamic.'
    },
    {
        id: 'glass-reveal',
        name: 'Glass Reveal',
        description: 'A shimmering glass effect that sweeps across the component.',
        prompt: 'Add a "shimmer" or "glass reveal" effect. This should be a diagonal light sweep that periodically passes over the component to highlight its texture and depth.'
    },
    {
        id: 'magnetic',
        name: 'Magnetic Interaction',
        description: 'Subtle magnetic pull effect on buttons and interactive elements.',
        prompt: 'Implement subtle magnetic-like transitions. When interacting, elements should feel like they have weight and momentum, using elastic-like easing for any movement.'
    },
    {
        id: 'pulse',
        name: 'Rhythmic Pulse',
        description: 'Soft, rhythmic pulsing of borders or backgrounds to draw attention.',
        prompt: 'Add a soft, rhythmic pulsing animation to the primary action button or key highlight area. The pulse should be subtle, affecting either the border-color opacity or a very slight scale change.'
    }
];
