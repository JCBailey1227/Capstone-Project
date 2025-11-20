import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Copy, Check, Upload, FileText, X, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const sampleSummary = `Artificial intelligence (AI) is transforming how we conduct and consume research. 
This demo shows the kind of structured, concise summaries your papers can get. 
Upload one or more PDFs, DOCX, or TXT files and the AI will extract key ideas, 
methods, and conclusions so you can review complex material in minutes instead of hours.`;

type SummaryItem = {
  filename: string;
  summary?: string;
  error?: string;
};

export function Demo() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [combinedSummary, setCombinedSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [combinedCopied, setCombinedCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    setSummaries([]);
    setCombinedSummary(null);
    setCopiedIndex(null);
    setCombinedCopied(false);
  };

  const handleClearFiles = () => {
    setUploadedFiles([]);
    setSummaries([]);
    setCombinedSummary(null);
    setCopiedIndex(null);
    setCombinedCopied(false);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    // For simplicity, clear summaries when the file list changes
    setSummaries([]);
    setCombinedSummary(null);
    setCopiedIndex(null);
    setCombinedCopied(false);
  };

  const handleSummarize = async () => {
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    setSummaries([]);
    setCombinedSummary(null);
    setCopiedIndex(null);
    setCombinedCopied(false);

    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file); // matches backend: request.files.getlist("files")
      });
      formData.append('length', summaryLength);

      const response = await fetch('http://127.0.0.1:5000/api/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setSummaries([
          {
            filename: '',
            error: data?.error || 'Failed to summarize files.',
          },
        ]);
        setCombinedSummary(null);
      } else {
        if (Array.isArray(data.summaries)) {
          setSummaries(data.summaries);
        } else if (data.summary) {
          setSummaries([
            {
              filename: uploadedFiles[0]?.name || 'Document',
              summary: data.summary,
            },
          ]);
        } else {
          setSummaries([]);
        }

        if (typeof data.combined_summary === 'string' && data.combined_summary.trim() !== '') {
          setCombinedSummary(data.combined_summary);
        } else {
          setCombinedSummary(null);
        }
      }
    } catch (error) {
      console.error(error);
      setSummaries([
        {
          filename: '',
          error: 'Error: Could not reach the summarization server.',
        },
      ]);
      setCombinedSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (index: number) => {
    const item = summaries[index];
    if (!item?.summary) return;

    navigator.clipboard.writeText(item.summary);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = (index: number) => {
    const item = summaries[index];
    if (!item?.summary) return;

    const blob = new Blob([item.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = item.filename ? item.filename.split('.')[0] : `paper_${index + 1}`;
    a.href = url;
    a.download = `${baseName}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCombined = () => {
    if (!combinedSummary) return;
    navigator.clipboard.writeText(combinedSummary);
    setCombinedCopied(true);
    setTimeout(() => setCombinedCopied(false), 2000);
  };

  const handleDownloadCombined = () => {
    if (!combinedSummary) return;

    const blob = new Blob([combinedSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="summarizer" className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
            Paper Summarizer
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload one or more research papers and get AI-generated summaries of their key findings,
            plus an integrated overview of all papers combined.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload papers</CardTitle>
              <CardDescription>
                Support for PDF, DOCX, and TXT. Select multiple files to summarize them individually and together.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="upload">Upload your papers</TabsTrigger>
                  <TabsTrigger value="example">See an example</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="pt-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50">
                    {uploadedFiles.length === 0 ? (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          multiple
                          onChange={handleFileUpload}
                        />
                        <Upload className="w-12 h-12 text-slate-400 mb-4" />
                        <p className="text-slate-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-slate-400">
                          PDF, DOC, DOCX, or TXT (you can select multiple files)
                        </p>
                      </label>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-6 h-6 text-red-600" />
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFiles}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear all
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="example" className="pt-4 text-sm text-slate-600">
                  <p className="mb-2 font-medium text-slate-900">
                    Example summary preview
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {sampleSummary}
                  </p>
                </TabsContent>
              </Tabs>

              <div className="text-xs text-slate-500">
                Your files stay on your device except for the content needed to generate summaries.
              </div>
            </CardContent>
          </Card>

          {/* Output Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summaries</CardTitle>
              <CardDescription>
                AI-generated summaries for each file and an integrated overview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[300px] p-4 bg-slate-50 rounded-lg border border-slate-200">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Sparkles className="w-5 h-5 animate-pulse text-red-600" />
                      <span>Generating summaries...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Combined summary card */}
                    {combinedSummary && (
                      <div className="rounded-lg bg-white border border-slate-300 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-red-600" />
                            <p className="text-sm font-semibold text-slate-900">
                              Combined Summary (All Papers)
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleCopyCombined}
                            >
                              {combinedCopied ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleDownloadCombined}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {combinedSummary}
                        </p>
                      </div>
                    )}

                    {/* Per-file summaries */}
                    {summaries.length > 0 ? (
                      summaries.map((item, index) => (
                        <div
                          key={`${item.filename}-${index}`}
                          className="rounded-lg bg-white border border-slate-200 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-red-600" />
                              <p className="text-sm font-medium text-slate-900">
                                {item.filename || `File ${index + 1}`}
                              </p>
                            </div>
                            {!item.error && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleCopy(index)}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDownload(index)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {item.error ? (
                            <p className="text-sm text-red-600">{item.error}</p>
                          ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {item.summary}
                            </p>
                          )}
                        </div>
                      ))
                    ) : !combinedSummary ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                        <Sparkles className="w-8 h-8 text-red-600 mb-3" />
                        <p className="font-medium text-slate-700 mb-1">
                          No summary yet
                        </p>
                        <p className="text-sm max-w-sm">
                          Upload one or more papers on the left and click{' '}
                          <span className="font-semibold">Summarize</span> to see per-paper and combined summaries here.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Tabs
            value={summaryLength}
            onValueChange={v => setSummaryLength(v as 'short' | 'medium' | 'long')}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="short">Short</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="long">Detailed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="lg"
            onClick={handleSummarize}
            disabled={uploadedFiles.length === 0 || isLoading}
            className="bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-slate-900"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Summarize
          </Button>
        </div>
      </div>
    </div>
  );
}
