#!/bin/bash

# Target file size (2GB in bytes)
#target_size=$((2 * 1024 * 1024 * 1024))
target_size=$((2 * 1024 * 1024))
size=0

# Output CSV file
file="largeFile.csv"

# CSV headers
echo "id,value,timestamp,description" > "$file"

# Function to generate random CSV data
generate_data() {
    id=$(cat /dev/urandom | tr -cd 'a-f0-9' | head -c 8)
    value=$(awk -v min=0 -v max=100000 'BEGIN{srand(); print min+rand()*(max-min)}')
    timestamp=$(date --utc +%Y-%m-%dT%H:%M:%S.%3NZ)
    description="Randomly generated CSV row"
    
    # Return the generated CSV row
    echo "$id,$value,$timestamp,$description"
}

# Keep writing data until the file reaches 2GB
while [ "$size" -lt "$target_size" ]; do
    generate_data >> "$file"
    size=$(stat --format="%s" "$file") # Get the current file size
done

echo "File created with size: $size bytes"
