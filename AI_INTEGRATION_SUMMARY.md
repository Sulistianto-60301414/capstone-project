# AI Integration Summary

## Scope of This Summary

This file summarizes the recent work done to integrate the ML-based anomaly detection flow into the hospital IoT security dashboard.

## What We Added

- Built a new `Main` dashboard page that combines cyber monitoring, traffic information, and device/vital information in one view.
- Added a visible anomaly banner, risk score, attack category, confidence, traffic metrics, and an incident feed.
- Added a dashboard toast notification so the user is alerted immediately whenever an anomaly-related alert is generated.

## Backend Integration

Recent backend work in `server.js` included:

- Loading `ML integration/cleaned_data.csv` as the active simulated pipeline source.
- Replaying dataset rows on a timer to simulate live traffic and telemetry updates.
- Converting each dataset row into:
  - telemetry data
  - status data
  - IPFIX-style summary data
  - cyber/anomaly event data
- Broadcasting a new `cyber` WebSocket message type to the frontend.
- Generating dashboard alerts whenever an anomalous sample is detected.

## ML Model Integration

We changed the anomaly logic so it uses the exported ML artifacts instead of only heuristic scoring.

The current flow is:

1. Load the feature order from `ML integration/feature/features.joblib`.
2. Load `ML integration/models/iforest_pipe.joblib`.
3. Score each row with Isolation Forest first.
4. If the sample is anomalous, pass the same feature-ordered row into `ML integration/models/rf_pipe.joblib`.
5. Use the Random Forest result as the attack prediction shown in the dashboard.

To support this, we added:

- `ML integration/score_flow.py`

This Python bridge script:
- loads the joblib artifacts
- builds a one-row dataframe in the correct feature order
- runs the Isolation Forest model first
- runs the Random Forest model only if the sample is anomalous
- returns JSON back to the Node.js backend

## Python Environment Work

During integration, the ML scorer initially failed because Python dependencies were missing.

We installed:
- `joblib`
- `pandas`
- `numpy`
- `scikit-learn`

We then found a model compatibility problem:
- the saved models were created with `scikit-learn 1.6.1`
- `scikit-learn 1.8.0` could not unpickle them correctly

To fix that, we downgraded to:
- `scikit-learn==1.6.1`

After that, the scorer was able to load and return valid results.

## Frontend Integration

Recent frontend changes included updates to:
- `public/index.html`
- `public/app.js`
- `public/styles.css`

These changes added:
- a new default `Main` tab
- anomaly summary banner
- risk and traffic trend charts
- incident feed
- live alert toast
- cyber/device cards
- vitals cards

## Vitals Bug We Fixed

At one point, Temperature showed correctly but SpO2, Heart Rate, and Respiration were blank.

Root cause:
- the backend created those fields from the dataset
- but `extractTelemetry()` in `server.js` did not include them in the allowed telemetry field list

Fix:
- added the missing telemetry fields so they are now sent to the frontend

Important note:
- some early dataset rows contain zero values for certain vitals, so even after the fix some samples may still display low or empty-looking readings depending on the current replay row

## Alert Behavior

We made sure anomalies are visible in the dashboard, not just logged in the background.

Current behavior:
- anomalous traffic creates a dashboard alert
- the anomaly banner updates
- the incident feed updates
- the alerts table updates
- a visible toast notification appears on screen

## Git / GitHub Work

We also pushed the project to GitHub.

During push, GitHub rejected the repository because:
- `ML integration/models/rf_pipe.joblib` exceeded GitHub's normal file size limit

To fix that, we:
- initialized Git LFS
- tracked the `.joblib` model files with Git LFS
- migrated the commit history so the model files became LFS objects
- pushed the repository successfully

## Current State

The current AI integration state is:

- dataset-based simulation is active
- exported ML models are wired into the backend through Python
- anomaly results are shown on the new main dashboard page
- anomaly alerts are visible to the user in the UI
- the repository is pushed to GitHub with large ML files handled through Git LFS

## Files Most Relevant to This Work

- `server.js`
- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `ML integration/cleaned_data.csv`
- `ML integration/feature/features.joblib`
- `ML integration/models/iforest_pipe.joblib`
- `ML integration/models/rf_pipe.joblib`
- `ML integration/score_flow.py`
