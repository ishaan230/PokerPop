# Stage 1: Build the React App
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the App with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom Nginx config to handle React routing and proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
