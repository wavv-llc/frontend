'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, ArrowLeft, Calendar, HardDrive, FileType, Clock, ExternalLink, RefreshCw, Play } from 'lucide-react'
import { documentsApi, DocumentDetail } from '@/lib/api'
import { DocumentDetailSkeleton } from '@/components/skeletons/DocumentDetailSkeleton'
import { toast } from 'sonner';

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, getToken } = useAuth()
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isReembedding, setIsReembedding] = useState(false)

  const documentId = params.id as string

  useEffect(() => {
    if (isLoaded && documentId) {
      loadDocument()
    }
  }, [isLoaded, documentId])

  const loadDocument = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await documentsApi.getDocument(token, documentId)

      if (response.data) {
        setDocument(response.data.document)
      }
    } catch (err) {
      console.error('Error loading document:', err)
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryDocument = async () => {
    if (!document) return

    try {
      setIsRetrying(true)
      const token = await getToken()
      if (!token) return

      await documentsApi.retryDocument(token, document.id)
      toast.success('Re-process request sent successfully')
      await loadDocument()
    } catch (err) {
      console.error('Error retrying document:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry document')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleReembedDocument = async () => {
    if (!document) return

    try {
      setIsReembedding(true)
      const token = await getToken()
      if (!token) return

      await documentsApi.reembedDocument(token, document.id)
      toast.success('Re-embed request sent successfully')
      await loadDocument()
    } catch (err) {
      console.error('Error re-embedding document:', err)
      setError(err instanceof Error ? err.message : 'Failed to re-embed document')
    } finally {
      setIsReembedding(false)
    }
  }

  // Determine which retry buttons to show based on status
  const canRetryProcessing = document?.status === 'FAILED' ||
                             document?.status === 'PROCESSING' ||
                             document?.status === 'EMBEDDING' ||
                             document?.status === 'READY'

  const canRetryEmbedding = document?.status === 'EMBEDDING' ||
                           document?.status === 'READY'

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: DocumentDetail['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</span>
      case 'PROCESSING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Processing</span>
      case 'EMBEDDING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Embedding</span>
      case 'READY':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ready</span>
      case 'PENDING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
      case 'FAILED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">{status}</span>
    }
  }

  if (!isLoaded || isLoading) {
    return <DocumentDetailSkeleton />
  }

  if (error) {
    return (
      <div className="h-full overflow-auto p-6 pb-12 animate-in fade-in duration-300">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-destructive">
                <p className="text-lg font-medium">Error loading document</p>
                <p className="text-sm mt-1">{error}</p>
                <Button onClick={loadDocument} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="h-full overflow-auto p-6 pb-12 animate-in fade-in duration-300">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Document not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 pb-12 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold truncate" title={document.originalName}>
              {document.originalName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(document.status)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canRetryEmbedding && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReembedDocument}
                disabled={isReembedding}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isReembedding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry Embed
                  </>
                )}
              </Button>
            )}
            {canRetryProcessing && (
              <Button
                variant={canRetryEmbedding ? "outline" : "default"}
                size="sm"
                onClick={handleRetryDocument}
                disabled={isRetrying}
                className={!canRetryEmbedding
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : ""
                }
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Retry Process
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Information about this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileType className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">File Type</p>
                    <p className="text-sm">{document.mimeType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HardDrive className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">File Size</p>
                    <p className="text-sm">{formatFileSize(document.filesize)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Filename</p>
                    <p className="text-sm font-mono text-xs break-all">{document.filename}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDate(document.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{formatDate(document.updatedAt)}</p>
                  </div>
                </div>

                {document.sourceType && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Source</p>
                      <p className="text-sm">{document.sourceType}</p>
                      {document.sourceUrl && (
                        <a
                          href={document.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {document.sourceUrl}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {document.chunks && document.chunks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Document Chunks</CardTitle>
              <CardDescription>
                Processed content chunks ({document.chunks.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {document.chunks.map((chunk, index) => (
                  <div
                    key={chunk.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Chunk {index + 1}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {chunk.id.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
