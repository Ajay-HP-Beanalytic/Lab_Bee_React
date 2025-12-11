# Company Logo Automation Implementation Guide

## 📋 Overview

This guide provides a complete implementation for automatically fetching and caching company logos for report generation. When a user clicks the "Generate Report" button, the system will:

1. **Check cache** - Look for previously fetched logo
2. **Auto-fetch** - If not cached, fetch from web APIs (Clearbit or Brandfetch)
3. **Store locally** - Save logo to filesystem and database
4. **Reuse** - Future reports use cached logo (no repeated API calls)
5. **Manual fallback** - Allow manual upload if auto-fetch fails

---

## 🎯 Features

- ✅ **Automatic logo fetching** based on company name and address
- ✅ **Smart caching** - Fetch once, use forever
- ✅ **Multiple API sources** - Clearbit (free), Brandfetch (better accuracy)
- ✅ **Manual upload option** - Fallback if APIs fail
- ✅ **Local storage** - Logos stored in `frontend/public/company-logos/`
- ✅ **Database tracking** - Logo metadata stored in MySQL
- ✅ **Base64 conversion** - Ready for DOCX generation

---

## 📦 Dependencies Required

### Backend
```bash
cd Backend
npm install axios multer
```

### Frontend
No additional dependencies needed (axios already used)

---

## 🗄️ Step 1: Database Table Creation

### File: `Backend/database_tables.js`

Add this function to create the logo cache table:

```javascript
// Function to create company logos cache table
async function createCompanyLogosTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS company_logos_cache (
      id INT NOT NULL AUTO_INCREMENT,
      company_name VARCHAR(255) NOT NULL,
      company_domain VARCHAR(255),
      logo_filename VARCHAR(255),
      logo_path VARCHAR(500),
      logo_url TEXT,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      fetch_source VARCHAR(50), -- 'clearbit', 'brandfetch', 'google', 'manual'
      PRIMARY KEY(id),
      UNIQUE KEY unique_company (company_name),
      INDEX idx_company_name (company_name),
      INDEX idx_last_used (last_used)
    )`;

  db.query(createTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating company_logos_cache table", err);
    } else {
      console.log("company_logos_cache table created successfully.");
    }
  });
}
```

**Add to initialization section** (find where other tables are created):

```javascript
// In the main initialization function, add:
createCompanyLogosTable();
```

**Run the server once** to create the table:
```bash
cd Backend
npm start
```

---

## 🔧 Step 2: Backend API Implementation

### Create File: `Backend/companyLogoAPI.js`

```javascript
const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { db } = require("./db");

module.exports = function (app) {

  // Directory to store company logos
  const LOGOS_DIR = path.join(__dirname, "../frontend/public/company-logos");

  // Ensure logos directory exists
  const ensureLogosDirectory = async () => {
    try {
      await fs.mkdir(LOGOS_DIR, { recursive: true });
    } catch (error) {
      console.error("Error creating logos directory:", error);
    }
  };

  /**
   * Extract domain from company name and address
   * This is a simple heuristic - you might want to enhance this
   */
  const extractDomain = (companyName, companyAddress) => {
    // Remove common suffixes
    const cleanName = companyName
      .toLowerCase()
      .replace(/\s+(pvt\.?|ltd\.?|limited|inc\.?|corp\.?|llc|llp)/gi, "")
      .trim()
      .replace(/\s+/g, "");

    // Try common domain extensions
    return `${cleanName}.com`;
  };

  /**
   * Fetch logo from Clearbit (Free, no API key needed)
   */
  const fetchFromClearbit = async (domain) => {
    try {
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      const response = await axios.get(logoUrl, {
        responseType: "arraybuffer",
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      return {
        success: true,
        data: response.data,
        source: "clearbit",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Fetch logo from Brandfetch API (Requires API key)
   * Sign up at: https://brandfetch.com/
   */
  const fetchFromBrandfetch = async (domain) => {
    const BRANDFETCH_API_KEY = process.env.BRANDFETCH_API_KEY;

    if (!BRANDFETCH_API_KEY) {
      return { success: false, error: "Brandfetch API key not configured" };
    }

    try {
      const response = await axios.get(
        `https://api.brandfetch.io/v2/brands/${domain}`,
        {
          headers: {
            Authorization: `Bearer ${BRANDFETCH_API_KEY}`,
          },
          timeout: 5000,
        }
      );

      if (response.data?.logos?.[0]?.formats?.[0]?.src) {
        const logoUrl = response.data.logos[0].formats[0].src;

        // Download the logo
        const logoResponse = await axios.get(logoUrl, {
          responseType: "arraybuffer",
          timeout: 5000,
        });

        return {
          success: true,
          data: logoResponse.data,
          source: "brandfetch",
        };
      }

      return { success: false, error: "No logo found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Save logo to filesystem and database
   */
  const saveLogo = async (
    companyName,
    domain,
    logoBuffer,
    source
  ) => {
    await ensureLogosDirectory();

    // Generate filename
    const sanitizedName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    const filename = `${sanitizedName}-${Date.now()}.png`;
    const filepath = path.join(LOGOS_DIR, filename);

    // Save to filesystem
    await fs.writeFile(filepath, logoBuffer);

    // Save to database
    const logoPath = `/company-logos/${filename}`;
    const insertQuery = `
      INSERT INTO company_logos_cache
        (company_name, company_domain, logo_filename, logo_path, fetch_source)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_domain = VALUES(company_domain),
        logo_filename = VALUES(logo_filename),
        logo_path = VALUES(logo_path),
        fetch_source = VALUES(fetch_source),
        last_used = CURRENT_TIMESTAMP
    `;

    await db
      .promise()
      .query(insertQuery, [companyName, domain, filename, logoPath, source]);

    return logoPath;
  };

  /**
   * Convert image buffer to base64 for docx
   */
  const bufferToBase64 = (buffer) => {
    return buffer.toString("base64");
  };

  // ============= API ENDPOINTS =============

  /**
   * GET: Fetch company logo (with caching)
   * Query params: companyName, companyAddress
   */
  app.get("/api/company-logo", async (req, res) => {
    try {
      const { companyName, companyAddress } = req.query;

      if (!companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      // Check if logo exists in cache
      const cacheQuery = `
        SELECT logo_path, logo_filename
        FROM company_logos_cache
        WHERE company_name = ?
      `;

      const [cachedResults] = await db.promise().query(cacheQuery, [companyName]);

      if (cachedResults.length > 0) {
        const { logo_path, logo_filename } = cachedResults[0];
        const filepath = path.join(LOGOS_DIR, logo_filename);

        try {
          const logoBuffer = await fs.readFile(filepath);
          const base64Logo = bufferToBase64(logoBuffer);

          // Update last_used timestamp
          await db
            .promise()
            .query("UPDATE company_logos_cache SET last_used = CURRENT_TIMESTAMP WHERE company_name = ?", [companyName]);

          return res.json({
            success: true,
            cached: true,
            logoPath: logo_path,
            logoBase64: base64Logo,
            source: "cache",
          });
        } catch (fileError) {
          console.error("Cached logo file not found, fetching new one");
          // File missing, continue to fetch new logo
        }
      }

      // Logo not in cache, fetch from APIs
      const domain = extractDomain(companyName, companyAddress || "");

      // Try Clearbit first (free, no API key)
      let logoResult = await fetchFromClearbit(domain);

      // If Clearbit fails, try Brandfetch (requires API key)
      if (!logoResult.success) {
        logoResult = await fetchFromBrandfetch(domain);
      }

      if (!logoResult.success) {
        return res.status(404).json({
          success: false,
          error: "Could not fetch company logo",
          message: "Please upload logo manually",
        });
      }

      // Save logo
      const logoPath = await saveLogo(
        companyName,
        domain,
        logoResult.data,
        logoResult.source
      );

      const base64Logo = bufferToBase64(logoResult.data);

      return res.json({
        success: true,
        cached: false,
        logoPath,
        logoBase64: base64Logo,
        source: logoResult.source,
      });
    } catch (error) {
      console.error("Error fetching company logo:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST: Manually upload company logo
   */
  const multer = require("multer");
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/company-logo/upload", upload.single("logo"), async (req, res) => {
    try {
      const { companyName } = req.body;
      const logoBuffer = req.file.buffer;

      if (!companyName || !logoBuffer) {
        return res.status(400).json({ error: "Company name and logo are required" });
      }

      const logoPath = await saveLogo(companyName, null, logoBuffer, "manual");
      const base64Logo = bufferToBase64(logoBuffer);

      return res.json({
        success: true,
        logoPath,
        logoBase64: base64Logo,
        source: "manual",
      });
    } catch (error) {
      console.error("Error uploading company logo:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE: Clear logo cache for a company
   */
  app.delete("/api/company-logo", async (req, res) => {
    try {
      const { companyName } = req.query;

      if (!companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      // Get logo filename before deleting
      const [results] = await db
        .promise()
        .query("SELECT logo_filename FROM company_logos_cache WHERE company_name = ?", [companyName]);

      if (results.length > 0) {
        const { logo_filename } = results[0];
        const filepath = path.join(LOGOS_DIR, logo_filename);

        // Delete file
        try {
          await fs.unlink(filepath);
        } catch (err) {
          console.error("Error deleting logo file:", err);
        }

        // Delete from database
        await db
          .promise()
          .query("DELETE FROM company_logos_cache WHERE company_name = ?", [companyName]);

        return res.json({ success: true, message: "Logo deleted successfully" });
      }

      return res.status(404).json({ success: false, error: "Logo not found" });
    } catch (error) {
      console.error("Error deleting company logo:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};
```

---

## 🔗 Step 3: Register API Routes

### File: `Backend/index.js` (or your main server file)

Find where you register other API routes and add:

```javascript
// Import the company logo API
const companyLogoAPI = require("./companyLogoAPI");

// Register routes
companyLogoAPI(app);
```

**Example location in index.js:**
```javascript
// After other API registrations
const JobcardBackend = require("./JobcardBackend");
const EMIBackend = require("./EMIBackend");
const companyLogoAPI = require("./companyLogoAPI");  // Add this

// Register routes
JobcardBackend(app, io);
EMIBackend(app, io);
companyLogoAPI(app);  // Add this
```

---

## 🌐 Step 4: Environment Variables

### File: `Backend/.env`

Add these optional API keys:

```bash
# Company Logo API Keys (Optional)
# Clearbit works without API key (free)
# Brandfetch requires API key (sign up at https://brandfetch.com/)
BRANDFETCH_API_KEY=your_api_key_here
```

**Notes:**
- **Clearbit** - No API key needed, works out of the box
- **Brandfetch** - Better accuracy, requires free API key (100 requests/month)
- Leave `BRANDFETCH_API_KEY` blank if you only want to use Clearbit

---

## ⚛️ Step 5: Frontend Service

### Create File: `frontend/src/utils/companyLogoService.js`

```javascript
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";

/**
 * Fetch company logo (cached or from API)
 * @param {string} companyName
 * @param {string} companyAddress
 * @returns {Promise<{success: boolean, logoBase64?: string, logoPath?: string, cached?: boolean, source?: string}>}
 */
export const fetchCompanyLogo = async (companyName, companyAddress) => {
  try {
    const response = await axios.get(`${serverBaseAddress}/api/company-logo`, {
      params: { companyName, companyAddress },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching company logo:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch logo",
    };
  }
};

/**
 * Manually upload company logo
 * @param {string} companyName
 * @param {File} logoFile
 * @returns {Promise<{success: boolean, logoBase64?: string, logoPath?: string}>}
 */
export const uploadCompanyLogo = async (companyName, logoFile) => {
  try {
    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("logo", logoFile);

    const response = await axios.post(
      `${serverBaseAddress}/api/company-logo/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading company logo:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to upload logo",
    };
  }
};

/**
 * Delete cached company logo
 * @param {string} companyName
 * @returns {Promise<{success: boolean}>}
 */
export const deleteCompanyLogo = async (companyName) => {
  try {
    const response = await axios.delete(`${serverBaseAddress}/api/company-logo`, {
      params: { companyName },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting company logo:", error);
    return { success: false, error: error.message };
  }
};
```

---

## 📊 Step 6: Integration with Report Generation

### Example: Update your report generation component

Find the component where you generate reports (likely in `Reports/` folder). Here's how to integrate:

```javascript
import { fetchCompanyLogo } from "../utils/companyLogoService";
import { useState } from "react";
import { CircularProgress, Alert, Button } from "@mui/material";
import { toast } from "react-toastify";

const YourReportComponent = () => {
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [logoError, setLogoError] = useState(null);

  const handleGenerateReport = async (comprehensiveData, reportConfig) => {
    setFetchingLogo(true);
    setLogoError(null);

    try {
      // Fetch company logo automatically
      console.log("Fetching logo for:", comprehensiveData.companyName);

      const logoResult = await fetchCompanyLogo(
        comprehensiveData.companyName,
        comprehensiveData.companyAddress
      );

      console.log("Logo fetch result:", logoResult);

      // Prepare report config with logo
      const updatedReportConfig = {
        ...reportConfig,
        companyLogoBase64: logoResult.success ? logoResult.logoBase64 : null,
      };

      if (logoResult.success) {
        if (logoResult.cached) {
          toast.info("Using cached company logo");
        } else {
          toast.success(`Logo fetched from ${logoResult.source}`);
        }
      } else {
        setLogoError("Could not fetch logo automatically. Report will be generated without logo.");
        toast.warning("Report generated without logo");
      }

      // Generate report with logo
      const firstPageContent = createFirstPage(comprehensiveData, updatedReportConfig);

      // ... rest of your report generation logic
      // generateDocxReport(firstPageContent, ...);

      toast.success("Report generated successfully!");

    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setFetchingLogo(false);
    }
  };

  return (
    <div>
      {logoError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {logoError}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => handleGenerateReport(comprehensiveData, reportConfig)}
        disabled={fetchingLogo}
      >
        {fetchingLogo ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Fetching Logo...
          </>
        ) : (
          "Generate Report"
        )}
      </Button>
    </div>
  );
};

export default YourReportComponent;
```

---

## 🎨 Step 7: Optional - Manual Logo Upload UI Component

### Create File: `frontend/src/components/CompanyLogoUploader.jsx`

```javascript
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadCompanyLogo } from "../utils/companyLogoService";
import { toast } from "react-toastify";

export default function CompanyLogoUploader({ companyName, onUploadSuccess }) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const result = await uploadCompanyLogo(companyName, selectedFile);

      if (result.success) {
        toast.success("Logo uploaded successfully!");
        setOpen(false);

        if (onUploadSuccess) {
          onUploadSuccess(result);
        }

        // Reset state
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => setOpen(true)}
      >
        Upload Logo
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Company Logo</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Company Name"
              value={companyName}
              disabled
              sx={{ mb: 2 }}
            />

            <input
              accept="image/*"
              style={{ display: "none" }}
              id="logo-upload-input"
              type="file"
              onChange={handleFileSelect}
            />

            <label htmlFor="logo-upload-input">
              <Button variant="contained" component="span" fullWidth>
                Select Logo Image
              </Button>
            </label>

            {previewUrl && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  style={{ maxWidth: "100%", maxHeight: 200 }}
                />
              </Box>
            )}

            {selectedFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

**Usage:**
```javascript
<CompanyLogoUploader
  companyName={comprehensiveData.companyName}
  onUploadSuccess={(result) => {
    console.log("Logo uploaded:", result);
    // Update reportConfig with new logo
  }}
/>
```

---

## 🧪 Step 8: Testing

### 1. Test Auto-Fetch (Clearbit)
```bash
# In browser console or Postman
GET http://localhost:4000/api/company-logo?companyName=Google&companyAddress=Mountain View, CA

# Expected response:
{
  "success": true,
  "cached": false,
  "logoPath": "/company-logos/google-1234567890.png",
  "logoBase64": "iVBORw0KGgoAAAANSUhEUg...",
  "source": "clearbit"
}
```

### 2. Test Cache
```bash
# Call same endpoint again - should be instant
GET http://localhost:4000/api/company-logo?companyName=Google&companyAddress=Mountain View, CA

# Expected response:
{
  "success": true,
  "cached": true,  // <-- Now from cache
  "logoPath": "/company-logos/google-1234567890.png",
  "logoBase64": "iVBORw0KGgoAAAANSUhEUg...",
  "source": "cache"
}
```

### 3. Test Manual Upload
Use Postman or the UI component to upload a logo.

### 4. Check Database
```sql
SELECT * FROM company_logos_cache;
```

Expected output:
```
| id | company_name | company_domain | logo_filename          | logo_path                    | fetch_source | fetched_at          | last_used           |
|----|--------------|----------------|------------------------|------------------------------|--------------|---------------------|---------------------|
| 1  | Google       | google.com     | google-1234567890.png  | /company-logos/google-...png | clearbit     | 2025-12-11 10:30:00 | 2025-12-11 10:35:00 |
```

### 5. Check File Storage
```bash
# Check if logo files are saved
ls frontend/public/company-logos/
```

---

## 🔍 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/company-logo?companyName=X&companyAddress=Y` | Fetch logo (cached or from API) |
| `POST` | `/api/company-logo/upload` | Manually upload logo |
| `DELETE` | `/api/company-logo?companyName=X` | Delete cached logo |

---

## 📈 Logo API Options

### 1. Clearbit Logo API (Free, No API Key)
- **Endpoint:** `https://logo.clearbit.com/{domain}`
- **Pros:** Free, no signup, instant
- **Cons:** Lower accuracy, only works for companies with websites
- **Best for:** Quick implementation, common companies

### 2. Brandfetch API (Free Tier: 100/month)
- **Website:** https://brandfetch.com/
- **Signup:** Free account required
- **Pros:** Better accuracy, more metadata, higher quality logos
- **Cons:** Requires API key, rate limits
- **Best for:** Production use, better accuracy

### 3. Manual Upload (Always Available)
- **Pros:** 100% accurate, no API dependency
- **Cons:** Requires user action
- **Best for:** Fallback when APIs fail

---

## 🚀 Deployment Checklist

- [ ] Database table created (`company_logos_cache`)
- [ ] Backend API file created (`companyLogoAPI.js`)
- [ ] API routes registered in main server file
- [ ] Frontend service created (`companyLogoService.js`)
- [ ] Logo directory created (`frontend/public/company-logos/`)
- [ ] Environment variables configured (`.env`)
- [ ] Dependencies installed (`axios`, `multer`)
- [ ] Report generation updated to use logo service
- [ ] Tested with real company names
- [ ] Manual upload UI added (optional)

---

## ⚠️ Important Considerations

### Security
- ✅ **No sensitive data** - Only company names/addresses sent to APIs
- ✅ **File validation** - Only images allowed, size limits enforced
- ✅ **SQL injection protected** - Using parameterized queries

### Copyright/Legal
- ⚠️ **Trademark notice** - Company logos are trademarked
- ⚠️ **Fair use** - Using logos for report generation may fall under fair use
- ⚠️ **Terms of service** - Check API provider terms
- ⚠️ **Client permission** - Consider getting permission to use their logo

### Performance
- ✅ **Caching** - Logos fetched once, reused forever
- ✅ **Timeout** - API calls timeout after 5 seconds
- ✅ **Fallback** - Manual upload if auto-fetch fails
- ✅ **Async** - Non-blocking, shows loading state

### Accuracy
- ⚠️ **Domain guessing** - May guess wrong domain for company
- ⚠️ **Company name ambiguity** - "Apple" could be Apple Inc. or Apple Records
- ✅ **Manual override** - Users can upload correct logo

---

## 🔄 Maintenance

### Clean Old Logos (Optional)
Add a cleanup job to delete logos not used in 6+ months:

```javascript
// Backend/cleanupOldLogos.js
const { db } = require("./db");
const fs = require("fs").promises;
const path = require("path");

async function cleanupOldLogos() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get old logos
    const [oldLogos] = await db.promise().query(
      "SELECT logo_filename FROM company_logos_cache WHERE last_used < ?",
      [sixMonthsAgo]
    );

    console.log(`Found ${oldLogos.length} old logos to delete`);

    // Delete files and database entries
    for (const logo of oldLogos) {
      const filepath = path.join(__dirname, "../frontend/public/company-logos", logo.logo_filename);

      try {
        await fs.unlink(filepath);
        await db.promise().query(
          "DELETE FROM company_logos_cache WHERE logo_filename = ?",
          [logo.logo_filename]
        );
        console.log(`Deleted: ${logo.logo_filename}`);
      } catch (err) {
        console.error(`Error deleting ${logo.logo_filename}:`, err);
      }
    }

    console.log("Cleanup complete");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

// Run cleanup
cleanupOldLogos();
```

**Run monthly:**
```bash
node Backend/cleanupOldLogos.js
```

---

## 🐛 Troubleshooting

### Issue: Logo not fetching
**Cause:** Wrong domain guessed
**Solution:**
1. Check console logs for domain being used
2. Manually upload logo for that company
3. Or improve `extractDomain()` function

### Issue: "File not found" error when using cached logo
**Cause:** Logo file deleted but database entry exists
**Solution:**
```sql
-- Clear cache for that company
DELETE FROM company_logos_cache WHERE company_name = 'Company Name';
```

### Issue: API rate limit exceeded
**Cause:** Too many requests to Brandfetch
**Solution:**
1. Use Clearbit (no limits)
2. Cache more aggressively
3. Upgrade Brandfetch plan

### Issue: Logo quality poor
**Cause:** Low-res logo from API
**Solution:** Manually upload higher quality version

---

## 📞 API Provider Documentation

- **Clearbit Logo API:** https://clearbit.com/logo
- **Brandfetch API:** https://docs.brandfetch.com/
- **Multer (File Upload):** https://github.com/expressjs/multer

---

## ✅ Summary

This implementation provides:
1. **Automatic** logo fetching when generating reports
2. **Smart caching** to avoid repeated API calls
3. **Manual upload** fallback for accuracy
4. **Database tracking** for all logos
5. **Ready for DOCX** - Returns base64 for document generation

**Next Steps:**
1. Review this guide
2. Create database table
3. Add backend API file
4. Test with real company names
5. Integrate with report generation
6. Deploy and monitor

---

**Questions or Issues?**
Refer to the troubleshooting section or check API provider documentation.
