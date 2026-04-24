# AutoCert

A React application for generating and emailing personalized certificates from Google Slides templates — one at a time or in bulk via CSV upload.

---

## Overview

AutoCert eliminates the manual work of creating and distributing certificates. Select a Google Slides template from your shared Drive folder, fill in recipient details (or upload a CSV for bulk sending), and the app handles the rest — generating a personalized certificate and emailing it directly to the recipient through an automated n8n workflow.

---

## Features

- **Template Gallery** — Live thumbnail previews pulled from a Google Drive folder. Refresh anytime, click to select.
- **Single Mode** — Issue a certificate to one recipient instantly via a simple form.
- **Bulk CSV Upload** — Drag-and-drop a CSV file to send to many recipients in one session.
- **Per-Row Templates** — Add a `templateName` column to your CSV to assign a different template to each recipient.
- **Live Status Feed** — Watch each certificate go from Queued → Sending → Sent / Failed in real time during bulk sends.
- **Unique Certificate IDs** — Every certificate gets an auto-generated `CERT-<timestamp>` ID for traceability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (with hooks) |
| Template Storage | Google Drive API v3 |
| Automation Workflow | n8n (self-hosted webhook) |
| Certificate Engine | Google Slides (copy + fill) |
| Delivery | Gmail (via n8n workflow) |

---

## How It Works

```
User fills form / uploads CSV
        ↓
App POSTs JSON to n8n webhook
        ↓
n8n copies the selected Google Slides template
        ↓
n8n replaces placeholders ({{fullName}}, {{date}}, etc.)
        ↓
n8n exports as PDF and emails to recipient
```

### Webhook Payload

Every certificate request sends the following JSON to the webhook:

```json
{
  "templateId": "1abc...xyz",
  "templateName": "Certificate of Completion",
  "templateLink": "https://docs.google.com/presentation/d/...",
  "fullName": "Juan dela Cruz",
  "email": "juan@example.com",
  "date": "2025-03-23",
  "certificateId": "CERT-1742694000000",
  "timestamp": "2025-03-23T08:00:00.000Z"
}
```

---

## Prerequisites

- Node.js 18+
- A Google Cloud project with the **Drive API** enabled
- A Google Drive folder containing one or more **Google Slides** certificate templates
- A running **n8n** instance with the certificate generation workflow active
- Environment variables configured (see below)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ZeinReyes/AutoCert.git
cd AutoCert
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
REACT_APP_API_KEY=your_google_drive_api_key
REACT_APP_TEMPLATES_FOLDER_ID=your_google_drive_folder_id
```

| Variable | Description |
|---|---|
| `REACT_APP_API_KEY` | Google Drive API key (read-only access is sufficient) |
| `REACT_APP_TEMPLATES_FOLDER_ID` | ID of the Drive folder containing your Slides templates |

> The folder ID is the string in the folder's URL after `/folders/`.

### 4. Run the app

```bash
npm start
```

The app runs at `http://localhost:3000` by default.

---

## Google Drive Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Google Drive API**
4. Create an **API key** under Credentials (restrict it to the Drive API for security)
5. Create a shared Drive folder and upload your Google Slides templates to it
6. Copy the folder ID from the URL and add it to your `.env`

> Your Slides templates should contain placeholder text that your n8n workflow knows how to replace (e.g., `{{fullName}}`, `{{date}}`). The exact placeholder syntax depends on your n8n workflow configuration.

---

## CSV Format

### Simple CSV (one template for all recipients)

```csv
fullName,email,date
Juan dela Cruz,juan@example.com,2025-03-23
Maria Santos,maria@example.com,2025-03-23
```

### CSV with Templates (different template per recipient)

```csv
fullName,email,date,templateName
Juan dela Cruz,juan@example.com,2025-03-23,Certificate of Completion
Maria Santos,maria@example.com,2025-03-23,Certificate of Recognition
Jose Rizal,jose@example.com,2025-03-23,Certificate of Appreciation
```

Both CSV templates are available as downloads directly inside the app (Bulk Upload tab).

### Template Resolution Rules

| Condition | Result |
|---|---|
| Template selected in gallery | Used for **all** rows, `templateName` column ignored |
| No selection + `templateName` column present | Each row uses its own named template |
| No selection + no `templateName` column | Upload is blocked — must select a template or add the column |

> `templateName` matching is case-insensitive and trims whitespace, but must otherwise exactly match the Google Slides filename in Drive.

---


## Environment Variables Reference

```env
# .env.example

# Google Drive API key (read-only)
REACT_APP_API_KEY=

# ID of the Google Drive folder containing Slides templates
REACT_APP_TEMPLATES_FOLDER_ID=
```

> Never commit your `.env` file. Add it to `.gitignore`.

---

## n8n Webhook

The app sends all certificate requests to:

```
POST https://infinityw.com/webhook/generate-certificate
```

To adapt this project to your own infrastructure, update the `N8N_WEBHOOK_URL` constant in `GenerateCertificate.jsx`:

```js
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/generate-certificate';
```

The n8n workflow is responsible for:
- Copying the Google Slides template
- Replacing placeholder text with recipient data
- Exporting the certificate (PDF or image)
- Emailing it to the recipient

---

## Known Limitations

- Certificates are sent **sequentially** during bulk sends — very large batches (200+ rows) will take time
- There is **no duplicate check** — re-uploading the same CSV will re-send to all rows
- Closing the browser tab mid-bulk-send will **interrupt** the process; unsent certificates will not be delivered
- The app relies on the n8n workflow being **active and reachable** at all times
