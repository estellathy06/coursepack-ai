"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Check, AlertCircle, Trash2, Loader2 } from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  wordCount: number;
  text: string;
  status: "idle" | "parsing" | "completed" | "error";
  errorMessage?: string;
}

interface FileUploaderProps {
  onFilesProcessed: (aggregatedText: string, filesList: { name: string; size: number }[]) => void;
  onReset: () => void;
}

export default function FileUploader({ onFilesProcessed, onReset }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [overallStatus, setOverallStatus] = useState<"idle" | "processing" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically load PDFJS from CDN for client-side PDF parsing
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        // Point to the worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF parser library."));
      document.head.appendChild(script);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const parseFile = async (file: File): Promise<{ text: string; wordCount: number }> => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "pdf") {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map((item: any) => item.str);
        text += strings.join(" ") + "\n";
      }
      
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { text, wordCount };
    } 
    else if (fileExtension === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { text, wordCount };
    } 
    else if (fileExtension === "txt" || fileExtension === "md" || fileExtension === "csv") {
      const text = await file.text();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { text, wordCount };
    } 
    else {
      throw new Error(`Unsupported file format (.${fileExtension}). Please upload PDF, DOCX, TXT, or MD.`);
    }
  };

  const handleFiles = async (incomingFiles: File[]) => {
    const validTypes = ["pdf", "docx", "txt", "md", "csv"];
    const filteredFiles = incomingFiles.filter(file => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext && validTypes.includes(ext);
    });

    if (filteredFiles.length === 0) {
      alert("No supported files detected. Please upload PDF, DOCX, TXT, or MD files.");
      return;
    }

    setOverallStatus("processing");

    // Initialize files in list as 'parsing'
    const newUploadedFiles: UploadedFile[] = filteredFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.name.split(".").pop() || "",
      wordCount: 0,
      text: "",
      status: "parsing"
    }));

    setFiles(prev => [...prev, ...newUploadedFiles]);

    // Process each file
    for (let i = 0; i < filteredFiles.length; i++) {
      const fileObj = filteredFiles[i];
      try {
        const { text, wordCount } = await parseFile(fileObj);
        setFiles(prev => prev.map(f => f.name === fileObj.name ? {
          ...f,
          text,
          wordCount,
          status: "completed"
        } : f));
      } catch (err: any) {
        console.error(`Error parsing ${fileObj.name}:`, err);
        setFiles(prev => prev.map(f => f.name === fileObj.name ? {
          ...f,
          status: "error",
          errorMessage: err.message || "Failed to extract text."
        } : f));
      }
    }

    setOverallStatus("done");
  };

  const removeFile = (name: string) => {
    const updated = files.filter(f => f.name !== name);
    setFiles(updated);
    if (updated.length === 0) {
      setOverallStatus("idle");
      onReset();
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    const successfulFiles = files.filter(f => f.status === "completed");
    if (successfulFiles.length === 0) {
      alert("No files have been parsed successfully yet.");
      return;
    }

    const aggregatedText = successfulFiles.map(f => `File: ${f.name}\n---\n${f.text}\n---\n`).join("\n");
    const metaList = successfulFiles.map(f => ({ name: f.name, size: f.size }));
    onFilesProcessed(aggregatedText, metaList);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const completedCount = files.filter(f => f.status === "completed").length;
  const parsingCount = files.filter(f => f.status === "parsing").length;
  const errorCount = files.filter(f => f.status === "error").length;

  return (
    <div className="w-full">
      {/* Dropzone Area */}
      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? "border-violet-500 bg-violet-500/10 scale-[0.99]"
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerUpload}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          onChange={handleChange}
        />
        
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-all duration-300">
          <Upload className="h-6 w-6" />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold text-zinc-200">
          Drag & drop your course materials here
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Support PDF, DOCX, TXT, or MD syllabus, lecture slides, and rubrics
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-zinc-800/50 border border-zinc-800 text-zinc-400">
          <span>Max 15MB per file</span>
        </div>
      </div>

      {/* Uploaded Files Status List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Uploaded Files ({files.length})
            </h4>
            {parsingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                <Loader2 className="h-3 w-3 animate-spin" /> Parsing...
              </span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-800 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${
                    file.status === "completed" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : file.status === "error" 
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate pr-4">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span>{formatSize(file.size)}</span>
                      {file.status === "completed" && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400 font-mono">{file.wordCount.toLocaleString()} words</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === "parsing" && (
                    <Loader2 className="h-4 w-4 text-violet-500 animate-spin mr-2" />
                  )}
                  {file.status === "completed" && (
                    <Check className="h-4 w-4 text-emerald-400 mr-2" />
                  )}
                  {file.status === "error" && (
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-rose-400 cursor-help mr-2" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-900 border border-zinc-800 text-xs text-rose-400 rounded-lg p-2 shadow-xl z-20">
                        {file.errorMessage}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Button & Aggregated Summary */}
          {completedCount > 0 && parsingCount === 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Ready to generate with <span className="text-zinc-300 font-semibold">{completedCount}</span> parsed file(s)
                {errorCount > 0 && <span className="text-rose-400"> ({errorCount} failed)</span>}
              </div>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-md shadow-violet-600/15 hover:shadow-violet-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Confirm Materials
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
