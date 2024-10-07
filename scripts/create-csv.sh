#!/bin/bash

# Target file size (2GB in bytes)
target_size=$((2 * 1024 * 1024 * 1024))
buffer_size=$((1 * 1024 * 1024))  # 1MB buffer

# Output CSV file
file="largeFileShell.csv"

# CSV headers
echo "id,value,timestamp,description" > "$file"

# Function to generate random CSV data
generate_data() {
    local rows=""
    local size=0
    while [ "$size" -lt "$buffer_size" ]; do
        id=$(od -An -N4 -tx1 /dev/urandom | tr -d ' ')
        value=$(awk -v min=0 -v max=100000 'BEGIN{srand(); print min+rand()*(max-min)}')
        timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
        description="Randomly generated CSV row"
        
        row="$id,$value,$timestamp,$description"
        rows="${rows}${row}\n"
        size=$((size + ${#row} + 1))
    done
    echo -e "$rows"
}

# Use a file descriptor for appending
exec 3>>"$file"

total_size=$(stat --format="%s" "$file")

# Keep writing data until the file reaches the target size
while [ "$total_size" -lt "$target_size" ]; do
    buffer=$(generate_data)
    printf '%s' "$buffer" >&3
    total_size=$((total_size + ${#buffer}))
done

# Close the file descriptor
exec 3>&-

echo "File created with size: $total_size bytes"