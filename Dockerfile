# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY backend/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Set environment variable for Python path to include the current directory
ENV PYTHONPATH=/app

# Make port 8080 available to the world outside this container
# Cloud Run sets the PORT environment variable, which we handle in main.py
EXPOSE 8080

# Run main.py when the container launches
CMD ["python", "backend/main.py"]
