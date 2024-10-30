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

The goal of this project is to make img2img generation both accessible and user-friendly. By utilizing diffusion models, users can effortlessly transform their input images into new, AI-generated visuals through a simple and intuitive interface. Additionally, the AI can change product backgrounds, allowing them to be easily placed in different environments.

## Features

- **User-Friendly Interface**: Simplified frontend for easy navigation and use.
- **Image Upload and Generation**: Upload images and generate new ones using diffusion models.
- **Real-Time Processing**: image transformation.
- **Customizable Parameters**: Adjust settings to refine image generation results.
- **Customizable backgrounds**: Adjust/change backgrounds of images easily.
- **Operates on an intranet**: Configure settings to fine-tune image generation results.
## Technologies Used

- **Frontend**: Svelte 4
- **Backend**: Flask
- **Machine Learning**: Diffusion models for image generation
- **Semantic segmentation with PyTorch**: [Generate masks for objects easliy](https://github.com/milesial/Pytorch-UNet)
- **Controlnet units**: [Generate depth maps](https://github.com/lllyasviel/ControlNet)
- **webui api**: [API client for AUTOMATIC1111/stable-diffusion-webui](https://github.com/mix1009/sdwebuiapi)

## Getting Started

### Prerequisites

- Python 3.7 or higher
- Node.js and npm
- Virtual Environment tool (optional but recommended)

### Installation

#### Backend Setup

1. **Clone the Repository**

        ```bash
        git clone https://github.com/Oskmey/TEK830-Digitalization-and-AI-in-practice.git
        cd TEK830-Digitalization-and-AI-in-practice

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
        cd ../Flaskserver
        ```

2. **Install Frontend Dependencies**

        ```bash
        npm install
        ```

## Usage

### Running

1. **Start the Flask Server inside of Flaskserver**

        ```bash
        npm run
   
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
