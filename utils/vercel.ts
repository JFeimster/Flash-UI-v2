
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExportedFiles } from './export';

interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState: string;
}

export const deployToVercel = async (
  token: string, 
  files: ExportedFiles, 
  projectName: string
): Promise<VercelDeploymentResponse> => {
  // Convert our file structure to Vercel's expected format
  const vercelFiles = Object.entries(files).map(([name, content]) => ({
    file: name,
    data: content,
  }));

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: null,
        installCommand: 'npm install',
        buildCommand: 'npm run build',
        devCommand: 'npm run dev',
        outputDirectory: 'dist',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to deploy to Vercel');
  }

  return await response.json();
};
