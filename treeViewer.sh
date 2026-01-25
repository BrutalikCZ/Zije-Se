#!/bin/bash

# Function to traverse directories recursively and print the structure
traverse() {
    local directory="$1"
    local prefix="$2"

    # Enable nullglob so the loop does not run if the directory is empty
    shopt -s nullglob
    local children=("$directory"/*)
    shopt -u nullglob

    local count=${#children[@]}
    local i=0

    for child in "${children[@]}"; do
        ((i++))
        # Extract the base name of the file or directory
        local name="${child##*/}"

        # Determine the connector style based on whether it is the last item
        local connector=""
        local new_prefix=""

        if [ "$i" -eq "$count" ]; then
            connector="└── "
            new_prefix="${prefix}    "
        else
            connector="├── "
            new_prefix="${prefix}│   "
        fi

        # Print the current item
        echo "${prefix}${connector}${name}"

        # If it is a directory, call the function recursively
        if [ -d "$child" ]; then
            traverse "$child" "$new_prefix"
        fi
    done
}

# Use the current directory if no argument is provided
root_dir="${1:-.}"

# Check if the provided argument is a valid directory
if [ ! -d "$root_dir" ]; then
    echo "Error: Directory '$root_dir' not found."
    exit 1
fi

# Print the root directory and start traversal
echo "$root_dir"
traverse "$root_dir" ""
