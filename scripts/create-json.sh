#!/bin/bash

# Output file
file="largeFile.ndjson"

# 2GB in bytes
#target_size=$((2 * 1024 * 1024 * 1024))
target_size=$((2 * 1024 * 1024))
size=0

# Generate a single line of sample data
sample_data='{"id": "abc123", "value": 12345.67, "timestamp": "2024-09-19T10:00:00Z"}'

# Truncate the file if it already exists
> "$file"

# Write to the file until it reaches 2GB
while [ "$size" -lt "$target_size" ]; do
    echo "$sample_data" >> "$file"
    size=$(stat --printf="%s" "$file")
done

echo "File created with size: $size bytes"
