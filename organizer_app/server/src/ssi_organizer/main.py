from flask import Flask, request, jsonify
import json
import requests
from ssi_organizer import app
import os

DATABASE_FILE = "data/meetings.json"

# Function to read the meetings from the database
def read_meetings():
    try:
        with open(DATABASE_FILE, "r") as file:
            meetings = json.load(file)
    except FileNotFoundError:
        meetings = {}
    return meetings

# Function to write meetings to the database
def write_meetings(meetings):
    with open(DATABASE_FILE, "w") as file:
        json.dump(meetings, file)

# POST API to create a meeting
@app.route("/api/meetings", methods=["POST"])
def create_meeting():
    
    data = request.json

    # Generate a unique meeting ID (you can use any suitable method here)
    meeting_id = data["id"]

    # Extract meeting details from the request data
    organizer = data["organizer"]
    participants = data["participants"]
    start_time = data["startTime"]
    end_time = data["endTime"]
    duration = data["duration"]
    camera_access = data["camera_access"]

    # Prepare meeting details
    meeting_details = {
        "Organizer": organizer,
        "Participants": participants,
        "StartTime": start_time,
        "EndTime": end_time,
        "Duration": duration,
        "CameraAccess": camera_access
    }

    # Read existing meetings from the database
    meetings = read_meetings()

    if meeting_id in meetings:
        
        return jsonify(data={"message": "Meeting is already present","success":True},status=200, mimetype='application/json')
    
    # Add the new meeting to the database
    meetings[meeting_id] = meeting_details
    # Write updated meetings back to the database
    write_meetings(meetings)

    return jsonify(data={"message": "Meeting created successfully","success":True},status=200, mimetype='application/json')

# GET API to retrieve meeting details by meeting ID
@app.route("/api/meetings/<meeting_id>", methods=["GET"])
def get_meeting(meeting_id):
    # Read existing meetings from the database
    meetings = read_meetings()
    # Check if the meeting ID exists in the database
    if meeting_id in meetings:
        return jsonify(data=meetings[meeting_id],status=200, mimetype='application/json')
    else:
        return jsonify(data={"error": "Meeting not found"},status=404, mimetype='application/json')

def main():
    app.run(debug=True)
