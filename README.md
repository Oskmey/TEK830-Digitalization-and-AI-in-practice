# Simplified Img2Img Interface with Diffusion Models
![PÅHITTIG](https://github.com/user-attachments/assets/977b859d-74a0-470b-afb1-18fc1cd5ea5f)



This project was developed for the TEK830 Digitalization and AI in Practice course. It provides a simplified interface for image-to-image (img2img) generation using diffusion models.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview

The aim of this project is to make img2img generation accessible and easy to use. By leveraging diffusion models, users can transform input images into new, AI-generated images through a simple and intuitive interface.

## Features

- **User-Friendly Interface**: Simplified frontend for easy navigation and use.
- **Image Upload and Generation**: Upload images and generate new ones using diffusion models.
- **Real-Time Processing**: Quick image transformation with minimal delay.
- **Customizable Parameters**: Adjust settings to refine image generation results.

## Technologies Used

- **Frontend**: Svelte
- **Backend**: Flask
- **Machine Learning**: Diffusion models for image generation

## Getting Started

### Prerequisites

- Python 3.7 or higher
- Node.js and npm
- Virtual Environment tool (optional but recommended)

### Installation

#### Backend Setup

1. **Clone the Repository**

        ```bash
        git clone *http link*
        cd yourproject/backend
        ```

2. **Create a Virtual Environment**

        ```bash
        python3 -m venv venv
        source venv/bin/activate  # On Windows: venv\Scripts\activate
        ```

3. **Install Backend Dependencies**

        ```bash
        pip install -r requirements.txt
        ```

#### Frontend Setup

1. **Navigate to the Frontend Directory**

        ```bash
        cd ../frontend
        ```

2. **Install Frontend Dependencies**

        ```bash
        npm install
        ```

## Usage

### Running the Backend Server

1. **Start the Flask Server**

        ```bash
        cd backend
        flask run
        ```

### Running the Frontend Application

1. **Start the Svelte Development Server**

        ```bash
        cd frontend
        npm run dev
        ```

### Accessing the Application

Open your web browser and navigate to [http://localhost:5000](http://localhost:5000) to use the application.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Developed as a part of the TEK830 Digitalization and AI in Practice course.
- Thanks to the open-source community for the tools and frameworks used in this project.
