# Stage 1: Build the React Application
FROM node:20-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Define API URL for build process resolving to the Host's mapped port
ENV VITE_API_URL=http://localhost:8000
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginxinc/nginx-unprivileged:alpine

# Copy custom Nginx configuration to support React Router history
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React artifacts into Nginx HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

USER nginx
CMD ["nginx", "-g", "daemon off;"]
