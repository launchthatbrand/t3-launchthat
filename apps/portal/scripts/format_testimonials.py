#!/usr/bin/env python3
"""
Script to format WSA testimonials CSV with better line breaks, capitalization, and punctuation
while preserving the customer's original words as much as possible.
"""

import csv
import re
import sys
import os

def format_testimonial(text):
    """Format a testimonial with better line breaks and punctuation while preserving original content."""
    if not text or text.strip() == "":
        return text
    
    # Remove extra whitespace and normalize line breaks
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Split into sentences based on periods, exclamation marks, and question marks
    # but be careful not to split on abbreviations or decimal numbers
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    
    formatted_lines = []
    current_paragraph = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Add sentence to current paragraph
        current_paragraph.append(sentence)
        
        # Start new paragraph after certain phrases or when paragraph gets long
        paragraph_text = ' '.join(current_paragraph)
        should_break = (
            len(current_paragraph) >= 3 or  # 3 sentences per paragraph max
            len(paragraph_text) > 200 or    # Or when paragraph gets long
            any(phrase in sentence.lower() for phrase in [
                'before joining', 'before wsa', 'since joining', 'since wsa',
                'wall street academy has', 'wsa has', 'what wsa means',
                'thank you', 'thanks', 'grateful', 'appreciate',
                'the community', 'the way you', 'i learned', "i've learned"
            ])
        )
        
        if should_break and len(current_paragraph) > 1:
            formatted_lines.append(' '.join(current_paragraph))
            current_paragraph = []
    
    # Add any remaining sentences
    if current_paragraph:
        formatted_lines.append(' '.join(current_paragraph))
    
    # Join paragraphs with double line breaks
    return '\n\n'.join(formatted_lines)

def process_csv(input_file, output_file):
    """Process the CSV file and format testimonials."""
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            
            with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
                fieldnames = reader.fieldnames
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in reader:
                    # Format the processed testimonial
                    if 'Processed Testimonial' in row:
                        original = row['Processed Testimonial']
                        formatted = format_testimonial(original)
                        row['Processed Testimonial'] = formatted
                    
                    writer.writerow(row)
                    
        print(f"Successfully formatted testimonials from {input_file} to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file {input_file}")
        return False
    except Exception as e:
        print(f"Error processing file: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Input and output file paths
    input_file = os.path.join(script_dir, '../docs/WSA _ Testimonials - Sheet1.csv')
    output_file = os.path.join(script_dir, '../docs/WSA_Testimonials_Formatted.csv')
    
    # Process the CSV
    success = process_csv(input_file, output_file)
    
    if success:
        print("Testimonial formatting completed successfully!")
    else:
        sys.exit(1) 