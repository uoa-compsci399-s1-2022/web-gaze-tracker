# Peeper.js - webcam eye tracking
### An open-source Javascript library to enable the control of your mouse movements, through your computer's webcam, using only your eyes gaze.

## Project Management
In order to manage our project under scrum, we used [Jira](https://www.atlassian.com/software/jira). Our board can be found [here.](https://399team21.atlassian.net/ "Project Management tool")

## Project Description
An open-source gaze tracking library for the web with a focus on extendability of the code and a simple architecture.

## Technologies
Peeper.js is written completely in JavaScript for easy integration with websites. We also used the following libraries to aid in face tracking and image processing respectfully.

### [Faceapi.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
AI-powered Face Detection & Rotation Tracking, Face Description & Recognition, Age & Gender & Emotion Prediction for Browser and NodeJS using TensorFlow/JS

### [OpenCV](https://opencv.org/)
OpenCV (Open Source Computer Vision Library) is an open source computer vision and machine learning software library. OpenCV was built to provide a common infrastructure for computer vision applications and to accelerate the use of machine perception in commercial products

## Installation and Setup

### Depedencies (included)

- OpenCV 4.5.0
- Face-api 0.22.2
	- Tiny Face Detector
	- 68 Point Face Landmark Detection

Clone or download the repo and navigate to the "example" folder.

```shell
$ git clone https://github.com/uoa-compsci399-s1-2022/web-gaze-tracker.git
$ cd web-gaze-tracker/example
```

This folder contains the example HTML page, required modules/libraries, a peeper.js build file and a main.js file which calls relevant functions in the correct order. This folder is independent of the other files in the repo and can be moved to your desired location.

## Usage Examples
TBA

## [Website](https://uoa-compsci399-s1-2022.github.io/web-gaze-tracker/)
[Documentation](https://uoa-compsci399-s1-2022.github.io/web-gaze-tracker/documentation.html)

[Example](https://uoa-compsci399-s1-2022.github.io/web-gaze-tracker/example.html)

### What are some of the features you hope to implement in the future?
- More accurate calibration/mapping algorithm
- Image filtering via settings menu
- Custom calibration points (for easy customisation)

## Credits
Client: Dr. Gerald Weber

Lecturer and coordinator: Asma Shakil

Teaching Assistant: Anshul Jain

Team members:
- Amri Arshad
- Jacky Chen
- Kevin Ren
- Ricky Katafono
- Theresa Lan
- Vadim Reger

## License
GNU General Public License v3.0