import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TestCase } from '@/components/test-case-list';

export const generateTestCasesPDF = (projectName: string, testCases: TestCase[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const bottomMargin = 20;
    let yPos = 20;

    // Helper to clean text for standard jsPDF fonts (WinAnsiEncoding)
    const cleanText = (text: string): string => {
        if (!text) return '';
        // Replace common non-standard characters with approximations
        return text
            .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ') // Filter to basic Latin and Latin-1 supplement
            .replace(/&/g, '&') // Just making sure
            .trim();
    };

    const addHeader = () => {
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text('Test Case Report', margin, yPos);

        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        yPos += 10;
        doc.text(`Project: ${cleanText(projectName)}`, margin, yPos);
        doc.text(`Total Scenarios: ${testCases.length}`, margin, yPos + 7);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 20;
    };

    const calculateTCHeight = (tc: TestCase): number => {
        let height = 35; // Header + spacing

        if (tc.scenario) {
            const lines = doc.splitTextToSize(tc.scenario, pageWidth - 40);
            height += (lines.length * 5) + 11;
        }

        if (tc.preConditions) {
            const lines = doc.splitTextToSize(tc.preConditions, pageWidth - 40);
            height += (lines.length * 5) + 9;
        }

        if (tc.testSteps) {
            height += 9;
            const stepLines = doc.splitTextToSize(tc.testSteps, pageWidth - 45);
            height += (stepLines.length * 5);
        }

        if (tc.expectedResult) {
            height += 9;
            const lines = doc.splitTextToSize(tc.expectedResult, pageWidth - 50);
            height += (lines.length * 5) + 10;
        }

        return height + 10; // Extra padding
    };

    addHeader();

    testCases.forEach((tc) => {
        const tcHeight = calculateTCHeight(tc);

        if (yPos + tcHeight > pageHeight - bottomMargin) {
            doc.addPage();
            yPos = 20;
        }

        // Title & ID Box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 2, 2, 'F');

        // Priority Badge
        const priority = tc.priority.toUpperCase();
        const priorityColor = priority === 'CRITICAL' ? [239, 68, 68] : priority === 'HIGH' ? [249, 115, 22] : priority === 'MEDIUM' ? [234, 179, 8] : [100, 116, 139];
        doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        doc.roundedRect(20, yPos + 7, 18, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(priority, 29, yPos + 11.2, { align: 'center' });

        // ID and Section Information
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`ID: ${tc.id}`, 42, yPos + 9);

        if (tc.brdReferenceNo) {
            doc.text(`Ref: ${tc.brdReferenceNo}`, pageWidth - 30, yPos + 9, { align: 'right' });
        }

        // Section Name
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        const sectionText = tc.sectionName ? `Section: ${tc.sectionName}` : 'Scenario Detail';
        doc.text(cleanText(sectionText), 42, yPos + 16);

        yPos += 30;

        // Content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Scenario
        if (tc.scenario) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('SCENARIO', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            yPos += 6;
            const cleanedScenario = cleanText(tc.scenario);
            const scenarioLines = doc.splitTextToSize(cleanedScenario, pageWidth - 40);
            doc.text(scenarioLines, 20, yPos);
            yPos += (scenarioLines.length * 5) + 5;
        }

        // Preconditions
        if (tc.preConditions) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('PRECONDITIONS', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            yPos += 6;
            const cleanedPre = cleanText(tc.preConditions);
            const preLines = doc.splitTextToSize(cleanedPre, pageWidth - 40);
            doc.text(preLines, 20, yPos);
            yPos += (preLines.length * 5) + 5;
        }

        // Test Steps
        if (tc.testSteps) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('TEST STEPS', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            yPos += 6;
            const cleanedSteps = cleanText(tc.testSteps);
            const stepLines = doc.splitTextToSize(cleanedSteps, pageWidth - 45);
            doc.text(stepLines, 20, yPos);
            yPos += (stepLines.length * 5) + 5;
        }

        // Expected Result
        if (tc.expectedResult) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('EXPECTED RESULT', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            yPos += 6;

            const expStartY = yPos - 1;
            const cleanedRes = cleanText(tc.expectedResult);
            const resLines = doc.splitTextToSize(cleanedRes, pageWidth - 50);
            const expContentHeight = (resLines.length * 5) + 4;

            doc.setFillColor(240, 249, 255);
            doc.setDrawColor(186, 230, 253);
            doc.roundedRect(20, expStartY, pageWidth - 40, expContentHeight + 4, 1, 1, 'FD');

            doc.text(resLines, 24, yPos + 4);
            yPos += expContentHeight + 10;
        }

        yPos += 5;
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
    });

    doc.save(`${projectName.replace(/\s+/g, '_')}_TestCases.pdf`);
};
