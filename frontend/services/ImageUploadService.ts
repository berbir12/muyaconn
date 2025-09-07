import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system'
import { Image } from 'react-native'

export class ImageUploadService {
  // Cache for processed images to avoid re-processing
  private static imageCache = new Map<string, string>()

  /**
   * Get optimized image dimensions for better performance
   */
  static async getOptimizedImageSize(uri: string, maxWidth: number = 800, maxHeight: number = 600): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      Image.getSize(uri, (width, height) => {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        resolve({
          width: ratio < 1 ? width * ratio : width,
          height: ratio < 1 ? height * ratio : height
        })
      }, () => {
        // Fallback if image size can't be determined
        resolve({ width: maxWidth, height: maxHeight })
      })
    })
  }

  /**
   * Upload an image file to Supabase Storage with optimization
   * @param imageUri - Local file URI from ImagePicker
   * @param bucket - Storage bucket name
   * @param folder - Folder path within the bucket
   * @param fileName - Custom file name (optional)
   * @returns Public URL of the uploaded image
   */
  static async uploadImage(
    imageUri: string, 
    bucket: string = 'tasker-documents',
    folder: string = 'applications',
    fileName?: string
  ): Promise<string> {
    try {
      // Get current user ID for folder structure
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Skip bucket existence check due to RLS permissions
      // Try upload directly - if bucket doesn't exist, we'll get a clear error
      console.log(`Attempting upload to bucket: ${bucket}`)

      // Generate unique filename if not provided
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = imageUri.split('.').pop() || 'jpg'
      const finalFileName = fileName || `${user.id}_${timestamp}_${randomId}.${fileExtension}`
      
      // Create the full path - use user ID as folder
      const filePath = `${user.id}/${finalFileName}`

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Convert base64 to Uint8Array
      const byteCharacters = this.base64ToUint8Array(base64)
      
      // Determine content type based on file extension
      const contentType = this.getContentType(fileExtension)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, byteCharacters, {
          contentType,
          upsert: false,
          cacheControl: '3600'
        })

      if (error) {
        console.error('Error uploading image:', error)
        if (error.message.includes('bucket')) {
          throw new Error(`Storage bucket '${bucket}' may not exist or you don't have permission to access it. Please check your Supabase dashboard.`)
        }
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      console.log('Image uploaded successfully:', publicUrlData.publicUrl)
      return publicUrlData.publicUrl

    } catch (error: any) {
      console.error('Image upload error:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  }

  /**
   * Convert base64 string to Uint8Array (React Native compatible)
   */
  private static base64ToUint8Array(base64: string): Uint8Array {
    // React Native compatible base64 decoder
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0
    
    // Remove padding
    base64 = base64.replace(/[^A-Za-z0-9+/]/g, '')
    
    while (i < base64.length) {
      const encoded1 = chars.indexOf(base64.charAt(i++))
      const encoded2 = chars.indexOf(base64.charAt(i++))
      const encoded3 = chars.indexOf(base64.charAt(i++))
      const encoded4 = chars.indexOf(base64.charAt(i++))
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4
      
      result += String.fromCharCode((bitmap >> 16) & 255)
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255)
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255)
    }
    
    const bytes = new Uint8Array(result.length)
    for (let i = 0; i < result.length; i++) {
      bytes[i] = result.charCodeAt(i)
    }
    return bytes
  }

  /**
   * Get content type based on file extension
   */
  private static getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    }
    return contentTypes[extension.toLowerCase()] || 'image/jpeg'
  }

  /**
   * Check if storage bucket exists (client-side can't create due to RLS)
   */
  private static async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Error listing buckets:', listError)
        return false
      }

      // Debug: Log all available buckets
      console.log('Available buckets:', buckets?.map(b => b.name) || [])
      console.log('Looking for bucket:', bucketName)

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
      
      if (bucketExists) {
        console.log(`Bucket ${bucketName} exists`)
        return true
      } else {
        console.warn(`Bucket ${bucketName} does not exist. Available buckets:`, buckets?.map(b => b.name) || [])
        return false
      }
    } catch (error) {
      console.error('Error checking bucket exists:', error)
      return false
    }
  }

  /**
   * Alternative upload method using fetch (more reliable for large files)
   * @param imageUri - Local file URI from ImagePicker
   * @param bucket - Storage bucket name
   * @param folder - Folder path within the bucket
   * @param fileName - Custom file name (optional)
   * @returns Public URL of the uploaded image
   */
  static async uploadImageWithFetch(
    imageUri: string,
    bucket: string = 'tasker-documents',
    folder: string = 'applications',
    fileName?: string
  ): Promise<string> {
    try {
      // Get current user ID for folder structure
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Skip bucket existence check due to RLS permissions
      // Try upload directly - if bucket doesn't exist, we'll get a clear error
      console.log(`Attempting upload to bucket: ${bucket}`)

      // Generate unique filename if not provided
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = imageUri.split('.').pop() || 'jpg'
      const finalFileName = fileName || `${user.id}_${timestamp}_${randomId}.${fileExtension}`
      
      // Create the full path - use user ID as folder
      const filePath = `${user.id}/${finalFileName}`

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      // Read file as blob
      const response = await fetch(imageUri)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false,
          cacheControl: '3600'
        })

      if (error) {
        console.error('Error uploading image:', error)
        if (error.message.includes('bucket')) {
          throw new Error(`Storage bucket '${bucket}' may not exist or you don't have permission to access it. Please check your Supabase dashboard.`)
        }
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      console.log('Image uploaded successfully:', publicUrlData.publicUrl)
      return publicUrlData.publicUrl

    } catch (error: any) {
      console.error('Image upload error:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  }

  /**
   * Upload multiple images and return their public URLs
   * @param imageUris - Array of local file URIs
   * @param bucket - Storage bucket name
   * @param folder - Folder path within the bucket
   * @returns Array of public URLs
   */
  static async uploadMultipleImages(
    imageUris: string[],
    bucket: string = 'tasker-documents',
    folder: string = 'applications'
  ): Promise<string[]> {
    try {
      const uploadPromises = imageUris.map((uri, index) => 
        this.uploadImage(uri, bucket, folder, `certification_${index + 1}`)
      )

      const publicUrls = await Promise.all(uploadPromises)
      return publicUrls

    } catch (error: any) {
      console.error('Multiple image upload error:', error)
      throw new Error(`Multiple image upload failed: ${error.message}`)
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - Public URL of the image to delete
   * @param bucket - Storage bucket name
   */
  static async deleteImage(imageUrl: string, bucket: string = 'tasker-documents'): Promise<void> {
    try {
      // Extract file path from public URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/')

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Error deleting image:', error)
        throw new Error(`Failed to delete image: ${error.message}`)
      }

      console.log('Image deleted successfully:', filePath)
    } catch (error: any) {
      console.error('Image deletion error:', error)
      throw new Error(`Image deletion failed: ${error.message}`)
    }
  }

  /**
   * Check if a URL is a local file URI
   * @param url - URL to check
   * @returns true if it's a local file URI
   */
  static isLocalFileUri(url: string): boolean {
    return url.startsWith('file://') || url.startsWith('content://')
  }

  /**
   * Get a placeholder image URL for display purposes
   * @param type - Type of placeholder (id_front, id_back, certification)
   * @returns Placeholder image URL
   */
  static getPlaceholderUrl(type: 'id_front' | 'id_back' | 'certification'): string {
    const baseUrl = 'https://via.placeholder.com/400x300/cccccc/666666?text='
    const text = type === 'id_front' ? 'FRONT+ID' : 
                 type === 'id_back' ? 'BACK+ID' : 'CERTIFICATION'
    return `${baseUrl}${text}`
  }
}
