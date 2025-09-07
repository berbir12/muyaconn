// Test script to check reviews table schema
import { supabase } from './lib/supabase.js';

async function testReviewsSchema() {
  try {
    console.log('🧪 Testing reviews table schema...');
    
    // First, try to get the table schema
    const { data: schema, error: schemaError } = await supabase
      .from('reviews')
      .select('*')
      .limit(0);
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      return;
    }
    
    console.log('✅ Reviews table exists and is accessible');
    
    // Try to insert a test review
    const testReview = {
      task_id: '00000000-0000-0000-0000-000000000000',
      reviewer_id: '00000000-0000-0000-0000-000000000000', 
      reviewee_id: '00000000-0000-0000-0000-000000000000',
      rating: 5,
      comment: 'Test review comment'
    };
    
    const { data, error } = await supabase
      .from('reviews')
      .insert(testReview)
      .select();
    
    if (error) {
      console.error('❌ Insert error:', error);
      console.error('Error details:', error.message);
    } else {
      console.log('✅ Test insert successful:', data);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testReviewsSchema();
