/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Attachment {
    id: string;
    name: string;
    mimeType: string;
    data: string; // base64
    size: number;
}

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  status: 'streaming' | 'complete' | 'error';
  isFavorite?: boolean;
  isSaved?: boolean;
  additionalFiles?: Record<string, string>;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
    attachments?: Attachment[];
    contextUrl?: string;
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }
export interface SuggestedComponent { name: string; icon: string; prompt: string; }

export interface RecommendedPage {
    title: string;
    description: string;
    fileStructure: string[];
}

export interface Template {
    title: string;
    description: string;
    prompt: string;
    tags?: string[];
}

export interface AnimationStyle {
    id: string;
    name: string;
    description: string;
    prompt: string;
}