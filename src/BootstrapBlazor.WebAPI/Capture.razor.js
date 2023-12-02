﻿export async function Capture(instance, element, options, command) {

    let width = 640;
    let height = 0;
    let streaming = false;

    let log = null;
    let video = null;
    let canvas = null;
    let photo = null;
    let startbutton = null;
    let sendTimer = null;
    let sourceSelect = null;
    let sourceSelectPanel = null;
    let selectedDeviceId = null;
    let quality = 0.8;

    if (options.quality) {
        quality = options.quality;
    }

    if (command == 'Start') {
        startup();
    }
    if (command == 'Destroy') {
        destroy();
        return;
    }

    function showViewLiveResultButton() {
        if (window.self !== window.top) {
            element.querySelector(".contentarea").remove();
            const button = document.createElement("button");
            button.textContent = "View live result of the example code above";
            document.body.append(button);
            button.addEventListener("click", () => window.open(location.href));
            return true;
        }
        return false;
    }

    function startup() {
        if (showViewLiveResultButton()) {
            return;
        }

        log = element.querySelector("[data-action=log]");
        video = element.querySelector("[data-action=video]");
        canvas = element.querySelector("[data-action=canvas]");
        photo = element.querySelector("[data-action=photo]");
        startbutton = element.querySelector("[data-action=startbutton]");
        sourceSelect = element.querySelector("[data-action=sourceSelect]");
        sourceSelectPanel = element.querySelector("[data-action=sourceSelectPanel]");

        destroy();

        if (!options.camera && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices
                .getDisplayMedia({ video: true, audio: false })
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                })
                .catch((err) => {
                    console.error(`An error occurred: ${err}`);
                    instance.invokeMethodAsync('GetError', `An error occurred: ${err}`);
                });

        } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            if (!navigator.mediaDevices?.enumerateDevices) {
                console.log("enumerateDevices() not supported.");
            } else {
                if (!options.width) options.width = 640;
                if (!options.height) options.height = 480;
                width = options.width;
                console.log(`Set: ${selectedDeviceId} video ${options.width} x ${options.height}`);
                var constraints = {
                    video: {
                        width: { ideal: options.width },
                        height: { ideal: options.height },
                        facingMode: "environment",
                        focusMode: "continuous",
                    }, audio: false
                };

                if (selectedDeviceId != null || options.deviceID != null) {
                    let deviceId = selectedDeviceId;
                    if (deviceId == null) deviceId = options.deviceID;
                    constraints = {
                        video: {
                            deviceId: deviceId ? { exact: deviceId } : undefined,
                            width: { ideal: options.width },
                            height: { ideal: options.height },
                            facingMode: "environment",
                            focusMode: "continuous",
                        },
                        audio: false
                    }
                    console.log(constraints.video.deviceId);
                }
                navigator.mediaDevices
                    .getUserMedia(constraints)
                    .then((stream) => {

                        try {
                            video.srcObject = null;
                        }
                        catch (err) {
                            video.src = '';
                        }
                        if (video) {
                            video.removeAttribute('src');
                        }

                        video.srcObject = stream;
                        video.play();

                        if (selectedDeviceId == null) {
                            navigator.mediaDevices.enumerateDevices()
                                .then((devices) => {
                                    let videoInputDevices = [];
                                    devices.forEach((device) => {
                                        if (device.kind === 'videoinput') {
                                            videoInputDevices.push(device);
                                        }
                                    });
                                    if (options.deviceID != null) {
                                        selectedDeviceId = options.deviceID
                                    } else if (videoInputDevices.length > 1) {
                                        selectedDeviceId = videoInputDevices[1].deviceId
                                    } else {
                                        selectedDeviceId = videoInputDevices[0].deviceId
                                    }
                                    devices.forEach((device) => {
                                        if (device.kind === 'videoinput') {
                                            if (options.debug) console.log(`${device.label} id = ${device.deviceId}`);
                                            const sourceOption = document.createElement('option');
                                            if (device.label === '') {
                                                sourceOption.text = 'Camera' + (sourceSelect.length + 1);
                                            } else {
                                                sourceOption.text = device.label
                                            }
                                            sourceOption.value = device.deviceId
                                            if (options.deviceID != null && device.deviceId == options.deviceID)
                                            {
                                                sourceOption.selected = true;
                                            } 
                                            sourceSelect.appendChild(sourceOption)
                                        }
                                    });

                                    sourceSelect.onchange = () => {
                                        selectedDeviceId = sourceSelect.value;
                                        if (options.debug) console.log(`selectedDevice: ${sourceSelect.options[sourceSelect.selectedIndex].text} id = ${sourceSelect.value}`);
                                        instance.invokeMethodAsync('SelectDeviceID', selectedDeviceId);
                                        startup();
                                    }

                                    sourceSelectPanel.style.display = 'block'

                                })
                                .catch((err) => {
                                    console.error(`${err.name}: ${err.message}`);
                                });
                        }
                    })
                    .catch((err) => {
                        console.error(`An error occurred: ${err}`);
                        instance.invokeMethodAsync('GetError', `An error occurred: ${err}`);
                    });

            }


        } else {
            alert('不支持这个特性');
        }


        video.removeEventListener('canplay', videoCanPlayListener);

        video.addEventListener("canplay", videoCanPlayListener, false);

        startbutton.removeEventListener('canplay', videoCanPlayListener);

        startbutton.addEventListener("click", takepictureListener, false);

        clearphoto();

        if (options.continuous) {
            takepicture();
            sendTimer = window.setInterval(async () => {
                takepicture();
            }, 5000)
        }

    }
    function takepictureListener(ev) {
        takepicture();
        ev.preventDefault();
    }

    function videoCanPlayListener() {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);

            if (isNaN(height)) {
                height = width / (4 / 3);
            }

            video.setAttribute("width", width);
            video.setAttribute("height", height);
            canvas.setAttribute("width", width);
            canvas.setAttribute("height", height);
            streaming = true;
            //if (options.debug)
            console.log(`play DeviceId: ${selectedDeviceId} video ${video.videoWidth} x ${video.videoHeight}`);
        }

    }

    function clearphoto() {
        const context = canvas.getContext("2d");
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const data = canvas.toDataURL("image/png");
        if (photo) photo.setAttribute("src", data);

        if (options.continuous) {
            const data2 = canvas.toDataURL("image/jpeg", quality);
            instance.invokeMethodAsync('GetCaptureResult', data2);
        }
    }

    function takepicture() {
        const context = canvas.getContext("2d");
        if (width && height) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);

            console.log(`take: ${video.videoWidth} x ${video.videoHeight}`);
            const data = canvas.toDataURL("image/jpeg", quality);
            if (photo) photo.setAttribute("src", data);
            instance.invokeMethodAsync('GetCaptureResult', data);
        } else {
            clearphoto();
        }
    }

    function destroy() {
        video = element.querySelector("[data-action=video]");
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log(track.label + ' stop');
            });
        }
    }
    return true;
}
