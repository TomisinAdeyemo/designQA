import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Finding } from '../types';

export interface ReportData {
  projectName?: string;
  projectClient?: string;
  timestamp: string;
  findings: Finding[];
}

export async function downloadVisualPDF(data: ReportData, filename: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  const projectName = data.findings[0]?.project?.name || data.projectName || 'Unknown Project';
  const projectClient = data.findings[0]?.project?.client || data.projectClient || 'Unknown Client';

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Visual Findings Report', margin, 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, 32);
  doc.text(`Client: ${projectClient}`, margin, 38);
  doc.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, margin, 44);

  const findingsWithMarkups = data.findings.filter(f =>
    f.evidence && f.evidence.some(e => e.type === 'drawing_markup' && e.url)
  );

  doc.setFontSize(10);
  doc.text(`Total Marked-Up Drawings: ${findingsWithMarkups.length}`, margin, 50);

  for (let i = 0; i < findingsWithMarkups.length; i++) {
    const finding = findingsWithMarkups[i];
    const markupEvidence = finding.evidence?.filter(e => e.type === 'drawing_markup' && e.url) || [];

    for (const evidence of markupEvidence) {
      if (evidence.url) {
        doc.addPage();
        let yPos = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const findingNum = i + 1;
        doc.text(`Finding #${findingNum}: ${finding.title}`, margin, yPos);
        yPos += 10;

        const severityColor = getSeverityColor(finding.severity);
        doc.setFillColor(severityColor.r, severityColor.g, severityColor.b);
        doc.roundedRect(margin, yPos - 4, 18, 6, 1, 1, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(finding.severity.toUpperCase(), margin + 2, yPos);
        doc.setTextColor(0, 0, 0);

        doc.setFillColor(220, 220, 220);
        doc.roundedRect(margin + 22, yPos - 4, 25, 6, 1, 1, 'F');
        doc.text(finding.discipline.toUpperCase(), margin + 24, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Element: ${finding.element_name || 'Not specified'}`, margin, yPos);
        yPos += 8;

        try {
          const maxImgWidth = contentWidth;
          const maxImgHeight = pageHeight - yPos - 40;

          if (!evidence.url.startsWith('data:')) {
            throw new Error('Invalid image data - not a data URL');
          }

          const img = new Image();

          const loadPromise = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => {
              console.error('Image load error:', e);
              reject(new Error('Failed to load image'));
            };
            img.src = evidence.url;
          });

          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error('Image load timeout')), 10000);
          });

          await Promise.race([loadPromise, timeoutPromise]);

          if (!img.width || !img.height) {
            throw new Error('Image has no dimensions');
          }

          const aspectRatio = img.width / img.height;
          let imgWidth = maxImgWidth;
          let imgHeight = imgWidth / aspectRatio;

          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = imgHeight * aspectRatio;
          }

          const imageFormat = evidence.url.includes('data:image/jpeg') ? 'JPEG' : 'PNG';
          doc.addImage(evidence.url, imageFormat, margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 5;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(evidence.caption || 'Marked-up Drawing', margin, yPos);
          yPos += 6;

          if (evidence.markup && evidence.markup.annotations.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Annotations (${evidence.markup.annotations.length}):`, margin, yPos);
            yPos += 5;

            doc.setFont('helvetica', 'normal');
            evidence.markup.annotations.forEach((annotation, idx) => {
              const label = annotation.label || `Annotation ${idx + 1}`;
              const text = `${idx + 1}. ${label} (${annotation.type})`;
              const lines = doc.splitTextToSize(text, contentWidth - 10);
              lines.forEach((line: string) => {
                doc.text(line, margin + 3, yPos);
                yPos += 4;
              });
            });
          }
        } catch (error) {
          console.error('Error adding image to PDF:', error, evidence.url?.substring(0, 50));
          doc.setFontSize(10);
          doc.setTextColor(200, 0, 0);
          doc.text('Error: Could not load marked-up drawing', margin, yPos);
          yPos += 5;
          doc.setFontSize(8);
          doc.text(`Reason: ${error instanceof Error ? error.message : 'Unknown error'}`, margin, yPos);
          yPos += 5;
          doc.text(`URL starts with: ${evidence.url?.substring(0, 30) || 'no URL'}`, margin, yPos);
          doc.setTextColor(0, 0, 0);
        }
      }
    }
  }

  if (findingsWithMarkups.length === 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text('No marked-up drawings found in this report.', margin, 30);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    doc.text('Generated by DesignQA', margin, pageHeight - 10);
  }

  doc.save(filename);
}

function getSeverityColor(severity: string): { r: number; g: number; b: number } {
  switch (severity) {
    case 'critical':
      return { r: 220, g: 38, b: 38 };
    case 'high':
      return { r: 234, g: 88, b: 12 };
    case 'medium':
      return { r: 251, g: 191, b: 36 };
    case 'low':
      return { r: 250, g: 204, b: 21 };
    default:
      return { r: 148, g: 163, b: 184 };
  }
}

export function downloadCSV(data: ReportData, filename: string) {
  const csvHeader = 'Project,Client,Severity,Discipline,Title,Description,Recommended Fix,Element Name,Element GUID,Status,Created At\n';
  const csvRows = data.findings.map(f => {
    const project = f.project ? f.project.name : data.projectName || 'N/A';
    const client = f.project ? f.project.client : data.projectClient || 'N/A';
    const description = (f.description || '').replace(/"/g, '""');
    const recommendedFix = (f.recommended_fix || 'N/A').replace(/"/g, '""');
    return `"${project}","${client}","${f.severity}","${f.discipline}","${f.title}","${description}","${recommendedFix}","${f.element_name || 'N/A'}","${f.element_guid}","${f.status}","${new Date(f.created_at).toLocaleString()}"`;
  }).join('\n');

  const csv = csvHeader + csvRows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function downloadExcel(data: ReportData, filename: string) {
  const csvHeader = 'Project\tClient\tSeverity\tDiscipline\tTitle\tDescription\tRecommended Fix\tElement Name\tElement GUID\tStatus\tCreated At\n';
  const csvRows = data.findings.map(f => {
    const project = f.project ? f.project.name : data.projectName || 'N/A';
    const client = f.project ? f.project.client : data.projectClient || 'N/A';
    return `${project}\t${client}\t${f.severity}\t${f.discipline}\t${f.title}\t${f.description || ''}\t${f.recommended_fix || 'N/A'}\t${f.element_name || 'N/A'}\t${f.element_guid}\t${f.status}\t${new Date(f.created_at).toLocaleString()}`;
  }).join('\n');

  const tsv = csvHeader + csvRows;
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function downloadPDF(data: ReportData, filename: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  const projectName = data.findings[0]?.project?.name || data.projectName || 'Unknown Project';
  const projectClient = data.findings[0]?.project?.client || data.projectClient || 'Unknown Client';

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DesignQA Findings Report', margin, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, 32);
  doc.text(`Client: ${projectClient}`, margin, 38);
  doc.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, margin, 44);
  doc.text(`Total Findings: ${data.findings.length}`, margin, 50);

  const disciplineGroups: Record<string, Finding[]> = {};
  const severityGroups: Record<string, Finding[]> = {};

  data.findings.forEach(f => {
    if (!disciplineGroups[f.discipline]) disciplineGroups[f.discipline] = [];
    disciplineGroups[f.discipline].push(f);

    if (!severityGroups[f.severity]) severityGroups[f.severity] = [];
    severityGroups[f.severity].push(f);
  });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, 62);

  let yPos = 70;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  severityOrder.forEach(sev => {
    const count = severityGroups[sev]?.length || 0;
    if (count > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${sev.toUpperCase()}: `, margin + 5, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${count} issue${count > 1 ? 's' : ''}`, margin + 30, yPos);
      yPos += 6;
    }
  });

  yPos += 6;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Issues by Discipline', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(disciplineGroups).forEach(([discipline, findings]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${discipline.toUpperCase()}: `, margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${findings.length} issue${findings.length > 1 ? 's' : ''}`, margin + 40, yPos);
    yPos += 6;
  });

  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Findings Report', margin, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Each finding includes: Issue Title, Description, Element Details, and Recommended Fix', margin, yPos);
  yPos += 10;

  for (let i = 0; i < data.findings.length; i++) {
    const finding = data.findings[i];

    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${finding.title}`, margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const severityColor = getSeverityColor(finding.severity);
    doc.setFillColor(severityColor.r, severityColor.g, severityColor.b);
    doc.roundedRect(margin, yPos - 4, 18, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(finding.severity.toUpperCase(), margin + 2, yPos);
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(220, 220, 220);
    doc.roundedRect(margin + 22, yPos - 4, 25, 6, 1, 1, 'F');
    doc.text(finding.discipline.toUpperCase(), margin + 24, yPos);

    doc.setFillColor(200, 220, 255);
    doc.roundedRect(margin + 51, yPos - 4, 20, 6, 1, 1, 'F');
    doc.text(finding.status.replace('_', ' ').toUpperCase(), margin + 53, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('BIM Element:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const elementText = finding.element_name || 'Not specified';
    doc.text(elementText, margin + 25, yPos);
    yPos += 6;

    if (finding.element_guid) {
      doc.setFont('helvetica', 'bold');
      doc.text('Element GUID:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(finding.element_guid, margin + 25, yPos);
      doc.setFontSize(9);
      yPos += 6;
    }

    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION:', margin, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    const description = finding.description || 'No description provided';
    const descLines = doc.splitTextToSize(description, contentWidth - 5);

    descLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });

    yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text('RECOMMENDED FIX:', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    const recommendedFix = finding.recommended_fix || 'Review element and consult with design team for appropriate correction';
    const fixLines = doc.splitTextToSize(recommendedFix, contentWidth - 5);

    fixLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });

    if (finding.evidence && finding.evidence.length > 0) {
      const markupEvidence = finding.evidence.filter(e => e.type === 'drawing_markup' && e.url);

      if (markupEvidence.length > 0) {
        yPos += 5;

        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 200);
        doc.text(`VISUAL EVIDENCE: ${markupEvidence.length} marked-up drawing${markupEvidence.length > 1 ? 's' : ''} available`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        yPos += 5;
        doc.text('(See separate Visual Report PDF for marked-up drawings)', margin, yPos);
        doc.setFontSize(9);
        yPos += 3;
      }
    }

    yPos += 8;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    doc.text('Generated by DesignQA', margin, pageHeight - 10);
  }

  doc.save(filename);
}

export function generateShareableReport(data: ReportData): string {
  const reportData = {
    projectName: data.findings[0]?.project?.name || data.projectName,
    projectClient: data.findings[0]?.project?.client || data.projectClient,
    timestamp: data.timestamp,
    totalFindings: data.findings.length,
    findings: data.findings.map(f => ({
      severity: f.severity,
      discipline: f.discipline,
      title: f.title,
      description: f.description,
      recommendedFix: f.recommended_fix,
      element: f.element_name,
      status: f.status
    }))
  };

  const jsonString = JSON.stringify(reportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);

  return url;
}
