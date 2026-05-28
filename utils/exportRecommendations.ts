
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { RecommendedPage } from '../types';

export const formatAsMarkdown = (pages: RecommendedPage[]): string => {
    let md = '# Recommended Pages & Project Structure\n\n';
    pages.forEach(page => {
        md += `## ${page.title}\n`;
        md += `> ${page.description}\n\n`;
        md += '### Suggested Files:\n';
        page.fileStructure.forEach(file => {
            md += `- \`${file}\`\n`;
        });
        md += '\n---\n\n';
    });
    return md;
};

export const formatAsPlainText = (pages: RecommendedPage[]): string => {
    let text = 'RECOMMENDED PAGES & PROJECT STRUCTURE\n';
    text += '====================================\n\n';
    pages.forEach(page => {
        text += `TITLE: ${page.title.toUpperCase()}\n`;
        text += `DESCRIPTION: ${page.description}\n`;
        text += `STRUCTURE:\n`;
        page.fileStructure.forEach(file => {
            text += `  - ${file}\n`;
        });
        text += '\n--------------------\n\n';
    });
    return text;
};

export const downloadAsMarkdown = (pages: RecommendedPage[]) => {
    const md = formatAsMarkdown(pages);
    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, 'project-recommendations.md');
};

export const downloadAsPlainText = (pages: RecommendedPage[]) => {
    const text = formatAsPlainText(pages);
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, 'project-recommendations.txt');
};

export const downloadAsPDF = (pages: RecommendedPage[]) => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text('Recommended Project Plan', margin, y);
    y += 15;

    pages.forEach(page => {
        if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(page.title, margin, y);
        y += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const descLines = doc.splitTextToSize(page.description, pageWidth - margin * 2);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 5;

        doc.setFont('helvetica', 'normal');
        doc.text('Suggested Files:', margin, y);
        y += 5;

        page.fileStructure.forEach(file => {
            doc.text(`- ${file}`, margin + 5, y);
            y += 5;
        });

        y += 10;
    });

    doc.save('project-recommendations.pdf');
};

export const downloadAsDoc = async (pages: RecommendedPage[]) => {
    const sections = pages.map(page => ({
        children: [
            new Paragraph({
                text: page.title,
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: page.description,
                        italics: true,
                    }),
                ],
                spacing: { after: 200 },
            }),
            new Paragraph({
                text: "Suggested Files:",
                heading: HeadingLevel.HEADING_2,
            }),
            ...page.fileStructure.map(file => 
                new Paragraph({
                    text: file,
                    bullet: { level: 0 },
                })
            ),
            new Paragraph({ text: "", spacing: { after: 400 } }),
        ],
    }));

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: "Project Recommendations",
                    heading: HeadingLevel.TITLE,
                    spacing: { after: 400 },
                }),
                ...sections.flatMap(s => s.children)
            ]
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "project-recommendations.docx");
};

export interface SuggestionsExportData {
    components: string[];
    checkedComponents: Set<string>;
    integrations: { name: string; desc: string }[];
    checkedIntegrations: Set<string>;
    apis: { name: string; type?: string; desc?: string }[];
    checkedAPIs: Set<string>;
    techStack?: string;
}

export const formatSuggestionsAsMarkdown = (data: SuggestionsExportData): string => {
    let md = '# Architect Blueprint & Recommended Options\n\n';
    if (data.techStack) {
        md += `**Target Tech Stack & Existing Tools**: ${data.techStack}\n\n`;
    }
    md += `*Generated on: ${new Date().toLocaleDateString()}*\n\n`;
    md += '---\n\n';

    // 1. UI Components
    md += '## 🧱 UI Components & Modes\n\n';
    data.components.forEach(comp => {
        const isSelected = data.checkedComponents.has(comp);
        md += `- [${isSelected ? 'x' : ' '}] **${comp}**\n`;
    });
    md += '\n';

    // 2. AI Integrations
    md += '## ⚡ AI Integrations\n\n';
    data.integrations.forEach(item => {
        const isSelected = data.checkedIntegrations.has(item.name);
        md += `- [${isSelected ? 'x' : ' '}] **${item.name}**\n`;
        md += `  > ${item.desc}\n`;
    });
    md += '\n';

    // 3. Actions & APIs
    md += '## 🔌 Actions & APIs\n\n';
    data.apis.forEach(item => {
        const isSelected = data.checkedAPIs.has(item.name);
        const typeStr = item.type ? `*[${item.type}]* ` : '';
        md += `- [${isSelected ? 'x' : ' '}] **${item.name}**\n`;
        if (item.desc || typeStr) {
            md += `  > ${typeStr}${item.desc || ''}\n`;
        }
    });

    return md;
};

export const formatSuggestionsAsPlainText = (data: SuggestionsExportData): string => {
    let txt = 'ARCHITECT BLUEPRINT & RECOMMENDED OPTIONS\n';
    txt += '==========================================\n\n';
    if (data.techStack) {
        txt += `TARGET TECH STACK & TOOLS: ${data.techStack.toUpperCase()}\n\n`;
    }
    txt += `GENERATED ON: ${new Date().toLocaleString()}\n`;
    txt += '------------------------------------------\n\n';

    txt += '🧱 UI COMPONENTS & MODES\n';
    txt += '------------------------\n';
    data.components.forEach(comp => {
        const status = data.checkedComponents.has(comp) ? '[SELECTED]' : '[ ]';
        txt += `${status} ${comp}\n`;
    });
    txt += '\n';

    txt += '⚡ AI INTEGRATIONS\n';
    txt += '------------------\n';
    data.integrations.forEach(item => {
        const status = data.checkedIntegrations.has(item.name) ? '[SELECTED]' : '[ ]';
        txt += `${status} ${item.name}\n`;
        txt += `      Description: ${item.desc}\n\n`;
    });

    txt += '🔌 ACTIONS & APIS\n';
    txt += '-----------------\n';
    data.apis.forEach(item => {
        const status = data.checkedAPIs.has(item.name) ? '[SELECTED]' : '[ ]';
        const typeStr = item.type ? `(${item.type}) ` : '';
        txt += `${status} ${item.name} ${typeStr}\n`;
        if (item.desc) {
            txt += `      Details: ${item.desc}\n\n`;
        }
    });

    return txt;
};

export const downloadSuggestionsAsMarkdown = (data: SuggestionsExportData) => {
    const md = formatSuggestionsAsMarkdown(data);
    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, 'architect-suggestions-blueprint.md');
};

export const downloadSuggestionsAsPlainText = (data: SuggestionsExportData) => {
    const text = formatSuggestionsAsPlainText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, 'architect-suggestions-blueprint.txt');
};

export const downloadSuggestionsAsJSON = (data: SuggestionsExportData) => {
    const rawData = {
        title: "Architect Blueprint & Smart Suggestions Report",
        generatedAt: new Date().toISOString(),
        techStackFocus: data.techStack || "General React Components",
        components: data.components.map(comp => ({
            name: comp,
            selected: data.checkedComponents.has(comp)
        })),
        integrations: data.integrations.map(item => ({
            name: item.name,
            description: item.desc,
            selected: data.checkedIntegrations.has(item.name)
        })),
        apis: data.apis.map(item => ({
            name: item.name,
            type: item.type || "General",
            description: item.desc || "",
            selected: data.checkedAPIs.has(item.name)
        }))
    };
    const jsonStr = JSON.stringify(rawData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    saveAs(blob, 'architect-suggestions-blueprint.json');
};

export const downloadSuggestionsAsPDF = (data: SuggestionsExportData) => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const checkPageBreak = (needed: number = 10) => {
        if (y > pageHeight - margin - needed) {
            doc.addPage();
            y = 20;
        }
    };

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Architect Blueprint & Integration Options', margin, y);
    y += 10;

    if (data.techStack) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const techLines = doc.splitTextToSize(`Tech Stack Focus: ${data.techStack}`, pageWidth - margin * 2);
        doc.text(techLines, margin, y);
        y += techLines.length * 5 + 5;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, y);
    y += 10;

    // 1. UI Components
    checkPageBreak(15);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. UI Components & Layout Modes', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    data.components.forEach(comp => {
        checkPageBreak(8);
        const prefix = data.checkedComponents.has(comp) ? '[x] ' : '[ ] ';
        const line = doc.splitTextToSize(prefix + comp, pageWidth - margin * 2);
        doc.text(line, margin + 4, y);
        y += line.length * 5 + 1;
    });
    y += 5;

    // 2. AI Integrations
    checkPageBreak(15);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('2. AI Integrations & Core Capabilities', margin, y);
    y += 8;

    data.integrations.forEach(item => {
        checkPageBreak(15);
        const prefix = data.checkedIntegrations.has(item.name) ? '[x] ' : '[ ] ';
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(prefix + item.name, margin + 4, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(item.desc, pageWidth - margin * 2.5);
        doc.text(descLines, margin + 12, y);
        y += descLines.length * 5 + 4;
    });
    y += 5;

    // 3. Actions & APIs
    checkPageBreak(15);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('3. REST Side-Effects, Actions & APIs', margin, y);
    y += 8;

    data.apis.forEach(item => {
        checkPageBreak(15);
        const prefix = data.checkedAPIs.has(item.name) ? '[x] ' : '[ ] ';
        const typeStr = item.type ? ` (${item.type})` : '';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(prefix + item.name + typeStr, margin + 4, y);
        y += 5;

        if (item.desc) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(item.desc, pageWidth - margin * 2.5);
            doc.text(descLines, margin + 12, y);
            y += descLines.length * 5 + 4;
        }
    });

    doc.save('architect-suggestions-blueprint.pdf');
};

