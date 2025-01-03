import { useState, useRef } from "react";
import "./App.css";
import { v4 as uuid } from "uuid"; // Importing uuid for unique ID generation

function App() {
  const [image, setImage] = useState(null); // Initial state for selected or captured image
  const [uploadResultMessage, setUploadResultMessage] = useState(
    "Please upload or capture an image to authenticate."
  );
  const [visitorName, setVisitorName] = useState(""); // Holds the visitor's name or image URL
  const [isAuth, setAuth] = useState(false); // Authentication state
  const videoRef = useRef(null); // Video feed reference
  const canvasRef = useRef(null); // Canvas for capturing image

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((err) => {
        console.error("Error accessing the camera:", err);
        setUploadResultMessage(
          "Unable to access camera. Please check device permissions."
        );
      });
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedImage = new File([blob], `${uuid()}.jpeg`, {
            type: "image/jpeg",
          });
          setImage(capturedImage); // Set the captured image
          setUploadResultMessage(
            'Photo captured successfully. Click "Authenticate" to proceed.'
          );
        } else {
          setUploadResultMessage("Failed to capture photo. Please try again.");
        }
        stopCamera(); // Stop camera automatically after capturing
      },
      "image/jpeg",
      0.9
    );
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const sendImage = async (e) => {
    e.preventDefault();

    if (!image) {
      setUploadResultMessage(
        "No image selected. Please capture or upload an image to authenticate."
      );
      return;
    }

    const visitorImageName = uuid(); // Generate a unique key
    const objectKey = `${visitorImageName}.jpeg`;
    setVisitorName(objectKey); // Save the key for debugging or future use

    try {
      const uploadResponse = await fetch(
        `https://97wjwgc1p8.execute-api.us-east-1.amazonaws.com/dev/s3-vistor-pics/${objectKey}?acl=public-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": image.type || "image/jpeg",
          },
          body: image,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed. Please check your S3 configuration.");
      }

      const authResponse = await authenticate(objectKey);

      if (authResponse.message === "Success") {
        setAuth(true);
        setUploadResultMessage(
          `Hi ${authResponse.firstName} ${authResponse.lastName}, Welcome to work. Hope you have a great day.`
        );
        setVisitorName(authResponse.signedUrl); // Display authenticated image
      } else if (authResponse.message === "Person Not Found") {
        setAuth(false);
        setUploadResultMessage(
          "Authentication Failed: This person is not an employee."
        );
        setVisitorName(authResponse.signedUrl); // Display uploaded image
      } else {
        setAuth(false);
        setUploadResultMessage("Unknown error occurred during authentication.");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      setAuth(false);
      setUploadResultMessage(
        "There was an error during the authentication process. Please try again."
      );
    }
  };

  const authenticate = async (objectKey) => {
    const requestUrl = `https://97wjwgc1p8.execute-api.us-east-1.amazonaws.com/dev/employee?objectKey=${objectKey}`;
    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Error response body:", errorBody);
        return errorBody;
      }

      const data = await response.json();
      console.log("Successful response data:", data);
      return data;
    } catch (error) {
      console.error("Error during fetch:", error);
      throw new Error("Error during authentication process.");
    }
  };

  return (
    <div className="App">
      <h2>Ikechukwu's Facial Recognition System</h2>

      {/* Camera Section */}
      <div>
        <video ref={videoRef} style={{ width: "100%", maxHeight: "300px" }} />
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width="640"
          height="480"
        ></canvas>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={capturePhoto}>Capture Photo</button>
        <button onClick={stopCamera}>Stop Camera</button>
      </div>

      {/* Upload Section */}
      <form onSubmit={sendImage}>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">Authenticate</button>
      </form>

      <div className={isAuth ? "success" : "failure"}>{uploadResultMessage}</div>
      {/* Dynamically display visitor image */}
      <img
        src={
          visitorName
            ? visitorName // Use S3 URL if available
            : require("./visitors/placeholder.jpeg") // Placeholder image
        }
        alt="Visitor"
        height={250}
        width={250}
      />
    </div>
  );
}

export default App;
