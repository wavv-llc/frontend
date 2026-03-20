'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Trash2, Upload, X, Check } from 'lucide-react';
import { taxLibraryApi, TaxLibraryDocument } from '@/lib/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TaxDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    date: string;
}

export interface TaxLibraryTabProps {
    organizationId?: string;
    getToken: () => Promise<string | null>;
}

const FILE_TYPES: Record<string, { label: string; color: string; bg: string }> =
    {
        pdf: { label: 'PDF', color: '#6b7a94', bg: '#f5f5f5' },
        docx: { label: 'DOCX', color: '#6b7a94', bg: '#f5f5f5' },
        xlsx: { label: 'XLSX', color: '#6b7a94', bg: '#f5f5f5' },
        csv: { label: 'CSV', color: '#6b7a94', bg: '#f5f5f5' },
        txt: { label: 'TXT', color: '#6b7a94', bg: '#f5f5f5' },
    };

type SortBy = 'name' | 'size' | 'date';
type SortDir = 'asc' | 'desc';

export function TaxLibraryTab({
    organizationId,
    getToken,
}: TaxLibraryTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [taxDocs, setTaxDocs] = useState<TaxDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<Set<string> | null>(
        null,
    );
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Load documents on mount
    useEffect(() => {
        if (organizationId) {
            loadDocuments();
        }
    }, [organizationId]);

    const loadDocuments = async () => {
        if (!organizationId) return;

        try {
            setIsLoading(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await taxLibraryApi.getOrganizationDocuments(
                token,
                organizationId,
            );

            // Map API response to TaxDocument format
            const docs: TaxDocument[] = (
                response.data?.taxLibraryDocuments || []
            ).map((doc: TaxLibraryDocument) => ({
                id: doc.id,
                name: doc.document.originalName,
                type: doc.document.mimeType,
                size: formatBytes(doc.document.filesize),
                date: doc.createdAt.split('T')[0],
            }));
            setTaxDocs(docs);
        } catch (err) {
            console.error('Error loading tax library documents:', err);
            toast.error(
                err instanceof Error ? err.message : 'Failed to load documents',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (!organizationId) {
            toast.error('Organization ID not found');
            return;
        }

        let files: FileList | null = null;
        if ('dataTransfer' in e) {
            files = e.dataTransfer.files;
        } else if ('target' in e && e.target instanceof HTMLInputElement) {
            files = e.target.files;
        }

        if (files && files.length > 0) {
            setIsUploading(true);
            let successCount = 0;
            let errorCount = 0;

            for (const file of Array.from(files)) {
                try {
                    const token = await getToken();
                    if (!token) {
                        toast.error('Authentication required');
                        errorCount++;
                        continue;
                    }

                    await taxLibraryApi.uploadDocument(
                        token,
                        organizationId,
                        file,
                    );
                    successCount++;
                } catch (err) {
                    console.error('Error uploading file:', file.name, err);
                    errorCount++;
                }
            }

            setIsUploading(false);

            if (successCount > 0) {
                toast.success(
                    `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully`,
                );
                await loadDocuments();
            }

            if (errorCount > 0) {
                toast.error(
                    `Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`,
                );
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const toggleDocSelect = (docId: string) => {
        const newSelected = new Set(selectedDocs);
        if (newSelected.has(docId)) {
            newSelected.delete(docId);
        } else {
            newSelected.add(docId);
        }
        setSelectedDocs(newSelected);
    };

    const selectAll = () => {
        if (
            selectedDocs.size === filteredDocs.length &&
            filteredDocs.length > 0
        ) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(filteredDocs.map((d) => d.id)));
        }
    };

    const toggleSort = (field: SortBy) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const docId of Array.from(deleteConfirm)) {
                try {
                    await taxLibraryApi.deleteDocument(token, docId);
                    successCount++;
                } catch (err) {
                    console.error('Error deleting document:', docId, err);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast.success(
                    `${successCount} document${successCount !== 1 ? 's' : ''} deleted`,
                );
                await loadDocuments();
            }

            if (errorCount > 0) {
                toast.error(
                    `Failed to delete ${errorCount} document${errorCount !== 1 ? 's' : ''}`,
                );
            }

            setSelectedDocs(new Set());
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error in handleDelete:', err);
            toast.error('Failed to delete documents');
            setDeleteConfirm(null);
        }
    };

    // Filter documents
    const filteredDocs = taxDocs
        .filter(
            (doc) =>
                searchQuery === '' ||
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.type.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => {
            let compareA: string | number = '';
            let compareB: string | number = '';

            if (sortBy === 'name') {
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
            } else if (sortBy === 'size') {
                compareA = parseSize(a.size);
                compareB = parseSize(b.size);
            } else if (sortBy === 'date') {
                compareA = new Date(a.date).getTime();
                compareB = new Date(b.date).getTime();
            }

            if (compareA < compareB) return sortDir === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const parseSize = (sizeStr: string): number => {
        const match = sizeStr.match(/(\d+\.?\d*)\s*(Bytes|KB|MB|GB)/);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2];
        const multipliers = {
            Bytes: 1,
            KB: 1024,
            MB: 1024 ** 2,
            GB: 1024 ** 3,
        };
        return value * (multipliers[unit as keyof typeof multipliers] || 1);
    };

    return (
        <>
            <style jsx>{`
                .section-subtitle {
                    font-size: 11px;
                    color: #8d9ab0;
                    margin-bottom: 16px;
                }

                .card {
                    background: white;
                    border-radius: 16px;
                    box-shadow:
                        0 1px 3px rgba(14, 17, 23, 0.04),
                        0 4px 16px rgba(14, 17, 23, 0.03);
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .card.delay-1 {
                    animation: fadeUp 400ms cubic-bezier(0.23, 1, 0.32, 1)
                        forwards;
                }

                .card.delay-2 {
                    animation: fadeUp 400ms cubic-bezier(0.23, 1, 0.32, 1) 120ms
                        forwards;
                    opacity: 0;
                }

                .card-header {
                    padding: 20px;
                    border-bottom: 1px solid #eef0f3;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .card-header-left {
                    flex: 1;
                }

                .card-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #272f3b;
                    margin-bottom: 4px;
                }

                .card-desc {
                    font-size: 10px;
                    color: #8d9ab0;
                }

                .tl-upload-zone {
                    padding: 32px;
                    border: 2px dashed #dce1e8;
                    border-radius: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin: 0;
                }

                .tl-upload-zone:hover,
                .tl-upload-zone.drag-over {
                    border-color: #4e5d74;
                    background: #f8f9fa;
                }

                .tl-upload-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: #6b7a94;
                }

                .tl-upload-text {
                    margin-bottom: 12px;
                }

                .tl-upload-text strong {
                    display: block;
                    font-size: 13px;
                    color: #272f3b;
                    margin-bottom: 4px;
                }

                .tl-upload-text span {
                    font-size: 11px;
                    color: #8d9ab0;
                }

                .browse-link {
                    color: #4e5d74;
                    font-weight: 600;
                    text-decoration: underline;
                }

                .tl-upload-formats {
                    display: flex;
                    gap: 6px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .tl-format-tag {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .tl-toolbar {
                    padding: 16px 20px;
                    border-bottom: 1px solid #eef0f3;
                }

                .tl-search-wrap {
                    position: relative;
                }

                .tl-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #8d9ab0;
                    pointer-events: none;
                }

                .tl-search {
                    width: 100%;
                    height: 32px;
                    padding: 0 12px 0 36px;
                    border: 1px solid #dce1e8;
                    border-radius: 8px;
                    font-size: 11px;
                    color: #272f3b;
                    background: white;
                    transition: all 0.2s;
                }

                .tl-search:focus {
                    outline: none;
                    border-color: #b8c1ce;
                    box-shadow: 0 0 0 3px rgba(184, 193, 206, 0.1);
                }

                .tl-bulk-bar {
                    padding: 12px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eef0f3;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #4e5d74;
                    font-weight: 600;
                }

                .tl-bulk-actions {
                    display: flex;
                    gap: 8px;
                }

                .tl-bulk-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }

                .tl-bulk-btn.deselect {
                    background: white;
                    color: #6b7a94;
                }

                .tl-bulk-btn.deselect:hover {
                    background: #eef0f3;
                }

                .tl-bulk-btn.delete {
                    background: #272f3b;
                    color: white;
                }

                .tl-bulk-btn.delete:hover {
                    background: #1a2230;
                }

                .tl-list-header {
                    display: grid;
                    grid-template-columns: 32px 1fr 100px 100px 48px;
                    gap: 12px;
                    padding: 12px 20px;
                    border-bottom: 1px solid #eef0f3;
                    align-items: center;
                }

                .tl-header-check {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #dce1e8;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .tl-header-check:hover {
                    border-color: #4e5d74;
                }

                .tl-header-check.checked {
                    background: #272f3b;
                    border-color: #272f3b;
                }

                .tl-sort-btn {
                    background: none;
                    border: none;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #8d9ab0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 0;
                    text-align: left;
                    transition: color 0.2s;
                }

                .tl-sort-btn:hover {
                    color: #4e5d74;
                }

                .tl-sort-btn.active {
                    color: #272f3b;
                }

                .tl-sort-arrow {
                    font-size: 8px;
                    transition: transform 0.2s;
                }

                .tl-sort-arrow.desc {
                    transform: rotate(180deg);
                }

                .tl-doc-list {
                    max-height: 500px;
                    overflow-y: auto;
                }

                .tl-doc-row {
                    display: grid;
                    grid-template-columns: 32px 1fr 100px 100px 48px;
                    gap: 12px;
                    padding: 12px 20px;
                    border-bottom: 1px solid #eef0f366;
                    align-items: center;
                    transition: background 0.2s;
                }

                .tl-doc-row:hover {
                    background: #f8f9fa;
                }

                .tl-doc-row.is-selected {
                    background: #eef0f3;
                }

                .tl-doc-check {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #dce1e8;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .tl-doc-check:hover {
                    border-color: #4e5d74;
                }

                .tl-doc-check.checked {
                    background: #272f3b;
                    border-color: #272f3b;
                }

                .tl-doc-main {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }

                .tl-file-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    flex-shrink: 0;
                }

                .tl-doc-info {
                    min-width: 0;
                    flex: 1;
                }

                .tl-doc-name {
                    font-size: 11px;
                    font-weight: 600;
                    color: #272f3b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .tl-doc-meta {
                    font-size: 9px;
                    color: #8d9ab0;
                    margin-top: 2px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .tl-doc-meta-dot {
                    width: 2px;
                    height: 2px;
                    border-radius: 50%;
                    background: #dce1e8;
                }

                .tl-doc-size {
                    font-size: 10px;
                    color: #6b7a94;
                    font-weight: 500;
                    text-align: right;
                }

                .tl-doc-date {
                    font-size: 10px;
                    color: #6b7a94;
                    font-weight: 500;
                    text-align: right;
                }

                .tl-doc-actions {
                    display: flex;
                    justify-content: flex-end;
                }

                .tl-action-btn {
                    padding: 6px;
                    border: none;
                    border-radius: 6px;
                    background: none;
                    cursor: pointer;
                    color: #8d9ab0;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .tl-action-btn:hover {
                    background: #eef0f3;
                    color: #4e5d74;
                }

                .tl-action-btn.danger:hover {
                    background: #272f3b10;
                    color: #272f3b;
                }

                .tl-empty {
                    padding: 48px 20px;
                    text-align: center;
                }

                .tl-empty-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px;
                    color: #8d9ab0;
                }

                .tl-empty strong {
                    display: block;
                    font-size: 12px;
                    color: #272f3b;
                    margin-bottom: 4px;
                }

                .tl-empty span {
                    font-size: 11px;
                    color: #8d9ab0;
                }
            `}</style>

            <div className="section-header">
                <div className="section-subtitle">
                    Upload and manage your organization&apos;s tax reference
                    library
                </div>
            </div>

            {!organizationId ? (
                <div
                    className="card delay-1"
                    style={{ padding: '48px 20px', textAlign: 'center' }}
                >
                    <p
                        style={{
                            fontSize: '11px',
                            color: '#8d9ab0',
                        }}
                    >
                        Unable to load organization information.
                    </p>
                </div>
            ) : (
                <>
                    {/* Upload Zone */}
                    <div
                        className="card delay-1"
                        style={{ overflow: 'visible' }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.docx,.xlsx,.csv,.txt"
                            style={{ display: 'none' }}
                            onChange={handleFileDrop}
                            disabled={isUploading}
                        />
                        <div
                            className={`tl-upload-zone${dragOver ? ' drag-over' : ''}${isUploading ? ' uploading' : ''}`}
                            onClick={() =>
                                !isUploading && fileInputRef.current?.click()
                            }
                            onDragOver={(e) => {
                                if (!isUploading) {
                                    e.preventDefault();
                                    setDragOver(true);
                                }
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => !isUploading && handleFileDrop(e)}
                            style={{
                                opacity: isUploading ? 0.6 : 1,
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <div className="tl-upload-icon">
                                {isUploading ? (
                                    <Loader2
                                        size={24}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Upload size={24} />
                                )}
                            </div>
                            <div className="tl-upload-text">
                                <strong>
                                    {isUploading
                                        ? 'Uploading...'
                                        : dragOver
                                          ? 'Drop files here'
                                          : 'Upload to Tax Library'}
                                </strong>
                                {!isUploading && (
                                    <span>
                                        Drag and drop files, or{' '}
                                        <span className="browse-link">
                                            browse
                                        </span>
                                    </span>
                                )}
                            </div>
                            {!isUploading && (
                                <div className="tl-upload-formats">
                                    {Object.entries(FILE_TYPES).map(
                                        ([ext, ft]) => (
                                            <span
                                                key={ext}
                                                className="tl-format-tag"
                                                style={{
                                                    background: ft.bg,
                                                    color: ft.color,
                                                }}
                                            >
                                                {ft.label}
                                            </span>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Library */}
                    <div className="card delay-2">
                        <div className="card-header">
                            <div className="card-header-left">
                                <div className="card-title">
                                    Library Documents
                                </div>
                                <div className="card-desc">
                                    {taxDocs.length} document
                                    {taxDocs.length !== 1 ? 's' : ''} in your
                                    tax library
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="tl-toolbar">
                            <div className="tl-search-wrap">
                                <div className="tl-search-icon">
                                    <Search size={15} />
                                </div>
                                <input
                                    className="tl-search"
                                    type="text"
                                    placeholder="Search documents by name or type..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Bulk actions */}
                        {selectedDocs.size > 0 && (
                            <div className="tl-bulk-bar">
                                <span>
                                    {selectedDocs.size} document
                                    {selectedDocs.size !== 1 ? 's' : ''}{' '}
                                    selected
                                </span>
                                <div className="tl-bulk-actions">
                                    <button
                                        className="tl-bulk-btn deselect"
                                        onClick={() =>
                                            setSelectedDocs(new Set())
                                        }
                                    >
                                        <X size={13} /> Clear
                                    </button>
                                    <button
                                        className="tl-bulk-btn delete"
                                        onClick={() =>
                                            setDeleteConfirm(selectedDocs)
                                        }
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading ? (
                            <div
                                style={{
                                    padding: '48px 20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Loader2
                                    size={32}
                                    className="animate-spin"
                                    style={{
                                        margin: '0 auto 12px',
                                        color: '#8d9ab0',
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#8d9ab0',
                                    }}
                                >
                                    Loading documents...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="tl-list-header">
                                    <div
                                        className={`tl-header-check${selectedDocs.size === filteredDocs.length && filteredDocs.length > 0 ? ' checked' : ''}`}
                                        onClick={selectAll}
                                    >
                                        {selectedDocs.size ===
                                            filteredDocs.length &&
                                            filteredDocs.length > 0 && (
                                                <Check
                                                    size={12}
                                                    stroke="white"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                    </div>
                                    <button
                                        className={`tl-sort-btn${sortBy === 'name' ? ' active' : ''}`}
                                        onClick={() => toggleSort('name')}
                                    >
                                        Name
                                        {sortBy === 'name' && (
                                            <span
                                                className={`tl-sort-arrow${sortDir === 'desc' ? ' desc' : ''}`}
                                            >
                                                &#9650;
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className={`tl-sort-btn${sortBy === 'size' ? ' active' : ''}`}
                                        onClick={() => toggleSort('size')}
                                        style={{ justifySelf: 'end' }}
                                    >
                                        Size
                                        {sortBy === 'size' && (
                                            <span
                                                className={`tl-sort-arrow${sortDir === 'desc' ? ' desc' : ''}`}
                                            >
                                                &#9650;
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className={`tl-sort-btn${sortBy === 'date' ? ' active' : ''}`}
                                        onClick={() => toggleSort('date')}
                                        style={{ justifySelf: 'end' }}
                                    >
                                        Date
                                        {sortBy === 'date' && (
                                            <span
                                                className={`tl-sort-arrow${sortDir === 'desc' ? ' desc' : ''}`}
                                            >
                                                &#9650;
                                            </span>
                                        )}
                                    </button>
                                    <div />
                                </div>

                                <div className="tl-doc-list">
                                    {filteredDocs.length === 0 ? (
                                        <div className="tl-empty">
                                            <div className="tl-empty-icon">
                                                <Search size={22} />
                                            </div>
                                            <strong>No documents found</strong>
                                            <span>
                                                Try adjusting your search
                                            </span>
                                        </div>
                                    ) : (
                                        filteredDocs.map((doc) => {
                                            const ft =
                                                FILE_TYPES[doc.type] ||
                                                FILE_TYPES.txt;
                                            const isSel = selectedDocs.has(
                                                doc.id,
                                            );
                                            return (
                                                <div
                                                    key={doc.id}
                                                    className={`tl-doc-row${isSel ? ' is-selected' : ''}`}
                                                >
                                                    <div
                                                        className={`tl-doc-check${isSel ? ' checked' : ''}`}
                                                        onClick={() =>
                                                            toggleDocSelect(
                                                                doc.id,
                                                            )
                                                        }
                                                    >
                                                        {isSel && (
                                                            <Check
                                                                size={11}
                                                                stroke="white"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="tl-doc-main">
                                                        <div
                                                            className="tl-file-badge"
                                                            style={{
                                                                background:
                                                                    ft.bg,
                                                                color: ft.color,
                                                            }}
                                                        >
                                                            {ft.label}
                                                        </div>
                                                        <div className="tl-doc-info">
                                                            <div className="tl-doc-name">
                                                                {doc.name}
                                                            </div>
                                                            <div className="tl-doc-meta">
                                                                <span>
                                                                    {doc.type.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="tl-doc-size">
                                                        {doc.size}
                                                    </div>
                                                    <div className="tl-doc-date">
                                                        {formatDate(doc.date)}
                                                    </div>
                                                    <div className="tl-doc-actions">
                                                        <button
                                                            className="tl-action-btn danger"
                                                            onClick={() =>
                                                                setDeleteConfirm(
                                                                    new Set([
                                                                        doc.id,
                                                                    ]),
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={(open) => !open && setDeleteConfirm(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Documents</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            {deleteConfirm?.size || 0} document
                            {deleteConfirm && deleteConfirm.size !== 1
                                ? 's'
                                : ''}
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
