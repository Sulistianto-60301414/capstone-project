# AI Integration Summary

## Overview

This project integrates AI-based anomaly detection with a cyber monitoring dashboard for hospital IoT and IoMT environments.

The current version no longer uses the old single-model pipeline. Instead, it uses three separate AI components:

- a network model
- a process model
- a memory model

Each model produces its own anomaly result and attack type prediction. Those outputs are then combined through a fusion step to generate one final alert for the dashboard.

## Main Goal

The main goal of the integration was to connect the AI layer to the cyber dashboard in a way that is simple to understand and useful for monitoring.

Instead of showing only one anomaly score, the dashboard now shows:

- what each model detected
- whether each part looks anomalous
- what attack type each model predicts
- which system part is likely affected
- one final fused alert with severity and a short report

## AI Pipeline Structure

The current AI pipeline is based on the `AI part` folder.

It includes separate artifacts for:

- network detection
- process detection
- memory detection

For each of the three domains, the system uses:

- an Isolation Forest model for anomaly detection
- a Random Forest model for attack classification
- the saved feature definitions and encoders needed to prepare the data correctly

## How the AI Flow Works

The current logic works like this:

1. Network, process, and memory data samples are loaded.
2. Each model scores its own input independently.
3. Each domain produces:
   - anomaly yes/no
   - predicted attack type
   - confidence
   - anomaly score
4. The outputs of all three models are fused.
5. The fusion layer generates the final dashboard alert.

The final fused result includes:

- whether the alert is true or false
- final severity
- which parts triggered the alert
- which parts are affected
- the likely final attack type
- a short human-readable report

## Fusion Logic

The fusion layer was added to avoid relying on only one model.

The idea is:

- each model gives its own local decision
- the dashboard does not alert the user based on only one raw output
- instead, the system combines the model decisions into one final interpretation

This makes the monitoring view more practical, because the user can see both:

- the detailed model-level detections
- the final system-level alert

In the current design, the final alert can describe things such as:

- which part was attacked
- which models triggered the alert
- whether the severity should be treated as medium or high
- what attack type is most likely after fusion

## Dashboard Integration

The dashboard was updated so the AI results are visible in a simple way.

The main page now includes:

- a top fusion alert banner
- a separate card for the network model
- a separate card for the process model
- a separate card for the memory model
- a final alert card showing the fused decision
- traffic and device context
- vital sign context
- a short incident feed
- popup-style alert notifications

This means the dashboard now combines:

- cyber monitoring data
- AI detection results
- a final fused alert report

## Backend Integration

The backend was updated to connect the AI layer with the dashboard.

The server now:

- loads the AI-related sample data
- runs the model scoring pipeline through Python
- receives structured AI outputs
- converts them into dashboard events
- sends them to the frontend through WebSocket updates

The backend also creates alerts based on the fused decision, so the interface can notify the user whenever the AI layer flags suspicious activity.

## Frontend Integration

The frontend was updated to visualize the AI results clearly.

It now displays:

- model-by-model anomaly status
- model-by-model attack type
- fusion severity
- triggered components
- affected part
- final report text
- final attack label
- confidence and score

This makes the dashboard easier to read for someone who wants both technical detail and a simple overall alert.

## Important Note About Data

At the moment, the system is running in a simulated pipeline mode using dataset files and saved model artifacts.

That means:

- the AI integration is active
- the dashboard behavior is real in terms of logic and model flow
- the pipeline is currently driven by prepared sample data rather than live production traffic

This setup is being used to validate the integration between the AI layer and the cyber dashboard before moving further into live deployment.

## IPFIX Status

The IPFIX part is still not fully resolved.

What is currently true:

- the dashboard-side handling for cyber and AI alerts is working
- the AI fusion flow is working with simulated inputs
- the original live IPFIX collection path is still not fully fixed

The main unresolved point is that live IPFIX data collection and delivery still need more work before the full real-time pipeline can be considered complete.

So at this stage:

- AI fusion with the dashboard is integrated
- simulation-based monitoring is working
- IPFIX integration still needs to be fixed and validated later

## Current Result

The current integrated system can now:

- score network behavior
- score process behavior
- score memory behavior
- show all three model outputs separately
- fuse the outputs into one final alert
- tell the user which part is likely under attack
- display the result directly in the dashboard
- raise a visible alert when suspicious activity is detected

## High-Level Summary

In simple terms, the recent work connected the AI part and the cyber dashboard into one monitoring flow.

Before, the system focused on simpler anomaly display logic.
Now, it supports a multi-model AI pipeline where network, process, and memory detection work together.

The final result is a dashboard that does not just say that something is wrong. It also explains:

- which model detected the issue
- what attack type was predicted
- which part of the system seems affected
- what the final fused alert should be

## Main Files Related to This Integration

- `server.js`
- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `AI part/fusion_score.py`
- `AI part/network_if.joblib`
- `AI part/network_rf.joblib`
- `AI part/process_if.joblib`
- `AI part/process_rf.joblib`
- `AI part/memory_if.joblib`
- `AI part/memory_rf.joblib`
