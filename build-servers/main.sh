#!/bin/bash

# getting the repository url from the environment variable
export repository_url="$repository_url"

# Clone the git repository to /home/app/output
git clone "$repository_url" /home/app/output

# Execute the script.js file
exec node script.js