import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system'

export class ImageUploadService {
  /**
   * Upload an image file to Supabase Storage
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
      // Generate unique filename if not provided
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = imageUri.split('.').pop() || 'jpg'
      const finalFileName = fileName || `${timestamp}_${randomId}.${fileExtension}`
      
      // Create the full path
      const filePath = `${folder}/${finalFileName}`

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Convert base64 to Uint8Array for React Native
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)

      // Upload to Supabase Storage using Uint8Array
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, byteArray, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        console.error('Error uploading image:', error)
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
