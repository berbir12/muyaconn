import { supabase } from '../lib/supabase'

export interface StorageBucket {
  name: string
  public: boolean
  allowedMimeTypes: string[]
  fileSizeLimit: number
  folder: string
}

export class StorageSetupService {
  /**
   * Default storage buckets configuration
   */
  private static readonly DEFAULT_BUCKETS: StorageBucket[] = [
    {
      name: 'tasker-documents',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
      fileSizeLimit: 5242880, // 5MB
      folder: 'applications'
    },
    {
      name: 'user-avatars',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 2097152, // 2MB
      folder: 'profiles'
    },
    {
      name: 'task_attachments',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
      folder: 'tasks'
    },
    {
      name: 'chat-images',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
      folder: 'attachments'
    },
    {
      name: 'chat-documents',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
      fileSizeLimit: 10485760, // 10MB
      folder: 'attachments'
    },
    {
      name: 'portfolio_images',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
      folder: 'portfolio'
    }
  ]

  /**
   * Initialize all required storage buckets
   */
  static async initializeStorage(): Promise<void> {
    try {
      console.log('Initializing storage buckets...')
      
      // Check if buckets exist instead of trying to create them
      const health = await this.checkStorageHealth()
      
      if (health.healthy) {
        console.log('All required storage buckets exist')
      } else {
        console.warn('Missing storage buckets:', health.missingBuckets)
        console.log('Please create the following buckets in your Supabase dashboard:')
        health.missingBuckets.forEach(bucketName => {
          const config = this.DEFAULT_BUCKETS.find(b => b.name === bucketName)
          if (config) {
            console.log(`- ${bucketName}: Public=${config.public}, MaxSize=${config.fileSizeLimit} bytes`)
          }
        })
      }
      
      console.log('Storage initialization completed')
    } catch (error) {
      console.error('Storage initialization failed:', error)
      // Don't throw error, just log it
    }
  }

  /**
   * Check if a specific bucket exists (client-side can't create buckets due to RLS)
   */
  private static async ensureBucketExists(bucketConfig: StorageBucket): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn(`Error listing buckets: ${listError.message}`)
        return false
      }

      const bucketExists = buckets?.some(bucket => bucket.name === bucketConfig.name)
      
      if (bucketExists) {
        console.log(`Bucket ${bucketConfig.name} exists`)
        return true
      } else {
        console.warn(`Bucket ${bucketConfig.name} does not exist`)
        return false
      }
    } catch (error) {
      console.error(`Error checking bucket ${bucketConfig.name}:`, error)
      return false
    }
  }

  /**
   * Check if all required buckets exist
   */
  static async checkStorageHealth(): Promise<{ healthy: boolean; missingBuckets: string[] }> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Error checking storage health:', error)
        return { healthy: false, missingBuckets: this.DEFAULT_BUCKETS.map(b => b.name) }
      }

      const existingBucketNames = buckets?.map(bucket => bucket.name) || []
      const requiredBucketNames = this.DEFAULT_BUCKETS.map(bucket => bucket.name)
      const missingBuckets = requiredBucketNames.filter(name => !existingBucketNames.includes(name))

      console.log('Storage health check:', {
        existing: existingBucketNames,
        required: requiredBucketNames,
        missing: missingBuckets
      })

      return {
        healthy: missingBuckets.length === 0,
        missingBuckets
      }
    } catch (error) {
      console.error('Error checking storage health:', error)
      return { healthy: false, missingBuckets: this.DEFAULT_BUCKETS.map(b => b.name) }
    }
  }

  /**
   * Get storage usage information
   */
  static async getStorageUsage(): Promise<{ [bucketName: string]: number }> {
    try {
      const usage: { [bucketName: string]: number } = {}
      
      for (const bucketConfig of this.DEFAULT_BUCKETS) {
        try {
          const { data: files, error } = await supabase.storage
            .from(bucketConfig.name)
            .list(bucketConfig.folder, { limit: 1000 })
          
          if (error) {
            console.warn(`Error getting files for bucket ${bucketConfig.name}:`, error)
            usage[bucketConfig.name] = 0
            continue
          }

          // Calculate total size (this is approximate as we don't have file sizes)
          usage[bucketConfig.name] = files?.length || 0
        } catch (error) {
          console.warn(`Error calculating usage for bucket ${bucketConfig.name}:`, error)
          usage[bucketConfig.name] = 0
        }
      }

      return usage
    } catch (error) {
      console.error('Error getting storage usage:', error)
      return {}
    }
  }

  /**
   * Clean up old files from storage
   */
  static async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      console.log(`Cleaning up files older than ${daysOld} days...`)

      for (const bucketConfig of this.DEFAULT_BUCKETS) {
        try {
          const { data: files, error } = await supabase.storage
            .from(bucketConfig.name)
            .list(bucketConfig.folder, { limit: 1000 })
          
          if (error) {
            console.warn(`Error listing files in bucket ${bucketConfig.name}:`, error)
            continue
          }

          if (!files) continue

          const filesToDelete = files.filter(file => {
            const fileDate = new Date(file.created_at)
            return fileDate < cutoffDate
          })

          if (filesToDelete.length > 0) {
            const filePaths = filesToDelete.map(file => `${bucketConfig.folder}/${file.name}`)
            
            const { error: deleteError } = await supabase.storage
              .from(bucketConfig.name)
              .remove(filePaths)

            if (deleteError) {
              console.warn(`Error deleting old files from bucket ${bucketConfig.name}:`, deleteError)
            } else {
              console.log(`Deleted ${filesToDelete.length} old files from bucket ${bucketConfig.name}`)
            }
          }
        } catch (error) {
          console.warn(`Error cleaning up bucket ${bucketConfig.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  /**
   * Test storage functionality
   */
  static async testStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      const testBucket = 'test-uploads'
      const testFileName = `test-${Date.now()}.txt`
      const testContent = 'This is a test file for storage functionality'

      // Create test bucket
      const { error: createError } = await supabase.storage.createBucket(testBucket, {
        public: true,
        allowedMimeTypes: ['text/plain'],
        fileSizeLimit: 1024
      })

      if (createError) {
        return { success: false, error: `Failed to create test bucket: ${createError.message}` }
      }

      // Upload test file
      const { error: uploadError } = await supabase.storage
        .from(testBucket)
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        })

      if (uploadError) {
        return { success: false, error: `Failed to upload test file: ${uploadError.message}` }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(testBucket)
        .getPublicUrl(testFileName)

      if (!publicUrlData?.publicUrl) {
        return { success: false, error: 'Failed to get public URL for test file' }
      }

      // Clean up test bucket
      await supabase.storage.from(testBucket).remove([testFileName])
      await supabase.storage.deleteBucket(testBucket)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
