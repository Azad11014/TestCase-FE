import * as XLSX from 'xlsx';
import { TestCase } from '@/components/test-case-list';

export const generateTestCasesExcel = (projectName: string, testCases: TestCase[]) => {
    // Map test cases to a flat structure for Excel
    const worksheetData = testCases.map((tc) => ({
        'BRD Reference No.': tc.brdReferenceNo || '',
        'Section Name': tc.sectionName || '',
        'Test Case ID': tc.id,
        'Test Scenario': tc.scenario,
        'Pre-Conditions': tc.preConditions,
        'Test Steps': tc.testSteps,
        'Expected Result': tc.expectedResult,
        'Priority': tc.priority,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths for better readability
    const wscols = [
        { wch: 20 }, // BRD Reference No.
        { wch: 20 }, // Section Name
        { wch: 15 }, // Test Case ID
        { wch: 50 }, // Test Scenario
        { wch: 40 }, // Pre-Conditions
        { wch: 50 }, // Test Steps
        { wch: 40 }, // Expected Result
        { wch: 10 }, // Priority
    ];
    worksheet['!cols'] = wscols;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

    // Generate and save file
    const fileName = `${projectName.replace(/\s+/g, '_')}_TestCases.xlsx`;
    XLSX.writeFile(workbook, fileName);
};
