import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Settings, Zap, FileImage } from 'lucide-react';
import * as ImageTracer from 'imagetracer';

interface ConversionSettings {
  method: 'embed' | 'trace' | 'code';
  pathomit: number;
  colorsampling: number;
  numberofcolors: number;
  mincolorratio: number;
  colorquantcycles: number;
  blurradius: number;
  blurdelta: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [svgResult, setSvgResult] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    method: 'code',
    pathomit: 8,
    colorsampling: 1,
    numberofcolors: 16,
    mincolorratio: 0.02,
    colorquantcycles: 3,
    blurradius: 0,
    blurdelta: 20
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSvgResult('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const convertToSVG = async () => {
    if (!selectedFile || !canvasRef.current) return;
    
    setIsConverting(true);
    
    try {
      if (settings.method === 'code') {
        // Generate clean SVG code
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <image href="data:image/${selectedFile.type.split('/')[1]};base64,${(e.target?.result as string).split(',')[1]}" width="${img.width}" height="${img.height}"/>
</svg>`;
            setSvgResult(svgContent);
            setIsConverting(false);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
      } else if (settings.method === 'embed') {
        // Simple SVG embedding
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.width}" height="${img.height}">
  <image href="${e.target?.result}" width="${img.width}" height="${img.height}"/>
</svg>`;
            setSvgResult(svgContent);
            setIsConverting(false);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // Auto-trace conversion
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const options = {
            pathomit: settings.pathomit,
            colorsampling: settings.colorsampling,
            numberofcolors: settings.numberofcolors,
            mincolorratio: settings.mincolorratio,
            colorquantcycles: settings.colorquantcycles,
            blurradius: settings.blurradius,
            blurdelta: settings.blurdelta
          };
          
          const svgContent = ImageTracer.imagedataToSVG(imageData, options);
          setSvgResult(svgContent);
          setIsConverting(false);
        };
        img.src = previewUrl;
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setIsConverting(false);
    }
  };

  const downloadSVG = () => {
    if (!svgResult) return;
    
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name?.split('.')[0] || 'converted'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <FileImage className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Image to SVG Converter
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform your raster images into scalable vector graphics with advanced tracing algorithms
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                Upload Image
              </h2>
              
              <div 
                className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-white transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Drop your image here or click to browse</p>
                <p className="text-sm text-gray-500">Supports PNG, JPG, GIF, WebP</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <p className="text-sm text-green-400">
                    <strong>Selected:</strong> {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-500">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Settings */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  Conversion Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Conversion Method
                    </label>
                    <select
                      value={settings.method}
                      onChange={(e) => setSettings(prev => ({ ...prev, method: e.target.value as 'embed' | 'trace' | 'code' }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                    >
                      <option value="code">SVG Code</option>
                      <option value="trace">Auto Trace (Vector)</option>
                      <option value="embed">Embed (Wrapped)</option>
                    </select>
                  </div>

                  {settings.method === 'trace' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Colors: {settings.numberofcolors}
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="64"
                          value={settings.numberofcolors}
                          onChange={(e) => setSettings(prev => ({ ...prev, numberofcolors: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Path Detail: {settings.pathomit}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={settings.pathomit}
                          onChange={(e) => setSettings(prev => ({ ...prev, pathomit: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Blur Radius: {settings.blurradius}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={settings.blurradius}
                          onChange={(e) => setSettings(prev => ({ ...prev, blurradius: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={convertToSVG}
                  disabled={!selectedFile || isConverting}
                  className="w-full mt-6 bg-white text-black py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isConverting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isConverting ? 'Converting...' : 'Convert to SVG'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Preview & Results</h2>
                {svgResult && (
                  <button
                    onClick={downloadSVG}
                    className="bg-white text-black py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download SVG
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Original Image */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-300 mb-3">Original Image</h3>
                  <div className="flex-1 bg-gray-800 rounded-lg flex items-center justify-center p-4 min-h-64 max-h-96 overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p>Upload an image to preview</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SVG Result */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-300 mb-3">SVG Output</h3>
                  <div className="flex-1 bg-gray-800 rounded-lg flex items-center justify-center p-4 min-h-64 max-h-96 overflow-hidden">
                    {svgResult ? (
                      <div
                        className="max-w-full max-h-full overflow-hidden flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: svgResult }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FileImage className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p>SVG will appear here after conversion</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SVG Code */}
              {svgResult && (
                <div className="mt-6 flex-shrink-0">
                  <h3 className="text-lg font-medium text-gray-300 mb-3">SVG Code</h3>
                  <textarea
                    value={svgResult}
                    readOnly
                    className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm resize-none text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Image Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default App;