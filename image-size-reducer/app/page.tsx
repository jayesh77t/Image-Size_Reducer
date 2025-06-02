"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Upload, Download, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"

interface ImageData {
  file: File
  preview: string
  name: string
  size: number
  compressedBlob?: Blob
  compressedSize?: number
}

export default function ImageSizeReducer() {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [quality, setQuality] = useState([80])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file)
      setImageData({
        file,
        preview,
        name: file.name,
        size: file.size,
      })
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const compressImage = async () => {
    if (!imageData) return

    setIsProcessing(true)

    try {
      // Create a canvas to compress the image
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new window.Image()

      img.onload = () => {
        // Set canvas dimensions to original image dimensions
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0)

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setImageData((prev) =>
                prev
                  ? {
                      ...prev,
                      compressedBlob: blob,
                      compressedSize: blob.size,
                    }
                  : null,
              )
            }
            setIsProcessing(false)
          },
          "image/jpeg",
          quality[0] / 100,
        )
      }

      img.crossOrigin = "anonymous"
      img.src = imageData.preview
    } catch (error) {
      console.error("Error compressing image:", error)
      setIsProcessing(false)
    }
  }

  const downloadCompressedImage = () => {
    if (!imageData?.compressedBlob) return

    const url = URL.createObjectURL(imageData.compressedBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `compressed_${imageData.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    if (imageData?.preview) {
      URL.revokeObjectURL(imageData.preview)
    }
    setImageData(null)
    setQuality([80])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ImageIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Size Reducer</h1>
          <p className="text-gray-600">Compress your images while maintaining quality</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            {!imageData ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <Upload className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-1">Select or Drag & Drop Image</p>
                    <p className="text-sm text-gray-500">Supports JPG, PNG, WebP formats</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Image Preview */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                      <Image
                        src={imageData.preview || "/placeholder.svg"}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{imageData.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Original size: {formatFileSize(imageData.size)}</p>
                      {imageData.compressedSize && (
                        <p className="text-sm text-green-600 mt-1">
                          Compressed size: {formatFileSize(imageData.compressedSize)}
                          <span className="ml-2 text-xs">
                            ({Math.round((1 - imageData.compressedSize / imageData.size) * 100)}% reduction)
                          </span>
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetTool} className="text-gray-500 hover:text-gray-700">
                      ×
                    </Button>
                  </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Image Quality</label>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{quality[0]}%</span>
                  </div>
                  <Slider value={quality} onValueChange={setQuality} max={100} min={1} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Lower quality (smaller file)</span>
                    <span>Higher quality (larger file)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={compressImage}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProcessing ? "Processing..." : "Reduce Size"}
                  </Button>

                  {imageData.compressedBlob && (
                    <Button
                      onClick={downloadCompressedImage}
                      variant="outline"
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">Your images are processed locally in your browser for privacy</p>
        </div>
      </div>
    </div>
  )
}
