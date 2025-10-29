import React, { useState } from 'react';
import {
    Upload, FileSpreadsheet, CheckCircle,
    XCircle, Loader2, X, RefreshCw, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { drugService } from '../../api';

const DrugBulkImport = () => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const drugCategories = [
        { value: 'antibiotic', label: 'Antibiotic' },
        { value: 'painkiller', label: 'Painkiller' },
        { value: 'vitamin', label: 'Vitamin' },
        { value: 'prescription', label: 'Prescription' },
        { value: 'over_counter', label: 'Over The Counter' }
    ];

    const dosageForms = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
        'Drop', 'Inhaler', 'Patch', 'Suppository', 'Powder', 'Suspension'
    ];
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
                toast.error('Please select a valid Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            setShowResults(false);
            setImportResults(null);
            readExcelFile(selectedFile);
        }
    };

    const readExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    toast.error('The Excel file is empty');
                    setFile(null);
                    return;
                }

                // Validate and transform data
                const transformedData = jsonData.map((row, index) => {
                    const errors = [];

                    // Required field validation
                    if (!row['Drug Name']) errors.push('Drug Name is required');
                    if (!row['Generic Name']) errors.push('Generic Name is required');
                    if (!row['Category']) errors.push('Category is required');
                    if (!row['Description']) errors.push('Description is required');
                    if (!row['Dosage Form']) errors.push('Dosage Form is required');
                    if (!row['Manufacturer']) errors.push('Manufacturer is required');

                    // Category validation
                    const validCategories = drugCategories.map(c => c.value);
                    if (row['Category'] && !validCategories.includes(row['Category'].toLowerCase())) {
                        errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
                    }

                    // Dosage Form validation
                    if (row['Dosage Form'] && !dosageForms.includes(row['Dosage Form'])) {
                        errors.push(`Invalid dosage form. Must be one of: ${dosageForms.join(', ')}`);
                    }

                    // Prescription validation
                    const prescriptionValue = String(row['Requires Prescription']).toLowerCase();
                    const requiresPrescription = ['yes', 'true', '1', 'y'].includes(prescriptionValue);

                    return {
                        rowNumber: index + 2, // +2 because Excel rows start at 1 and we have a header
                        data: {
                            name: row['Drug Name'] || '',
                            generic_name: row['Generic Name'] || '',
                            category: row['Category'] ? row['Category'].toLowerCase() : '',
                            description: row['Description'] || '',
                            dosage_form: row['Dosage Form'] || '',
                            manufacturer: row['Manufacturer'] || '',
                            requires_prescription: requiresPrescription
                        },
                        errors: errors,
                        isValid: errors.length === 0
                    };
                });

                setPreviewData(transformedData);
                setShowPreview(true);

                const validCount = transformedData.filter(d => d.isValid).length;
                const invalidCount = transformedData.filter(d => !d.isValid).length;

                if (invalidCount > 0) {
                    toast.warning(`Found ${validCount} valid and ${invalidCount} invalid records`);
                } else {
                    toast.success(`Found ${validCount} valid records ready to import`);
                }
            } catch (error) {
                console.error('Error reading Excel file:', error);
                toast.error('Failed to read Excel file. Please check the format.');
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Import drugs to database
    const handleImport = async () => {
        const validRecords = previewData.filter(d => d.isValid);

        if (validRecords.length === 0) {
            toast.error('No valid records to import');
            return;
        }

        setImporting(true);
        const results = {
            total: validRecords.length,
            successful: 0,
            failed: 0,
            details: []
        };

        try {
            for (const record of validRecords) {
                try {
                    const response = await drugService.create(record.data);
                    if (response.success) {
                        results.successful++;
                        results.details.push({
                            rowNumber: record.rowNumber,
                            drugName: record.data.name,
                            status: 'success',
                            message: 'Successfully imported'
                        });
                    } else {
                        results.failed++;
                        results.details.push({
                            rowNumber: record.rowNumber,
                            drugName: record.data.name,
                            status: 'error',
                            message: response.error || 'Failed to import'
                        });
                    }
                } catch (error) {
                    results.failed++;
                    results.details.push({
                        rowNumber: record.rowNumber,
                        drugName: record.data.name,
                        status: 'error',
                        message: error.message || 'Failed to import'
                    });
                }
            }

            setImportResults(results);
            setShowResults(true);
            setShowPreview(false);

            if (results.failed === 0) {
                toast.success(`Successfully imported all ${results.successful} drugs!`);
            } else {
                toast.warning(`Imported ${results.successful} drugs, ${results.failed} failed`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('An error occurred during import');
        } finally {
            setImporting(false);
        }
    };

    // Reset and start over
    const handleReset = () => {
        setFile(null);
        setPreviewData([]);
        setShowPreview(false);
        setImportResults(null);
        setShowResults(false);
    };

    const getCategoryDisplay = (category) => {
        const categoryObj = drugCategories.find(c => c.value === category);
        return categoryObj ? categoryObj.label : category;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bulk Drug Import</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Upload an Excel file to import multiple drugs at once
                    </p>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>
            </div>



            {/* File Upload */}
            {!showPreview && !showResults && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="max-w-xl mx-auto">
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                <p className="mb-2 text-sm text-gray-700 font-medium">
                                    <span className="text-blue-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                                {file && (
                                    <div className="mt-4 flex items-center space-x-2 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>{file.name}</span>
                                    </div>
                                )}
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Preview Data */}
            {showPreview && !showResults && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Preview Import Data</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Review {previewData.length} records before importing
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing || previewData.filter(d => d.isValid).length === 0}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import {previewData.filter(d => d.isValid).length} Drugs
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generic Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage Form</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescription</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {previewData.map((record, index) => (
                                    <tr key={index} className={record.isValid ? 'bg-white' : 'bg-red-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.rowNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {record.isValid ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Valid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Invalid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.data.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.data.generic_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.data.category ? getCategoryDisplay(record.data.category) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.data.dosage_form || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.data.manufacturer || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {record.data.requires_prescription ? (
                                                <span className="text-red-600 font-medium">Yes</span>
                                            ) : (
                                                <span className="text-green-600 font-medium">No</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Error Details */}
                    {previewData.some(d => !d.isValid) && (
                        <div className="p-6 bg-red-50 border-t border-red-200">
                            <h4 className="text-sm font-semibold text-red-900 mb-3">Validation Errors</h4>
                            <div className="space-y-2">
                                {previewData.filter(d => !d.isValid).map((record, index) => (
                                    <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                                        <p className="text-sm font-medium text-gray-900">
                                            Row {record.rowNumber}: {record.data.name || 'Unnamed Drug'}
                                        </p>
                                        <ul className="mt-1 list-disc list-inside text-sm text-red-600">
                                            {record.errors.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Import Results */}
            {showResults && importResults && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Import completed: {importResults.successful} successful, {importResults.failed} failed
                                </p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Import Another File
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Total Processed</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">{importResults.total}</p>
                                </div>
                                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-900">Successful</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">{importResults.successful}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-900">Failed</p>
                                    <p className="text-2xl font-bold text-red-900 mt-1">{importResults.failed}</p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {importResults.details.map((detail, index) => (
                                    <tr key={index} className={detail.status === 'success' ? 'bg-white' : 'bg-red-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {detail.rowNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {detail.drugName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {detail.status === 'success' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {detail.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrugBulkImport;