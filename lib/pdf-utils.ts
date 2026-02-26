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

        if (tc.preconditions && tc.preconditions.length > 0) {
            height += tc.preconditions.length * 5 + 9;
        }

        if (tc.steps && tc.steps.length > 0) {
            height += 9;
            tc.steps.forEach(step => {
                const stepLines = doc.splitTextToSize(step, pageWidth - 45);
                height += (stepLines.length * 5);
            });
        }

        if (tc.expected_result && tc.expected_result.length > 0) {
            height += 9;
            let expHeight = 2;
            tc.expected_result.forEach(res => {
                const lines = doc.splitTextToSize(res, pageWidth - 50);
                expHeight += (lines.length * 5);
            });
            height += expHeight + 10;
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
        const priorityColor = tc.priority === 'P0' ? [239, 68, 68] : tc.priority === 'P1' ? [249, 115, 22] : tc.priority === 'P2' ? [234, 179, 8] : [100, 116, 139];
        doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        doc.roundedRect(20, yPos + 7, 12, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(tc.priority, 26, yPos + 11.5, { align: 'center' });

        // ID and Test Type
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`ID: ${tc.id}`, 36, yPos + 9);

        const typeColor = tc.test_type.toLowerCase() === 'positive' ? [34, 197, 94] : tc.test_type.toLowerCase() === 'negative' ? [239, 68, 68] : [59, 130, 246];
        doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
        doc.text(tc.test_type.toUpperCase(), pageWidth - 30, yPos + 9, { align: 'right' });

        // Title
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        const cleanedTitle = cleanText(tc.title);
        doc.text(cleanedTitle, 36, yPos + 16);

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
        if (tc.preconditions && tc.preconditions.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('PRECONDITIONS', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            yPos += 6;
            tc.preconditions.forEach(item => {
                const cleanedItem = cleanText(item);
                doc.text(`• ${cleanedItem}`, 24, yPos);
                yPos += 5;
            });
            yPos += 3;
        }

        // Test Steps
        if (tc.steps && tc.steps.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('TEST STEPS', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            yPos += 6;
            tc.steps.forEach((step, i) => {
                const cleanedStep = cleanText(step);
                const stepLines = doc.splitTextToSize(`${i + 1}. ${cleanedStep}`, pageWidth - 45);
                doc.text(stepLines, 24, yPos);
                yPos += (stepLines.length * 5);
            });
            yPos += 3;
        }

        // Expected Result
        if (tc.expected_result && tc.expected_result.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('EXPECTED RESULT', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            yPos += 6;

            const expStartY = yPos - 1;
            let expContentHeight = 2;
            tc.expected_result.forEach(res => {
                const lines = doc.splitTextToSize(res, pageWidth - 50);
                expContentHeight += (lines.length * 5);
            });

            doc.setFillColor(240, 249, 255);
            doc.setDrawColor(186, 230, 253);
            doc.roundedRect(20, expStartY, pageWidth - 40, expContentHeight + 4, 1, 1, 'FD');

            tc.expected_result.forEach(res => {
                const cleanedRes = cleanText(res);
                const resLines = doc.splitTextToSize(cleanedRes, pageWidth - 50);
                doc.text(resLines, 24, yPos + 3);
                yPos += (resLines.length * 5);
            });
            yPos += 10;
        }

        yPos += 5;
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
    });

    doc.save(`${projectName.replace(/\s+/g, '_')}_TestCases_Fixed.pdf`);
};
