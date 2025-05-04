FROM node:20

# Installing nodejs, curl and git
RUN apt-get update  
# Install curl , Download and run the Node.js setup script
RUN apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -  
RUN apt-get upgrade -y
RUN apt-get install -y nodejs  
RUN apt-get install git -y  

# set working directory
WORKDIR /home/app

COPY package.json  .
COPY package-lock.json .

RUN npm install

COPY . .

# enables users to run the script directly from the command line, we need to give it permission
RUN chmod +x main.sh
RUN chmod +x script.js

# Start your application
CMD ["/home/app/main.sh"]