import { useState, useRef } from "react";
import "./App.css";
import { v4 as uuid } from "uuid";

function App() {
  const [image, setImage] = useState(null);
  const [uploadResultMessage, setUploadResultMessage] = useState(
    "Please upload or capture an image to authenticate."
  );
  const [visitorName, setVisitorName] = useState("");
  const [isAuth, setAuth] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
          setImage(capturedImage);
          setUploadResultMessage(
            'Photo captured successfully. Click "Authenticate" to proceed.'
          );
        } else {
          setUploadResultMessage("Failed to capture photo. Please try again.");
        }
        stopCamera();
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

    const visitorImageName = uuid();
    const objectKey = `${visitorImageName}.jpeg`;
    setVisitorName(objectKey);

    try {
      const uploadResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_S3_UPLOAD_PATH}${objectKey}?acl=public-read`,
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
          `Hi ${authResponse.firstName} ${authResponse.lastName}, Welcome to work.`
        );
        setVisitorName(authResponse.signedUrl);
      } else if (authResponse.message === "Person Not Found") {
        setAuth(false);
        setUploadResultMessage(
          "Authentication Failed: This person is not an employee."
        );
        setVisitorName(authResponse.signedUrl);
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
    const requestUrl = `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_EMPLOYEE_AUTH_PATH}?objectKey=${objectKey}`;
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
      <h2
        style={{
          fontFamily: "Arial",
          fontWeight: "bold",
          marginBottom: "20px",
          fontSize: "2.5rem",
        }}
      >
        Ikechukwu's Facial Recognition System
      </h2>

      {/* Upload Section */}
      <form onSubmit={sendImage} style={{ marginBottom: "20px" }}>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{ marginRight: "10px" }}
        />
        <button type="submit" style={{ padding: "5px 15px" }}>
          Authenticate
        </button>
      </form>

      {/* Camera Section */}
      <div style={{ marginBottom: "20px" }}>
        <video
          ref={videoRef}
          style={{ display: "block", margin: "10px auto", maxWidth: "100%" }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width="640"
          height="480"
        ></canvas>
        <div>
          <button onClick={startCamera} style={{ margin: "5px" }}>
            Start Camera
          </button>
          <button onClick={capturePhoto} style={{ margin: "5px" }}>
            Capture Photo
          </button>
          <button onClick={stopCamera} style={{ margin: "5px" }}>
            Stop Camera
          </button>
        </div>
      </div>

      <div style={{ color: isAuth ? "green" : "red", fontWeight: "bold" }}>
        {uploadResultMessage}
      </div>

      {/* Visitor Image */}
      <img
        src={
          visitorName
            ? visitorName
            : require("./visitors/placeholder.jpeg")
        }
        alt="Visitor"
        height={250}
        width={250}
        style={{ marginTop: "20px", border: "2px solid black" }}
      />
    </div>
  );
}

export default App;
