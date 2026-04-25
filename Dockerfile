# Stage 1: Build the Quasar application
FROM node:22-alpine as build-stage

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies without running scripts (like postinstall)
RUN npm install --ignore-scripts

# Copy the rest of the application code
COPY . .

# Now that all files are here, build the Quasar application.
# Use 'npm run build' to ensure Quasar CLI is found via node_modules/.bin
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine as production-stage

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application from the build-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
