import cv2
import sys
import os

# Add the parent directory to the path so we can import the module correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.yolo_detector import analyze_frame

def main():
    print("Initializing webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open the webcam. Please ensure it's connected and not used by another application.")
        return

    print("Webcam successfully opened.")
    print("Press 'q' in the window to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame from webcam.")
            break

        # Process the frame through the YOLO detector
        # Default conf is 0.5 for general objects, but earphone requires >= 0.75 internally
        result = analyze_frame(frame, conf=0.5)
        
        # Get the annotated frame (with boxes drawn)
        annotated_frame = result["annotated_frame"]
        
        # Display the detections locally in the terminal (optional)
        if result["suspicious"]:
            # Uncomment below to print detections to the terminal
            # print("Detections:")
            # for det in result["detections"]:
            #     print(f"  - {det['label']} (conf: {det['confidence']:.2f})")
            pass

        # Show the frame in an OpenCV window
        cv2.imshow("ExamGuard YOLO Test (Press 'q' to quit)", annotated_frame)

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Exiting...")
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
