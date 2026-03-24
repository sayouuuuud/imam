import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import DOMPurify from 'isomorphic-dompurify';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

// Custom DOMPurify hook to remove font-family from style attributes
DOMPurify.addHook('afterSanitizeAttributes', function(node) {
  if (node.hasAttribute('style')) {
    const style = node.getAttribute('style') || '';
    
    // Check if there is a font-family declaration
    if (/font-family\s*:/i.test(style)) {
      // Remove the font-family declaration
      const newStyle = style.replace(/font-family\s*:\s*[^;]+;?/gi, '');
      
      if (newStyle.trim() === '') {
        node.removeAttribute('style');
      } else {
        node.setAttribute('style', newStyle);
      }
    }
  }
});

async function stripFontsFromContent(tableName: string, contentColumn: string = 'content') {
  console.log(`Processing table: ${tableName}...`);
  
  // Fetch all rows
  const { data: rows, error: fetchError } = await supabase
    .from(tableName)
    .select(`id, ${contentColumn}`);
    
  if (fetchError) {
    console.error(`Error fetching from ${tableName}:`, fetchError);
    return;
  }
  
  if (!rows || rows.length === 0) {
    console.log(`No records found in ${tableName}`);
    return;
  }
  
  console.log(`Found ${rows.length} records. Analyzing...`);
  let updateCount = 0;
  
  for (const row of rows) {
    const originalContent = row[contentColumn];
    
    // Skip if empty
    if (!originalContent) continue;
    
    // Only process if it looks like there's an inline font
    if (typeof originalContent === 'string' && /font-family/i.test(originalContent)) {
      
      // We use our hooked DOMPurify to strip font families while leaving other styles
      // We need to keep all tags and attributes that were originally allowed
      const cleanContent = DOMPurify.sanitize(originalContent, {
        ADD_TAGS: ["iframe", "style"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
        WHOLE_DOCUMENT: true // Needed if the content contains <html>/<body> tags
      });
      
      // If content actually changed, update it
      if (cleanContent !== originalContent) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ [contentColumn]: cleanContent })
          .eq('id', row.id);
          
        if (updateError) {
          console.error(`Error updating row ${row.id} in ${tableName}:`, updateError);
        } else {
          updateCount++;
          console.log(`Updated row ${row.id}`);
        }
      }
    }
  }
  
  console.log(`Finished processing ${tableName}. Updated ${updateCount} records.\n`);
}

async function main() {
  console.log('--- Starting Font Cleanup Script ---');
  
  // Process the main content tables
  await stripFontsFromContent('sermons');
  await stripFontsFromContent('articles');
  
  console.log('--- Cleanup Finished ---');
}

main().catch(console.error);
