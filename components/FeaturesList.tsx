
import React from 'react';
import { XIcon } from '../index';

interface FeaturesListProps {
    onClose: () => void;
}

const FEATURES = [
    { category: "AI & Generation", items: [
        "Image-to-Code (Multimodal): Upload sketches/screenshots to generate code.",
        "Voice-to-UI: Dictate design prompts via microphone.",
        "Style Extraction: Extract colors/typography from uploaded images.",
        "Smart Data Mocking: Populate designs with realistic AI-generated data.",
        "Accessibility Auto-Fix: Audit and fix a11y issues automatically.",
        "SEO Optimizer: Analyze and improve semantic HTML and meta tags."
    ]},
    { category: "Editor & Developer Experience", items: [
        "Monaco Editor Integration: Syntax highlighting and better coding experience.",
        "Visual Diff View: Highlight code changes during refactoring.",
        "Tailwind Autocomplete: Intelligent class suggestions.",
        "External Library Manager: Inject CDN scripts (GSAP, Three.js) easily.",
        "Console Log Viewer: Debug interactive logic within the app.",
        "Live HTML/CSS Validation: Real-time syntax error indicators."
    ]},
    { category: "Project & Workflow", items: [
        "Project Folders: Group sessions into named projects.",
        "Version History: Browse and rollback to previous artifact versions.",
        "Forking/Branching: Duplicate artifacts to explore new directions.",
        "Custom Templates: Save generated components as reusable templates.",
        "Prompt Library: Built-in library of style modifiers and power prompts."
    ]},
    { category: "Export & Integrations", items: [
        "One-Click Deploy: Deploy to Vercel/Netlify instantly.",
        "Open in StackBlitz: Open code in a full online IDE.",
        "Figma Integration: Export designs to Figma (SVG).",
        "High-Res Screenshot: Capture pixel-perfect full-page screenshots."
    ]},
    { category: "UI/UX Polish", items: [
        "Device Bezels: Realistic frames for mobile/tablet previews.",
        "Presentation Mode: Distraction-free full-screen demo mode.",
        "Custom Breakpoints: Define custom preview dimensions.",
        "Color Blindness Simulator: Test designs for visual accessibility."
    ]},
    { category: "Backend & Community", items: [
        "Cross-Device Sync: Database storage for session access anywhere.",
        "Google Authentication: Sign in with Google.",
        "Community Gallery: Explore, like, and remix user creations.",
        "User Profiles: Public portfolios of published artifacts."
    ]}
];

export default function FeaturesList({ onClose }: FeaturesListProps) {
    return (
        <div className="features-overlay" onClick={onClose}>
            <div className="features-modal" onClick={e => e.stopPropagation()}>
                <div className="features-header">
                    <h2>Planned Features</h2>
                    <button className="close-button" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>
                <div className="features-content">
                    <p className="features-intro">
                        We're constantly improving Flash UI. Here's what's on our roadmap:
                    </p>
                    <div className="features-grid">
                        {FEATURES.map((section, i) => (
                            <div key={i} className="feature-category">
                                <h3>{section.category}</h3>
                                <ul>
                                    {section.items.map((item, j) => (
                                        <li key={j}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
