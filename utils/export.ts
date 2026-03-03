
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import JSZip from 'jszip';

// Helper to extract CSS, JS and Body cleanly from raw HTML
const extractParts = (html: string) => {
    const cssMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const css = cssMatch ? cssMatch[1].trim() : '';

    const jsMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const js = jsMatch ? jsMatch[1].trim() : '';
    
    let body = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        body = bodyMatch[1];
    } else {
        body = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/i, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/i, '');
    }
    body = body.trim();
    return { css, js, body };
};

export interface ExportedFiles {
    [filename: string]: string;
}

export const getExportedFiles = (html: string, format: string): ExportedFiles => {
    const { css, js, body } = extractParts(html);

    switch (format) {
        case 'static':
            return {
                'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flash UI Export</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
    <script src="script.js"></script>
</body>
</html>`,
                'style.css': css,
                'script.js': js
            };

        case 'nextjs':
            return {
                'page.tsx': `import React from 'react';
import './styles.css';

export default function Page() {
  return (
    <main className="min-h-screen">
      <div dangerouslySetInnerHTML={{ __html: \`
${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
      \` }} />
    </main>
  );
}`,
                'styles.css': css,
                'layout.tsx': `export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
            };

        case 'wix':
            return {
                'velo-code.js': `// Wix Velo Code
$w.onReady(function () {
    // Add your JS here
    ${js}
});`,
                'structure.html': body,
                'styles.css': css
            };

        case 'notion':
            return {
                'notion-embed.md': `### Generated UI Component

To use this in Notion:
1. Create a "/code" block
2. Set language to "HTML"
3. Paste the following:

\`\`\`html
${html}
\`\`\``,
                'readme.txt': 'Notion does not support direct multi-file imports. Use the HTML code block as described in notion-embed.md'
            };

        case 'react':
            return {
                'FlashComponent.tsx': `import React from 'react';
import './styles.css';

export default function FlashComponent() {
  return (
    <div className="flash-component" dangerouslySetInnerHTML={{ __html: \`
${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
    \` }} />
  );
}`,
                'styles.css': css
            };

        case 'vue':
            return {
                'FlashComponent.vue': `<template>
  <div v-html="htmlContent"></div>
</template>

<script setup>
const htmlContent = \`
${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
\`;
</script>

<style scoped>
${css}
</style>`
            };

        case 'svelte':
            return {
                'FlashComponent.svelte': `<script>
  const html = \`
${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
  \`;
</script>

{@html html}

<style>
${css}
</style>`
            };

        default:
            return { 'index.html': html };
    }
};

export const downloadCode = (code: string, format: string) => {
    if (!code) return;
    
    const files = getExportedFiles(code, format);
    const filenames = Object.keys(files);

    if (filenames.length === 1) {
        const filename = filenames[0];
        const blob = new Blob([files[filename]], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        downloadZip(code, format);
    }
};

export const downloadZip = async (code: string, format: string) => {
    if (!code) return;
    
    const zip = new JSZip();
    const files = getExportedFiles(code, format);
    const timestamp = Date.now();

    Object.entries(files).forEach(([filename, content]) => {
        zip.file(filename, content);
    });

    // Generate zip
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash-ui-${format}-${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
