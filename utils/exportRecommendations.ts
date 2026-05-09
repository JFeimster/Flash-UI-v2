
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
