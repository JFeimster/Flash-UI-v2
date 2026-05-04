/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  status: 'streaming' | 'complete' | 'error';
  isFavorite?: boolean;
  additionalFiles?: Record<string, string>;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }
export interface SuggestedComponent { name: string; icon: string; prompt: string; }

export interface RecommendedPage {
    title: string;
    description: string;
    fileStructure: string[];
}

export interface AnimationStyle {
    id: string;
    name: string;
    description: string;
    prompt: string;
}