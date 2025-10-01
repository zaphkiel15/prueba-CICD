# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.19.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

ARG SESSION_SECRET
ARG PORT
ARG MONGO_URI
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME
ARG CLIENT_SECRET
ARG CLIENT_ID
ARG REDIRECT_URI
ARG TOKEN_PATH
ARG SCOPES
ARG CALENDAR_ID
ARG EMAIL_HOST
ARG EMAIL_PORT
ARG EMAIL_USER
ARG EMAIL_PASS
ARG RECAPTCHA_SECRET_KEY
ARG RECAPTCHA_SITE_KEY

ENV SESSION_SECRET=$SESSION_SECRET
ENV PORT=$PORT
ENV MONGO_URI=$MONGO_URI
ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_NAME=$DB_NAME
ENV CLIENT_SECRET=$CLIENT_SECRET
ENV CLIENT_ID=$CLIENT_ID
ENV REDIRECT_URI=$REDIRECT_URI
ENV TOKEN_PATH=$TOKEN_PATH
ENV SCOPES=$SCOPES
ENV CALENDAR_ID=$CALENDAR_ID
ENV EMAIL_HOST=$EMAIL_HOST
ENV EMAIL_PORT=$EMAIL_PORT
ENV EMAIL_USER=$EMAIL_USER
ENV EMAIL_PASS=$EMAIL_PASS
ENV RECAPTCHA_SECRET_KEY=$RECAPTCHA_SECRET_KEY
ENV RECAPTCHA_SITE_KEY=$RECAPTCHA_SITE_KEY

WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["node", "server.js"]
