import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Code, Loader2 } from 'lucide-react';

interface ConversionResult {
  svg: string;
  originalFileName: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setConversionResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToSVG = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    
    try {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        if (imageData) {
          // Convert to SVG with embedded base64 image
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <image x="0" y="0" width="${img.width}" height="${img.height}" 
         xlink:href="${previewUrl}" />
</svg>`;

          setConversionResult({
            svg: svgContent,
            originalFileName: selectedFile.name
          });
        }
        
        setIsConverting(false);
      };
      
      img.src = previewUrl;
    } catch (error) {
      console.error('Conversion failed:', error);
      setIsConverting(false);
    }
  };

  const downloadSVG = () => {
    if (!conversionResult) return;

    const blob = new Blob([conversionResult.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversionResult.originalFileName.split('.')[0]}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySVGCode = () => {
    if (conversionResult) {
      navigator.clipboard.writeText(conversionResult.svg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ImageIcon className="w-12 h-12 text-indigo-600 mr-3" />
            <Code className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Image to SVG Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your images to SVG format with embedded base64 encoding. 
            Perfect for web development and scalable graphics.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-indigo-600" />
                Upload Image
              </h2>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-gray-600">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, GIF, WebP and more
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={convertToSVG}
                  disabled={isConverting}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Code className="w-5 h-5 mr-2" />
                      Convert to SVG
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Result Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Code className="w-6 h-6 mr-2 text-indigo-600" />
                SVG Result
              </h2>

              {conversionResult ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all">
                      {conversionResult.svg}
                    </pre>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={downloadSVG}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download SVG
                    </button>
                    
                    <button
                      onClick={copySVGCode}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Upload and convert an image to see the SVG code here</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Features
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Easy Upload</h4>
                <p className="text-gray-600 text-sm">
                  Drag and drop or click to upload images in various formats
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Clean SVG Code</h4>
                <p className="text-gray-600 text-sm">
                  Generate clean, optimized SVG code with embedded base64 images
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Instant Download</h4>
                <p className="text-gray-600 text-sm">
                  Download your SVG files instantly or copy the code to clipboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;